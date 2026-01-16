import { useState, useEffect, useCallback } from "react";
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from "@/lib/firebase";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  role?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get the ID token and sync with backend
        const idToken = await firebaseUser.getIdToken();
        
        try {
          // Sync user with backend and get role info
          const response = await fetch("/api/auth/firebase-sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            })
          });

          if (response.ok) {
            const userData = await response.json();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              firstName: userData.firstName || firebaseUser.displayName?.split(" ")[0] || null,
              lastName: userData.lastName || firebaseUser.displayName?.split(" ").slice(1).join(" ") || null,
              displayName: firebaseUser.displayName,
              profileImageUrl: firebaseUser.photoURL,
              role: userData.role
            });
          } else {
            // Use basic Firebase user info if sync fails
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              firstName: firebaseUser.displayName?.split(" ")[0] || null,
              lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || null,
              displayName: firebaseUser.displayName,
              profileImageUrl: firebaseUser.photoURL,
              role: "client"
            });
          }
        } catch (err) {
          // Fallback to basic user info
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            firstName: firebaseUser.displayName?.split(" ")[0] || null,
            lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || null,
            displayName: firebaseUser.displayName,
            profileImageUrl: firebaseUser.photoURL,
            role: "client"
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
      return false;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string, requestedRole: string = "client") => {
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, {
        displayName: `${firstName} ${lastName}`
      });
      
      // Sync with backend and pass requested role
      const idToken = await credential.user.getIdToken();
      await fetch("/api/auth/firebase-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName,
          photoURL: credential.user.photoURL,
          requestedRole
        })
      });
      
      return true;
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    }
  }, []);

  const getIdToken = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return currentUser.getIdToken();
    }
    return null;
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    getIdToken,
    isAdmin: user?.role === "admin",
    isStylist: user?.role === "stylist",
    isClient: user?.role === "client"
  };
}

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "Cette adresse email est déjà utilisée";
    case "auth/invalid-email":
      return "Adresse email invalide";
    case "auth/operation-not-allowed":
      return "Opération non autorisée";
    case "auth/weak-password":
      return "Le mot de passe doit contenir au moins 6 caractères";
    case "auth/user-disabled":
      return "Ce compte a été désactivé";
    case "auth/user-not-found":
      return "Aucun compte trouvé avec cette adresse email";
    case "auth/wrong-password":
      return "Mot de passe incorrect";
    case "auth/invalid-credential":
      return "Email ou mot de passe incorrect";
    case "auth/too-many-requests":
      return "Trop de tentatives. Veuillez réessayer plus tard";
    default:
      return "Une erreur est survenue. Veuillez réessayer";
  }
}
