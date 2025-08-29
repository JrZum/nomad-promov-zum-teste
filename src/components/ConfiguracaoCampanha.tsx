
import { useConfiguracao } from "@/hooks/useConfiguracao";
import SeriesConfiguration from "./configuracao/SeriesConfiguration";
import NumberGenerationForm from "./configuracao/NumberGenerationForm";
import BannerConfiguration from "./configuracao/BannerConfiguration";

const ConfiguracaoCampanha = () => {
  const {
    seriesNumericas,
    isLoading,
    configLoaded,
    ErrorComponent
  } = useConfiguracao();

  if (ErrorComponent) return ErrorComponent;

  return (
    <div className="space-y-6">
      <BannerConfiguration />
      
      <SeriesConfiguration
        initialSeriesNumericas={seriesNumericas}
        isLoading={isLoading}
      />

      <NumberGenerationForm
        isLoading={isLoading || !configLoaded}
      />
    </div>
  );
};

export default ConfiguracaoCampanha;
