
import React, { useState, useEffect } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [userExistsInWordPress, setUserExistsInWordPress] = useState(false);
  const [registerTabDisabled, setRegisterTabDisabled] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [checkingUser, setCheckingUser] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  // Reset WordPress user status when email changes
  useEffect(() => {
    if (email && userExistsInWordPress) {
      setUserExistsInWordPress(false);
      setRegisterTabDisabled(false);
    }
  }, [email]);

  if (user) {
    return <Navigate to="/" />;
  }

  const checkWordPressUser = async (email: string) => {
    setCheckingUser(true);
    try {
      console.log("Verificando si el usuario existe en WordPress:", email);
      const response = await supabase.functions.invoke('check-wordpress-user', {
        body: { email }
      });

      console.log("Respuesta de check-wordpress-user:", response);

      if (response.error) {
        console.error('Error checking WordPress user:', response.error);
        toast({
          title: "Error al verificar usuario",
          description: "No pudimos verificar si ya tienes una cuenta. Intenta de nuevo.",
          variant: "destructive"
        });
        return false;
      }

      // For testing purposes, we'll simulate the user existing
      // This should be updated once the WordPress API is properly implemented
      // To test, use any email ending with @wordpress.test
      const isTestEmail = email.toLowerCase().endsWith('@wordpress.test');
      
      if (isTestEmail || (response.data && response.data.exists === true)) {
        console.log("El usuario existe en WordPress:", response.data || "test user");
        
        // Automatically show reset password dialog
        setResetEmail(email);
        setUserExistsInWordPress(true);
        setActiveTab('login');
        setRegisterTabDisabled(true);
        setShowResetDialog(true);
        
        toast({
          title: "Usuario ya registrado",
          description: "Este email ya está registrado en ciclofactoria.com. Por favor, utiliza la opción para restablecer tu contraseña.",
          variant: "warning"
        });
        
        return true;
      }

      console.log("El usuario no existe en WordPress:", response.data);
      return false;
    } catch (error) {
      console.error('Error invoking check-wordpress-user function:', error);
      return false;
    } finally {
      setCheckingUser(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      // Check if this might be a WordPress user trying to log in
      if (error.message.includes("Invalid login credentials")) {
        // Check if the user exists in WordPress
        const exists = await checkWordPressUser(email);
        
        if (exists) {
          // We've already shown the reset dialog in checkWordPressUser
          setIsLoading(false);
          return;
        }
      }
      
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!fullName.trim()) {
      toast({
        title: "Error en el registro",
        description: "Por favor, introduce tu nombre completo",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Check if the user exists in WordPress
    const exists = await checkWordPressUser(email);
    
    if (exists) {
      // We've already shown the reset dialog and toast in checkWordPressUser
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      // Check if this might be a WordPress user based on the error message
      if (error.message.includes("User already registered")) {
        // Check if they exist in WordPress DB
        const wpExists = await checkWordPressUser(email);
        
        if (wpExists) {
          // We've already handled this in checkWordPressUser
          setIsLoading(false);
          return;
        }
        
        // It's a Supabase user but not a WordPress user
        toast({
          title: "Usuario ya registrado",
          description: "Este email ya está registrado. Por favor, inicia sesión o utiliza la opción para restablecer tu contraseña.",
          variant: "warning"
        });
        
        setActiveTab('login');
      } else {
        toast({
          title: "Error en el registro",
          description: error.message,
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada. Ya puedes iniciar sesión.",
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    setResetEmail(email); // Pre-fill with current email if available
    setShowResetDialog(true);
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Por favor, introduce tu email",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    const { error } = await useAuth().resetPassword(resetEmail);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: "Email enviado",
        description: "Se ha enviado un email con las instrucciones para restablecer tu contraseña",
      });
      setTimeout(() => {
        setShowResetDialog(false);
        setResetEmailSent(false);
      }, 3000);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">BiciCare</CardTitle>
          <CardDescription>
            Gestiona el mantenimiento de tus bicicletas
          </CardDescription>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register" disabled={registerTabDisabled}>Registrarse</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
              onSubmit={handleLogin}
              onForgotPassword={handleForgotPassword}
            />
          </TabsContent>
          
          <TabsContent value="register">
            <SignUpForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              fullName={fullName}
              setFullName={setFullName}
              isLoading={isLoading || checkingUser}
              onSubmit={handleSignUp}
            />
          </TabsContent>
        </Tabs>
        
        {/* Warning message for WordPress users */}
        {userExistsInWordPress && (
          <div className="px-6 pb-4">
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Tu cuenta ya existe en ciclofactoria.com</p>
                <p className="mt-1">
                  Usa la opción "¿Has olvidado tu contraseña?" para configurar una contraseña para la app.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar contraseña</DialogTitle>
            <DialogDescription>
              {userExistsInWordPress 
                ? "Tu correo ya está registrado en ciclofactoria.com. Introduce tu correo para recibir instrucciones y configurar una contraseña para la app."
                : "Introduce tu correo electrónico y te enviaremos instrucciones para recuperar tu contraseña."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {resetEmailSent ? (
              <p className="text-center text-green-600">
                Se ha enviado un correo con las instrucciones para restablecer tu contraseña.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="reset-email" className="text-sm font-medium">Email</label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Tu correo electrónico"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar instrucciones"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
