
import React from 'react';
import BottomNav from '@/components/BottomNav';

const Summary = () => {
  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">Resumen de Gastos</h1>
        <div className="bg-card rounded-lg p-4 text-center">
          <p className="text-muted-foreground">Vista de resumen próximamente</p>
        </div>
      </div>
      <BottomNav activePage="/summary" />
    </div>
  );
};

export default Summary;
