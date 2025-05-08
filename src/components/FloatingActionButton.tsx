
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FABProps {
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
}

const FloatingActionButton = ({ onClick, label = 'Add', icon }: FABProps) => {
  return (
    <Button
      onClick={onClick}
      className="fixed right-6 bottom-20 bg-bicicare-green hover:bg-bicicare-green/90 text-black rounded-full p-3 shadow-lg"
    >
      {icon || <Plus className="h-6 w-6" />}
      <span className="sr-only">{label}</span>
    </Button>
  );
};

export default FloatingActionButton;
