
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "@/components/RegisterForm/schema";
import { toast } from "@/hooks/use-toast";

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export const useCepLookup = (form: UseFormReturn<RegisterFormValues>) => {
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const fetchAddressByCep = async (cep: string) => {
    if (!cep || cep.length < 8) return;

    setIsLoadingAddress(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data: ViaCepResponse = await response.json();
      
      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "O CEP informado não foi encontrado. Por favor verifique e tente novamente.",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Dados do endereço:", data);
      
      // Preencher os campos do formulário com os dados retornados
      if (data.logradouro) form.setValue('rua', data.logradouro);
      if (data.bairro) form.setValue('bairro', data.bairro);
      if (data.localidade) form.setValue('cidade', data.localidade);
      if (data.uf) form.setValue('uf', data.uf);

    } catch (error) {
      console.error("Erro ao buscar o CEP:", error);
      toast({
        title: "Erro ao buscar o CEP",
        description: "Ocorreu um erro ao buscar o endereço. Por favor tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAddress(false);
    }
  };

  return {
    isLoadingAddress,
    fetchAddressByCep
  };
};
