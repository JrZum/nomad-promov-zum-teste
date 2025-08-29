
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "./schema";

interface StreetAddressFieldsProps {
  form: UseFormReturn<RegisterFormValues>;
  isLoadingAddress: boolean;
}

const StreetAddressFields: React.FC<StreetAddressFieldsProps> = ({ form, isLoadingAddress }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="rua"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço*</FormLabel>
                <FormControl>
                  <Input placeholder="Digite seu endereço" {...field} disabled={isLoadingAddress} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="numero"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número*</FormLabel>
              <FormControl>
                <Input placeholder="Nº" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="bairro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro*</FormLabel>
              <FormControl>
                <Input placeholder="Digite seu bairro" {...field} disabled={isLoadingAddress} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="complemento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complemento</FormLabel>
              <FormControl>
                <Input placeholder="Apto, Bloco, etc. (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

export default StreetAddressFields;
