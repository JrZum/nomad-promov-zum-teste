
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "./schema";
import { estadosBrasileiros } from "@/data/estados-brasileiros";

interface CityStateFieldsProps {
  form: UseFormReturn<RegisterFormValues>;
  isLoadingAddress: boolean;
}

const CityStateFields: React.FC<CityStateFieldsProps> = ({ form, isLoadingAddress }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <FormField
        control={form.control}
        name="cidade"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cidade*</FormLabel>
            <FormControl>
              <Input placeholder="Digite sua cidade" {...field} disabled={isLoadingAddress} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="uf"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Estado*</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isLoadingAddress}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {estadosBrasileiros.map((estado) => (
                  <SelectItem key={estado.sigla} value={estado.sigla}>
                    {estado.sigla} - {estado.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default CityStateFields;
