
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Participante, NumeroSorte } from "./types";

interface TableViewProps {
  participantes: Participante[];
  numerosPorParticipante: Record<string, NumeroSorte[]>;
}

const TableView = ({ participantes, numerosPorParticipante }: TableViewProps) => {
  return (
    <TableComponent>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>Data de Cadastro</TableHead>
          <TableHead>Números da Sorte</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participantes.map((participante) => (
          <TableRow key={participante.documento}>
            <TableCell className="font-medium">
              {participante.nome || "Nome não informado"}
            </TableCell>
            <TableCell>{participante.documento}</TableCell>
            <TableCell>{participante.email || "Não informado"}</TableCell>
            <TableCell>{participante.telefone || "Não informado"}</TableCell>
            <TableCell>
              {new Date(participante.data_cadastro).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="max-h-20 overflow-y-auto">
                {numerosPorParticipante[participante.documento]?.length > 0 ? (
                  <div className="space-y-1">
                    {numerosPorParticipante[participante.documento]?.slice(0, 3).map((numero, index) => (
                      <div key={index} className="text-xs">
                        <span className="font-medium">{numero.numero.toString().padStart(6, '0')}</span>
                      </div>
                    ))}
                    {numerosPorParticipante[participante.documento]?.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{numerosPorParticipante[participante.documento].length - 3} mais
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">Nenhum número</span>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableComponent>
  );
};

export default TableView;
