
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "./schema";

interface PersonalInfoFieldsProps {
  form: UseFormReturn<RegisterFormValues>;
}

const PersonalInfoFields: React.FC<PersonalInfoFieldsProps> = ({
  form
}) => {
  const formatDocument = (value: string) => {
    // Remove todos os caracteres não numéricos
    return value.replace(/\D/g, '');
  };

  return (
    <>
      <FormField 
        control={form.control} 
        name="nome" 
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome completo*</FormLabel>
            <FormControl>
              <Input placeholder="Digite seu nome completo" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} 
      />
      
      <FormField
        control={form.control}
        name="data_nascimento"
        render={({ field }) => {
          const [textValue, setTextValue] = React.useState(() => {
            if (field.value) {
              const day = field.value.getDate().toString().padStart(2, '0');
              const month = (field.value.getMonth() + 1).toString().padStart(2, '0');
              const year = field.value.getFullYear().toString();
              return `${day}/${month}/${year}`;
            }
            return '';
          });

          const parseDate = (dateString: string): Date | undefined => {
            const numbersOnly = dateString.replace(/\D/g, '');
            
            if (numbersOnly.length === 8) {
              const day = parseInt(numbersOnly.substring(0, 2));
              const month = parseInt(numbersOnly.substring(2, 4));
              const year = parseInt(numbersOnly.substring(4, 8));
              
              if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
                const date = new Date(year, month - 1, day);
                if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
                  return date;
                }
              }
            }
            return undefined;
          };

          // Sincronizar quando o valor do campo muda via calendário
          React.useEffect(() => {
            if (field.value && !textValue) {
              const day = field.value.getDate().toString().padStart(2, '0');
              const month = (field.value.getMonth() + 1).toString().padStart(2, '0');
              const year = field.value.getFullYear().toString();
              setTextValue(`${day}/${month}/${year}`);
            }
          }, [field.value]);

          return (
            <FormItem className="flex flex-col">
              <FormLabel>Data de nascimento*</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <MaskedInput
                    mask="99/99/9999"
                    placeholder="dd/mm/aaaa"
                    value={textValue}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setTextValue(newValue);
                      const parsedDate = parseDate(newValue);
                      field.onChange(parsedDate);
                    }}
                    className="flex-1"
                  />
                </FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      className="shrink-0"
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        if (date) {
                          const day = date.getDate().toString().padStart(2, '0');
                          const month = (date.getMonth() + 1).toString().padStart(2, '0');
                          const year = date.getFullYear().toString();
                          setTextValue(`${day}/${month}/${year}`);
                        } else {
                          setTextValue('');
                        }
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <FormMessage />
            </FormItem>
          );
        }}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField 
          control={form.control} 
          name="email" 
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail*</FormLabel>
              <FormControl>
                <Input placeholder="Digite seu e-mail" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} 
        />
        
        <FormField 
          control={form.control} 
          name="telefone" 
          render={({ field }) => {
            const value = field.value || '';
            return (
              <FormItem>
                <FormLabel>Telefone*</FormLabel>
                <FormControl>
                  <MaskedInput 
                    mask="(99) 99999-9999" 
                    placeholder="(00) 00000-0000" 
                    value={value} 
                    onChange={(e) => {
                      // Remove non-digit characters before saving value
                      const numericValue = e.target.value.replace(/\D/g, '');
                      field.onChange(numericValue);
                    }} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }} 
        />
      </div>
      
      <FormField 
        control={form.control} 
        name="documento" 
        render={({ field }) => {
          const value = field.value || '';
          const isCPF = value.length <= 11;
          const mask = isCPF ? "999.999.999-99" : "99.999.999/9999-99";
          return (
            <FormItem>
              <FormLabel>CPF/CNPJ*</FormLabel>
              <FormControl>
                <MaskedInput 
                  mask={mask} 
                  maskChar={null} 
                  placeholder={isCPF ? "000.000.000-00" : "00.000.000/0000-00"} 
                  value={value} 
                  onChange={(e) => {
                    // Remove todos os caracteres não numéricos
                    const formattedValue = formatDocument(e.target.value);
                    field.onChange(formattedValue);
                  }} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }} 
      />

      <FormField 
        control={form.control} 
        name="cep" 
        render={({ field }) => {
          const value = field.value || '';
          return (
            <FormItem>
              <FormLabel>CEP*</FormLabel>
              <FormControl>
                <MaskedInput 
                  mask="99999-999" 
                  placeholder="00000-000" 
                  value={value} 
                  onChange={(e) => {
                    // Remove non-digit characters before saving value
                    const cep = e.target.value.replace(/\D/g, '');
                    field.onChange(cep);
                  }} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }} 
      />
    </>
  );
};

export default PersonalInfoFields;
