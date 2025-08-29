
import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }).min(1, { message: "Email é obrigatório" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;
