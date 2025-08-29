
import { z } from "zod";

export const loginSchema = z.object({
  telefone: z.string().min(1, { message: "Celular é obrigatório" }),
  senha: z.string().min(1, { message: "Senha é obrigatória" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z.object({
  telefone: z.string().min(1, { message: "Celular é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }).min(1, { message: "Email é obrigatório" }),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
