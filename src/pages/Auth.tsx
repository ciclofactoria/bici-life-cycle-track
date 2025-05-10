
import React, { useState } from 'react';
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
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const checkWordPressUser = async (email: string) => {
    try {
      const response = await supabase.functions.invoke('check-wordpress-user', {
        body: { email }
      });

      if (response.error) {
        console.error('Error checking WordPress user:', response.error);
        return false;
      }

      return response.data.exists;
    } catch (error) {
      console.error('Error invoking check-wordpress-user function:', error);
      return false;
    }
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
      setUserExistsInWordPress(true);
      toast({
        title: "Usuario ya registrado",
        description: "Este email ya está registrado en ciclofactoria.com. Por favor, utiliza la opción 'Olvidé mi contraseña' para establecer una contraseña para la app.",
        variant: "warning"
      });
      setActiveTab('login');
      setRegisterTabDisabled(true);
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      toast({
        title: "Error en el registro",
        description: error.message,
        variant: "destructive"
      });
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
            {userExistsInWordPress && (
              <div className="px-6 pb-4">
                <p className="text-sm text-amber-600 text-center">
                  Tu cuenta ya existe en ciclofactoria.com. 
                  Usa "¿Has olvidado tu contraseña?" para configurar una contraseña para la app.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="register">
            <SignUpForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              fullName={fullName}
              setFullName={setFullName}
              isLoading={isLoading}
              onSubmit={handleSignUp}
            />
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar contraseña</DialogTitle>
            <DialogDescription>
              Introduce tu correo electrónico y te enviaremos instrucciones para recuperar tu contraseña.
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
