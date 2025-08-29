import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Eye } from "lucide-react";

interface CupomUploadProps {
  vendaId: string;
  imagemCupomAtual?: string;
  onUploadSuccess?: (url: string) => void;
}

const CupomUpload = ({ vendaId, imagemCupomAtual, onUploadSuccess }: CupomUploadProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [cupomFile, setCupomFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const uploadCupomMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);

      // Upload do arquivo para o storage do Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `cupom-${vendaId}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cupons-fiscais')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        throw uploadError;
      }

      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('cupons-fiscais')
        .getPublicUrl(fileName);

      // Atualizar diretamente o campo imagemCupom na tabela vendas
      const { error: updateError } = await supabase
        .from('vendas')
        .update({ imagemCupom: publicUrl })
        .eq('id', vendaId);

      if (updateError) {
        console.error("Erro ao atualizar venda:", updateError);
        throw updateError;
      }
      
      return publicUrl;
    },
    onSuccess: (url) => {
      setCupomFile(null);
      setPreviewUrl("");
      setIsUploading(false);
      toast({
        title: "Cupom atualizado",
        description: "A imagem do cupom foi carregada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      onUploadSuccess?.(url);
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível fazer upload do cupom.",
        variant: "destructive"
      });
      console.error("Erro ao fazer upload do cupom:", error);
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo de imagem.",
          variant: "destructive"
        });
        return;
      }
      
      setCupomFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (cupomFile) {
      uploadCupomMutation.mutate(cupomFile);
    }
  };

  const removeCupom = () => {
    setCupomFile(null);
    setPreviewUrl("");
  };

  const viewCurrentImage = () => {
    if (imagemCupomAtual) {
      window.open(imagemCupomAtual, '_blank');
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium">Upload do Cupom Fiscal</h4>
          {imagemCupomAtual && (
            <Button
              size="sm"
              variant="outline"
              onClick={viewCurrentImage}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Atual
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label>Imagem do Cupom</Label>
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo: 5MB
          </p>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        {cupomFile && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <span className="text-sm flex-1">{cupomFile.name}</span>
            <Button size="sm" variant="ghost" onClick={removeCupom}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <img
              src={previewUrl}
              alt="Preview do cupom"
              className="w-full max-w-sm h-auto rounded border"
            />
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!cupomFile || isUploading}
          className="w-full"
          size="sm"
        >
          {isUploading ? "Fazendo upload..." : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Fazer Upload
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default CupomUpload;