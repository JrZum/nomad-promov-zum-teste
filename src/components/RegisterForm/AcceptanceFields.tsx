
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { RegisterFormValues } from "./schema";

interface AcceptanceFieldsProps {
  form: UseFormReturn<RegisterFormValues>;
}

const AcceptanceFields = ({ form }: AcceptanceFieldsProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="aceitePolitica"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Li e entendi a Política de Privacidade e os termos do Regulamento. *
              </label>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="aceiteMarketing"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Aceito receber avisos e lembretes sobre novidades das marcas e ações da Let's Eat. *
              </label>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};

export default AcceptanceFields;
