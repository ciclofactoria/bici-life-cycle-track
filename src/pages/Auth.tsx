
import React, { useState } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';
import ResetPasswordDialog from '@/components/auth/ResetPasswordDialog';
import WordPressUserWarning from '@/components/auth/WordPressUserWarning';
import { useWordPressUserCheck } from '@/hooks/useWordPressUserCheck';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [registerTabDisabled, setRegisterTabDisabled] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  const { 
    userExistsInWordPress, 
    checkingUser, 
    checkWordPressUser 
  } = useWordPressUserCheck({
    email,
    setActiveTab,
    setRegisterTabDisabled,
    setShowResetDialog,
    setResetEmail
  });

  if (user) {
    return <Navigate to="/" />;
  }

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

    // Check if the user exists in WordPress BEFORE attempting to sign up
    const exists = await checkWordPressUser(email);
    
    if (exists) {
      // We've already shown the reset dialog and toast in checkWordPressUser
      setIsLoading(false);
      return;
    }

    // Only proceed with signup if the user doesn't exist in WordPress
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
        <WordPressUserWarning show={userExistsInWordPress} />
      </Card>

      <ResetPasswordDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        email={resetEmail}
        setEmail={setResetEmail}
      />
    </div>
  );
};

export default Auth;
