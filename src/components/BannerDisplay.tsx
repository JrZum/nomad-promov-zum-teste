
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BannerDisplay = () => {
  const { data: bannerUrl, isLoading } = useQuery({
    queryKey: ["banner"],
    queryFn: async () => {
      try {
        // Try to get banner_url first
        const { data, error } = await supabase
          .from("configuracao_campanha")
          .select("*")
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error("Erro ao buscar banner:", error);
          return null;
        }
        
        // Check if banner_url exists in the returned data
        return (data as any)?.banner_url || null;
      } catch (err) {
        console.error("Erro ao buscar banner (possivelmente coluna não existe ainda):", err);
        return null;
      }
    }
  });

  if (isLoading || !bannerUrl) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <img 
        src={bannerUrl} 
        alt="Banner da campanha" 
        className="w-full h-auto max-h-48 object-cover rounded-lg shadow-sm"
      />
    </div>
  );
};

export default BannerDisplay;
