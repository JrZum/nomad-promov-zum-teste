
import { supabase } from "@/integrations/supabase/client";
import { generateUniqueRandomNumbers } from "@/lib/utils/generateNumbers";

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { documento, quantidade } = await req.json();

    // Validar entrada
    if (!documento || !quantidade || quantidade < 1) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Dados inválidos' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar se o participante já está cadastrado
    const { data: participantes, error: participanteError } = await supabase
      .from('participantes')
      .select('documento')
      .eq('documento', documento);
      
    if (participanteError) throw participanteError;
    
    // Se o participante não estiver cadastrado, retornar erro
    if (!participantes || participantes.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Participante não cadastrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Buscar configuração atual
    const { data: configs, error: configError } = await supabase
      .from('configuracao_campanha')
      .select('series_numericas');

    if (configError) throw configError;
    
    // Se não houver configuração, usar o valor padrão
    const config = configs && configs.length > 0 ? configs[0] : { series_numericas: 1 };
    const maxNumber = config.series_numericas * 100000;

    // Buscar números existentes
    const { data: existingNumbers, error: numbersError } = await supabase
      .from('numeros_sorte')
      .select('numero');

    if (numbersError) throw numbersError;

    const existingSet = new Set(existingNumbers?.map(n => n.numero) || []);

    // Gerar novos números
    const novosNumeros = generateUniqueRandomNumbers(quantidade, maxNumber, existingSet);

    // Inserir números gerados
    const { error: insertError } = await supabase
      .from('numeros_sorte')
      .insert(novosNumeros.map(numero => ({
        numero,
        documento
      })));

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ 
      success: true, 
      numeros: novosNumeros 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro ao gerar números:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Erro ao processar a solicitação' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
