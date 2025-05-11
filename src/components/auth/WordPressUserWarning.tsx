
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface WordPressUserWarningProps {
  show: boolean;
}

const WordPressUserWarning = ({ show }: WordPressUserWarningProps) => {
  if (!show) return null;
  
  return (
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
  );
};

export default WordPressUserWarning;
