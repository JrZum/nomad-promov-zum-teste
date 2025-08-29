
import { z } from "zod";

// Form validation schema
export const registerSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  data_nascimento: z.date({ message: "Data de nascimento é obrigatória" }),
  email: z.string().email({ message: "Email inválido" }),
  telefone: z.string().min(10, { message: "Telefone deve ter pelo menos 10 dígitos" }),
  documento: z.string().min(11, { message: "CPF/CNPJ inválido" }),
  rua: z.string().min(3, { message: "Endereço é obrigatório" }),
  numero: z.string().min(1, { message: "Número é obrigatório" }),
  bairro: z.string().min(2, { message: "Bairro é obrigatório" }),
  complemento: z.string().optional(),
  cep: z.string().min(8, { message: "CEP inválido" }),
  cidade: z.string().min(2, { message: "Cidade é obrigatória" }),
  uf: z.string().min(2, { message: "UF é obrigatória" }),
  senha: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  confirmarSenha: z.string(),
  aceitePolitica: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar a Política de Privacidade e os termos do Regulamento"
  }),
  aceiteMarketing: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar receber avisos e lembretes sobre novidades"
  })
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
