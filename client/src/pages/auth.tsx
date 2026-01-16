import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Crown, AlertCircle, User, Scissors, Shield } from "lucide-react";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login, register, error, isAuthenticated } = useAuth();
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accountType, setAccountType] = useState<"client" | "stylist" | "admin">("client");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const success = await login(loginEmail, loginPassword);
    setLoginLoading(false);
    if (success) {
      navigate("/");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Les mots de passe ne correspondent pas");
      return;
    }
    
    if (registerPassword.length < 6) {
      setRegisterError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    setRegisterLoading(true);
    const success = await register(registerEmail, registerPassword, firstName, lastName, accountType);
    setRegisterLoading(false);
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Crown className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-serif">King & Queen Salon</CardTitle>
          <CardDescription>
            Connectez-vous ou créez un compte pour réserver
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Connexion</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Inscription</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    data-testid="input-login-email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    data-testid="input-login-password"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginLoading}
                  data-testid="button-login"
                >
                  {loginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                {(error || registerError) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{registerError || error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Jean"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Dupont"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    data-testid="input-register-email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">Mot de passe</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    data-testid="input-register-password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    data-testid="input-confirm-password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Type de compte</Label>
                  <RadioGroup
                    value={accountType}
                    onValueChange={(val) => setAccountType(val as "client" | "stylist" | "admin")}
                    className="grid grid-cols-3 gap-3"
                  >
                    <div>
                      <RadioGroupItem value="client" id="type-client" className="peer sr-only" />
                      <Label
                        htmlFor="type-client"
                        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-border p-3 text-center transition-all hover-elevate peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        data-testid="type-client"
                      >
                        <User className="h-5 w-5 text-primary" />
                        <span className="text-xs font-medium">Client</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="stylist" id="type-stylist" className="peer sr-only" />
                      <Label
                        htmlFor="type-stylist"
                        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-border p-3 text-center transition-all hover-elevate peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        data-testid="type-stylist"
                      >
                        <Scissors className="h-5 w-5 text-primary" />
                        <span className="text-xs font-medium">Coiffeur</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="admin" id="type-admin" className="peer sr-only" />
                      <Label
                        htmlFor="type-admin"
                        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-border p-3 text-center transition-all hover-elevate peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        data-testid="type-admin"
                      >
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="text-xs font-medium">Admin</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerLoading}
                  data-testid="button-register"
                >
                  {registerLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer un compte
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
