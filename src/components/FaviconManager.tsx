import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const FaviconManager = () => {
  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracao_campanha')
          .select('favicon_url')
          .limit(1)
          .maybeSingle();

        if (!error && data?.favicon_url) {
          updateFavicon(data.favicon_url);
        }
      } catch (e) {
        console.warn('Erro ao carregar favicon:', e);
      }
    };

    const updateFavicon = (url: string) => {
      // Remover favicon existente
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.remove();
      }

      // Criar novo favicon
      const faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.href = url;
      faviconLink.type = 'image/png';
      document.head.appendChild(faviconLink);
    };

    // Carregar favicon inicial
    loadFavicon();

    // Configurar listener para mudanças na configuração
    const channel = supabase
      .channel('favicon-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'configuracao_campanha',
          filter: 'favicon_url=not.is.null'
        },
        (payload) => {
          if (payload.new && (payload.new as any).favicon_url) {
            updateFavicon((payload.new as any).favicon_url);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // Componente invisível
};

export default FaviconManager;