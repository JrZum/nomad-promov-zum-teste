
export type Participante = {
  documento: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  data_cadastro: string;
  loja_identificador?: string | null;
};

export type NumeroSorte = {
  numero: number;
  created_at: string;
};

export type ViewMode = "cards" | "list" | "table";
