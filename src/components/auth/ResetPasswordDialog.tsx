
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  setEmail: (email: string) => void;
}

const ResetPasswordDialog = ({ 
  open, 
  onOpenChange, 
  email, 
  setEmail 
}: ResetPasswordDialogProps) => {
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      toast("Error", {
        description: "Por favor, introduce tu email"
      });
      return;
    }

    setIsLoading(true);

    const { error } = await resetPassword(email);
    
    if (error) {
      toast("Error", {
        description: error.message
      });
    } else {
      setResetEmailSent(true);
      toast("Email enviado", {
        description: "Se ha enviado un email con las instrucciones para restablecer tu contraseña"
      });
      setTimeout(() => {
        onOpenChange(false);
        setResetEmailSent(false);
      }, 3000);
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recuperar contraseña</DialogTitle>
          <DialogDescription>
            {email.toLowerCase().endsWith('@wordpress.test') || email.includes('@ciclofactoria.com')
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
  );
};

export default ResetPasswordDialog;
