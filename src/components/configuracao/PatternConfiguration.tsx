
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Hash, Check, AlertCircle } from "lucide-react";

interface PatternConfig {
  enable_prefix: boolean;
  prefix_text: string;
  enable_suffix: boolean;
  suffix_text: string;
  enable_checksum: boolean;
  checksum_algorithm: "modulo10" | "modulo11" | "luhn";
  numero_digits: number;
  enable_formatting: boolean;
  format_pattern: string;
}

const PatternConfiguration = () => {
  const [config, setConfig] = useState<PatternConfig>({
    enable_prefix: false,
    prefix_text: "LT",
    enable_suffix: false,
    suffix_text: "",
    enable_checksum: false,
    checksum_algorithm: "modulo10",
    numero_digits: 6,
    enable_formatting: false,
    format_pattern: "XXX-XXX"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [previewNumber, setPreviewNumber] = useState("123456");

  useEffect(() => {
    generatePreview();
  }, [config]);

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      // Temporariamente usando localStorage até os tipos do Supabase serem atualizados
      localStorage.setItem('pattern_config', JSON.stringify(config));

      toast({
        title: "Configuração salva",
        description: "Configuração de padrões salva temporariamente.",
      });
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateChecksum = (number: string, algorithm: string): string => {
    switch (algorithm) {
      case "modulo10":
        const sum = number.split('').reduce((acc, digit, idx) => {
          const n = parseInt(digit) * (idx % 2 === 0 ? 1 : 2);
          return acc + (n > 9 ? n - 9 : n);
        }, 0);
        return ((10 - (sum % 10)) % 10).toString();
      
      case "modulo11":
        let peso = 2;
        let soma = 0;
        for (let i = number.length - 1; i >= 0; i--) {
          soma += parseInt(number[i]) * peso;
          peso = peso === 9 ? 2 : peso + 1;
        }
        const resto = soma % 11;
        return resto < 2 ? "0" : (11 - resto).toString();
      
      case "luhn":
        let checksum = 0;
        let even = false;
        for (let i = number.length - 1; i >= 0; i--) {
          let digit = parseInt(number[i]);
          if (even) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          checksum += digit;
          even = !even;
        }
        return ((10 - (checksum % 10)) % 10).toString();
      
      default:
        return "0";
    }
  };

  const generatePreview = () => {
    let number = "123456";
    
    // Ajustar o número de dígitos
    number = number.padStart(config.numero_digits, '0').slice(-config.numero_digits);
    
    // Adicionar checksum
    if (config.enable_checksum) {
      const checksum = calculateChecksum(number, config.checksum_algorithm);
      number += checksum;
    }
    
    // Adicionar prefixo
    if (config.enable_prefix && config.prefix_text) {
      number = config.prefix_text + number;
    }
    
    // Adicionar sufixo
    if (config.enable_suffix && config.suffix_text) {
      number = number + config.suffix_text;
    }
    
    // Aplicar formatação
    if (config.enable_formatting && config.format_pattern) {
      let formatted = config.format_pattern;
      const digits = number.replace(/\D/g, '');
      let digitIndex = 0;
      
      formatted = formatted.replace(/X/g, () => {
        return digitIndex < digits.length ? digits[digitIndex++] : 'X';
      });
      
      number = formatted;
    }
    
    setPreviewNumber(number);
  };

  const checksumAlgorithms = [
    { value: "modulo10", label: "Módulo 10" },
    { value: "modulo11", label: "Módulo 11" },
    { value: "luhn", label: "Luhn (cartões)" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Padrões e Formatação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-medium">Prévia do Número</span>
          </div>
          <div className="text-2xl font-mono font-bold text-center py-2">
            {previewNumber}
          </div>
        </div>

        {/* Configuração de dígitos */}
        <div className="space-y-2">
          <Label htmlFor="numero-digits">Número de Dígitos Base</Label>
          <Input
            id="numero-digits"
            type="number"
            min="1"
            max="12"
            value={config.numero_digits}
            onChange={(e) => setConfig({...config, numero_digits: parseInt(e.target.value) || 6})}
          />
        </div>

        {/* Prefixo */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-prefix"
              checked={config.enable_prefix}
              onCheckedChange={(checked) => setConfig({...config, enable_prefix: !!checked})}
            />
            <Label htmlFor="enable-prefix" className="text-sm">
              Adicionar prefixo
            </Label>
          </div>

          {config.enable_prefix && (
            <div className="space-y-2">
              <Label htmlFor="prefix-text">Texto do Prefixo</Label>
              <Input
                id="prefix-text"
                value={config.prefix_text}
                onChange={(e) => setConfig({...config, prefix_text: e.target.value})}
                placeholder="Ex: LT, SORTE, etc."
              />
            </div>
          )}
        </div>

        {/* Sufixo */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-suffix"
              checked={config.enable_suffix}
              onCheckedChange={(checked) => setConfig({...config, enable_suffix: !!checked})}
            />
            <Label htmlFor="enable-suffix" className="text-sm">
              Adicionar sufixo
            </Label>
          </div>

          {config.enable_suffix && (
            <div className="space-y-2">
              <Label htmlFor="suffix-text">Texto do Sufixo</Label>
              <Input
                id="suffix-text"
                value={config.suffix_text}
                onChange={(e) => setConfig({...config, suffix_text: e.target.value})}
                placeholder="Ex: 2024, BR, etc."
              />
            </div>
          )}
        </div>

        {/* Checksum */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-checksum"
              checked={config.enable_checksum}
              onCheckedChange={(checked) => setConfig({...config, enable_checksum: !!checked})}
            />
            <Label htmlFor="enable-checksum" className="text-sm">
              Adicionar dígito verificador (checksum)
            </Label>
          </div>

          {config.enable_checksum && (
            <div className="space-y-2">
              <Label htmlFor="checksum-algorithm">Algoritmo de Checksum</Label>
              <Select value={config.checksum_algorithm} onValueChange={(value) => setConfig({...config, checksum_algorithm: value as any})}>
                <SelectTrigger id="checksum-algorithm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {checksumAlgorithms.map((alg) => (
                    <SelectItem key={alg.value} value={alg.value}>{alg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Formatação */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-formatting"
              checked={config.enable_formatting}
              onCheckedChange={(checked) => setConfig({...config, enable_formatting: !!checked})}
            />
            <Label htmlFor="enable-formatting" className="text-sm">
              Aplicar formatação personalizada
            </Label>
          </div>

          {config.enable_formatting && (
            <div className="space-y-2">
              <Label htmlFor="format-pattern">Padrão de Formatação</Label>
              <Input
                id="format-pattern"
                value={config.format_pattern}
                onChange={(e) => setConfig({...config, format_pattern: e.target.value})}
                placeholder="Ex: XXX-XXX, XXXX.XXXX.X"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                Use 'X' para representar dígitos do número
              </div>
            </div>
          )}
        </div>

        <Button 
          onClick={saveConfiguration} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PatternConfiguration;
