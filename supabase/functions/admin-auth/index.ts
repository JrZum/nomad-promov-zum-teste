
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? 'https://nomaddb.promov.me',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
    );
    
    // Log request information
    console.log("Recebida solicitação de autenticação admin");
    
    const requestData = await req.json();
    const { email, password } = requestData;
    
    console.log("Chamando função admin_login com email:", email);
    
    // Call the admin_login function we created in the database
    const { data, error } = await supabaseClient.rpc('admin_login', {
      admin_email: email,
      admin_password: password,
    });

    console.log("Resposta da função admin_login:", { data, error });

    if (error) {
      console.error("Erro na função admin_login:", error);
      return new Response(JSON.stringify({ 
        success: false, 
        message: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Check if data is null or undefined
    if (!data) {
      console.error("admin_login retornou dados nulos");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Credenciais inválidas ou usuário não encontrado" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Return data in a consistent format
    return new Response(JSON.stringify({ 
      success: true, 
      token: data.token || "token-temp",
      message: "Login bem-sucedido"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Erro inesperado na autenticação admin:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
