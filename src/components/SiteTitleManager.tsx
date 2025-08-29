import { useEffect } from "react";
import { useConfiguracao } from "@/hooks/useConfiguracao";

const SiteTitleManager = () => {
  const { configData, configLoaded } = useConfiguracao();

  useEffect(() => {
    if (!configLoaded) return;
    const title = (configData as any)?.titulo_site as string | undefined;
    if (title && title.length > 0) {
      document.title = title;
    }
  }, [configLoaded, configData]);

  return null;
};

export default SiteTitleManager;
