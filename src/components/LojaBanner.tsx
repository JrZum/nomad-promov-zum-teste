import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Store } from 'lucide-react';

interface Loja {
  id: string;
  nome_loja: string;
  identificador_url: string;
  ativa: boolean;
  descricao: string;
}

interface LojaBannerProps {
  loja: Loja;
}

const LojaBanner: React.FC<LojaBannerProps> = ({ loja }) => {
  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-primary">{loja.nome_loja}</h2>
          {loja.descricao && (
            <p className="text-sm text-muted-foreground">{loja.descricao}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LojaBanner;