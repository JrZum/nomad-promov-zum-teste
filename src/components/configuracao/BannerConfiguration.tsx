
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";

const BannerConfiguration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Banner state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Favicon state
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  
  // Site title state
  const [siteTitle, setSiteTitle] = useState<string>("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);

      // Upload do arquivo para o storage do Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        throw uploadError;
      }

      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

      // Tentar salvar URL na configuração
      try {
        const { data: existingConfig, error: fetchError } = await supabase
          .from("configuracao_campanha")
          .select("id")
          .maybeSingle();
        
        if (fetchError) {
          console.error("Erro ao verificar configuração:", fetchError);
          throw fetchError;
        }
        
        if (existingConfig) {
          // Tentar atualizar - usando type assertion para contornar tipos
          const { error: updateError } = await supabase
            .from("configuracao_campanha")
            .update({ banner_url: publicUrl } as any)
            .eq("id", existingConfig.id);
          
          if (updateError) {
            console.error("Erro ao atualizar configuração (possivelmente coluna banner_url não existe):", updateError);
            throw new Error("A coluna banner_url não existe na tabela. Execute o script de atualização do banco de dados.");
          }
        } else {
          // Tentar inserir - usando type assertion para contornar tipos
          const { error: insertError } = await supabase
            .from("configuracao_campanha")
            .insert({ banner_url: publicUrl, series_numericas: 1 } as any);
          
          if (insertError) {
            console.error("Erro ao inserir configuração (possivelmente coluna banner_url não existe):", insertError);
            throw new Error("A coluna banner_url não existe na tabela. Execute o script de atualização do banco de dados.");
          }
        }
      } catch (dbError) {
        // Se der erro no banco, pelo menos temos a URL do arquivo
        console.warn("Erro ao salvar no banco, mas upload foi realizado:", dbError);
        throw dbError;
      }
      
      return publicUrl;
    },
    onSuccess: (url) => {
      setBannerUrl(url);
      setBannerFile(null);
      setIsUploading(false);
      toast({
        title: "Banner atualizado",
        description: "O banner foi carregado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ["configuracao"] });
      queryClient.invalidateQueries({ queryKey: ["banner"] });
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível fazer upload do banner.",
        variant: "destructive"
      });
      console.error("Erro ao fazer upload do banner:", error);
    }
  });

  const uploadFaviconMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploadingFavicon(true);

      // Upload do arquivo para o storage do Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error("Erro no upload do favicon:", uploadError);
        throw uploadError;
      }

      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

      // Atualizar o favicon no index.html
      const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (faviconLink) {
        faviconLink.href = publicUrl;
      } else {
        // Criar link do favicon se não existir
        const newFaviconLink = document.createElement('link');
        newFaviconLink.rel = 'icon';
        newFaviconLink.href = publicUrl;
        newFaviconLink.type = 'image/png';
        document.head.appendChild(newFaviconLink);
      }

      return publicUrl;
    },
    onSuccess: (url) => {
      setFaviconUrl(url);
      setFaviconFile(null);
      setIsUploadingFavicon(false);
      toast({
        title: "Favicon atualizado",
        description: "O favicon foi carregado com sucesso."
      });
    },
    onError: (error: Error) => {
      setIsUploadingFavicon(false);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível fazer upload do favicon.",
        variant: "destructive"
      });
      console.error("Erro ao fazer upload do favicon:", error);
    }
  });

  // Carregar título atual na montagem
  useEffect(() => {
    const loadTitle = async () => {
      try {
        const { data, error } = await supabase
          .from("configuracao_campanha")
          .select("*")
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          setSiteTitle(((data as any)?.titulo_site as string) || "");
        }
      } catch (e) {
        console.warn("Coluna site_title pode não existir ainda:", e);
      }
    };
    loadTitle();
  }, []);

  // Salvar título do site
  const saveSiteTitleMutation = useMutation({
    mutationFn: async (title: string) => {
      setIsSavingTitle(true);
      try {
        const { data: existingConfig, error: fetchError } = await supabase
          .from("configuracao_campanha")
          .select("id")
          .maybeSingle();
        if (fetchError) throw fetchError;

        if (existingConfig) {
          const { error: updateError } = await supabase
            .from("configuracao_campanha")
            .update({ titulo_site: title } as any)
            .eq("id", existingConfig.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("configuracao_campanha")
            .insert({ titulo_site: title, series_numericas: 1 } as any);
          if (insertError) throw insertError;
        }
        return title;
      } catch (err: any) {
        console.error("Erro ao salvar título do site:", err);
        throw new Error("Não foi possível salvar o título. Verifique se a coluna 'site_title' existe na tabela configuracao_campanha.");
      } finally {
        setIsSavingTitle(false);
      }
    },
    onSuccess: (title) => {
      toast({ title: "Título atualizado", description: "O título do site foi salvo com sucesso." });
      // Atualiza o título imediatamente
      if (title) document.title = title;
      queryClient.invalidateQueries({ queryKey: ["configuracao"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBannerFile(file);
    }
  };

  const handleFaviconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo de imagem (PNG, JPG).",
          variant: "destructive"
        });
        return;
      }
      setFaviconFile(file);
    }
  };

  const handleUpload = () => {
    if (bannerFile) {
      uploadBannerMutation.mutate(bannerFile);
    }
  };

  const handleFaviconUpload = () => {
    if (faviconFile) {
      uploadFaviconMutation.mutate(faviconFile);
    }
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerUrl("");
  };

  const removeFavicon = () => {
    setFaviconFile(null);
    setFaviconUrl("");
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Configuração de Banner e Favicon</h3>
      <div className="space-y-6">
        {/* Seção do Banner */}
        <div className="space-y-4">
          <h4 className="text-md font-medium">Banner do Site</h4>
          <div className="space-y-2">
            <Label>Upload de Banner</Label>
            <p className="text-sm text-gray-500">
              Tamanho recomendado: 1200x200 pixels (adequado para desktop e mobile)
            </p>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {bannerFile && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="text-sm flex-1">{bannerFile.name}</span>
              <Button size="sm" variant="ghost" onClick={removeBanner}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {bannerUrl && (
            <div className="space-y-2">
              <Label>Preview do Banner</Label>
              <img
                src={bannerUrl}
                alt="Banner preview"
                className="w-full max-w-md h-auto rounded border"
              />
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!bannerFile || isUploading}
            className="w-full"
          >
            {isUploading ? "Fazendo upload..." : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload do Banner
              </>
            )}
          </Button>
        </div>

        {/* Seção do Favicon */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-md font-medium">Favicon do Site</h4>
          <div className="space-y-2">
            <Label>Upload de Favicon</Label>
            <p className="text-sm text-gray-500">
              Tamanho recomendado: 32x32 ou 16x16 pixels. Formato PNG ou JPG.
            </p>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFaviconChange}
              disabled={isUploadingFavicon}
            />
          </div>

          {faviconFile && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="text-sm flex-1">{faviconFile.name}</span>
              <Button size="sm" variant="ghost" onClick={removeFavicon}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {faviconUrl && (
            <div className="space-y-2">
              <Label>Preview do Favicon</Label>
              <div className="flex items-center gap-2">
                <img
                  src={faviconUrl}
                  alt="Favicon preview"
                  className="w-8 h-8 rounded border"
                />
                <span className="text-sm text-gray-600">
                  Favicon carregado com sucesso
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={handleFaviconUpload}
            disabled={!faviconFile || isUploadingFavicon}
            className="w-full"
          >
            {isUploadingFavicon ? "Fazendo upload..." : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload do Favicon
              </>
            )}
          </Button>
        </div>

        {/* Seção do Título do Site */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-md font-medium">Título do Site</h4>
          <div className="space-y-2">
            <Label>Nome exibido na aba do navegador</Label>
            <p className="text-sm text-gray-500">Esse texto será usado como título da página.</p>
            <Input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="Ex: Promo Tintas Renner • Admin"
            />
          </div>
          <Button
            onClick={() => saveSiteTitleMutation.mutate(siteTitle.trim())}
            disabled={isSavingTitle || !siteTitle.trim()}
            className="w-full"
          >
            {isSavingTitle ? "Salvando..." : "Salvar Título"}
          </Button>
        </div>

      </div>
    </Card>
  );
};

export default BannerConfiguration;
