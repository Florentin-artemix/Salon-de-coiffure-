import admin from "firebase-admin";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY is not set");
} else {
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
}

export const verifyIdToken = async (idToken: string) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null;
  }
};

export const getFirebaseUser = async (uid: string) => {
  try {
    const user = await admin.auth().getUser(uid);
    return user;
  } catch (error) {
    console.error("Error getting Firebase user:", error);
    return null;
  }
};

export default admin;
