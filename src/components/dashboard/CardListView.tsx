
import { Card } from "@/components/ui/card";
import { Participante, NumeroSorte, ViewMode } from "./types";

interface CardListViewProps {
  participantes: Participante[];
  numerosPorParticipante: Record<string, NumeroSorte[]>;
  viewMode: ViewMode;
}

const CardListView = ({ participantes, numerosPorParticipante, viewMode }: CardListViewProps) => {
  return (
    <div className={viewMode === "cards" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
      {participantes.map((participante) => (
        <Card key={participante.documento} className="p-6">
          <div className="space-y-2">
            <h3 className="font-semibold">{participante.nome || "Nome não informado"}</h3>
            <p className="text-sm text-gray-500">Documento: {participante.documento}</p>
            <p className="text-sm text-gray-500">Email: {participante.email || "Não informado"}</p>
            <p className="text-sm text-gray-500">Telefone: {participante.telefone || "Não informado"}</p>
            <p className="text-sm text-gray-500">
              Data de Cadastro: {new Date(participante.data_cadastro).toLocaleDateString()}
            </p>
            
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Números da Sorte:</h4>
              <div className="max-h-40 overflow-y-auto">
                {numerosPorParticipante[participante.documento]?.length > 0 ? (
                  numerosPorParticipante[participante.documento]?.map((numero, index) => (
                    <div key={index} className="text-sm mb-1 pb-1 border-b border-gray-100 last:border-0">
                      <span className="font-medium">{numero.numero.toString().padStart(6, '0')}</span> - 
                      <span className="text-gray-500 text-xs ml-1">
                        {new Date(numero.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhum número gerado</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default CardListView;
