
import React, { useState } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Navigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
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
        description: "Se ha enviado un correo de confirmación. Por favor, verifica tu email.",
      });
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
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
              onSubmit={handleLogin}
              onGoogleLogin={signInWithGoogle}
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
              isLoading={isLoading}
              onSubmit={handleSignUp}
              onGoogleLogin={signInWithGoogle}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
