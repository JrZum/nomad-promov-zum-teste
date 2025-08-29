
import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "./schema";
import CityStateFields from "./CityStateFields";
import StreetAddressFields from "./StreetAddressFields";
import { useCepLookup } from "@/hooks/useCepLookup";

interface AddressFieldsProps {
  form: UseFormReturn<RegisterFormValues>;
}

const AddressFields: React.FC<AddressFieldsProps> = ({ form }) => {
  const { isLoadingAddress, fetchAddressByCep } = useCepLookup(form);
  const cep = form.watch('cep');

  useEffect(() => {
    // Check if CEP is valid (8 digits)
    if (cep?.length === 8) {
      fetchAddressByCep(cep);
    }
  }, [cep, fetchAddressByCep]);

  return (
    <>
      <CityStateFields form={form} isLoadingAddress={isLoadingAddress} />
      <StreetAddressFields form={form} isLoadingAddress={isLoadingAddress} />
    </>
  );
};

export default AddressFields;
