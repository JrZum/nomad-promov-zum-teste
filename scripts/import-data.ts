
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * Script para importar dados de arquivos CSV para as tabelas Supabase
 * Para usar: npm install @supabase/supabase-js fs path
 * Depois: npx ts-node scripts/import-data.ts
 */

// Configurar cliente Supabase para a nova instância
const supabaseUrl = 'https://database-supabase.7hatw3.easypanel.host';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    storage: undefined,
  },
});

type ParsedRow = Record<string, any>;

async function importTableData(tableName: string): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), 'data-export', `${tableName}.csv`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`Arquivo ${filePath} não encontrado. Pulando importação.`);
      return;
    }
    
    console.log(`Importando dados para a tabela ${tableName}...`);
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const rows = fileContent.split('\n');
    
    if (rows.length <= 1) {
      console.log(`Nenhum dado encontrado para importar na tabela ${tableName}`);
      return;
    }
    
    const headers = rows[0].split(',');
    const dataRows = rows.slice(1).filter(row => row.trim() !== '');
    
    const parsedData: ParsedRow[] = dataRows.map(row => {
      // Tratamento básico para lidar com campos entre aspas
      const values: string[] = [];
      let inQuotes = false;
      let currentValue = '';
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"' && (i === 0 || row[i-1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      values.push(currentValue);
      
      const rowObject: ParsedRow = {};
      headers.forEach((header, index) => {
        let value = values[index] || null;
        
        // Tratar strings JSON
        if (value && (value.startsWith('{') || value.startsWith('['))) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Se não for um JSON válido, manter como string
          }
        }
        
        // Converter valores numéricos
        else if (value && !isNaN(Number(value)) && value.trim() !== '') {
          value = Number(value);
        }
        
        rowObject[header] = value;
      });
      
      return rowObject;
    });
    
    // Importar em lotes de 100 para evitar problemas com limites de tamanho
    const batchSize = 100;
    for (let i = 0; i < parsedData.length; i += batchSize) {
      const batch = parsedData.slice(i, i + batchSize);
      const { error } = await supabase.from(tableName).insert(batch);
      
      if (error) {
        console.error(`Erro ao importar lote para ${tableName}:`, error);
      } else {
        console.log(`Importado lote ${i/batchSize + 1}/${Math.ceil(parsedData.length/batchSize)} para ${tableName}`);
      }
    }
    
    console.log(`Importação concluída para tabela ${tableName}. Total: ${parsedData.length} registros`);
    
  } catch (err) {
    console.error(`Erro ao importar tabela ${tableName}:`, err);
  }
}

async function importAllData() {
  console.log('Iniciando importação de dados...');
  
  // Ordem importante para respeitar chaves estrangeiras
  const tables = [
    'admins',
    'configuracao_campanha',
    'participantes',
    'numeros_sorte',
    'vendas',
    'admin_sessions', // Depende de admins
  ];
  
  for (const table of tables) {
    await importTableData(table);
  }
  
  console.log('Importação concluída!');
}

// Executar a função principal
// Verificamos o ambiente - não executar automaticamente se estiver importado em outro script
if (require.main === module) {
  importAllData();
}
