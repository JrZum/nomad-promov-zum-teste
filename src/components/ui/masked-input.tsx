
import React from "react";
import InputMask from "react-input-mask";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface MaskedInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  mask: string;
  maskChar?: string | null;
  formatChars?: {
    [key: string]: string;
  };
  alwaysShowMask?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, maskChar = "_", formatChars, alwaysShowMask = false, value = "", onChange, ...props }, ref) => {
    return (
      <InputMask
        mask={mask}
        maskChar={maskChar}
        formatChars={formatChars}
        alwaysShowMask={alwaysShowMask}
        value={value}
        onChange={onChange}
      >
        {(inputProps: any) => (
          <Input 
            className={cn(className)} 
            ref={ref} 
            {...inputProps} 
            {...props} 
          />
        )}
      </InputMask>
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
