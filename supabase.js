/* ==========================================
   SHOP ADMINISTRATION ERP - SUPABASE.JS
   Integracao robusta e tolerante a falhas
   ========================================== */

const SUPABASE_URL = 'https://wyesnptpaobrfepszrdk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZXNucHRwYW9icmZlcHN6cmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTg4NjgsImV4cCI6MjA5NDA3NDg2OH0.X4oWiiSP66Wz2-ZI-fU-h9yodTp-LxlrZicEBd__pCQ';

// Tabelas obrigatorias
const TABELAS = {
  produtos: 'produtos',
  categorias: 'categorias',
  vendas: 'vendas',
  caixa: 'caixa',
  movimentacoes: 'movimentacoes',
  transferencias: 'transferencias',
  bombas: 'bombas',
  perdas: 'perdas',
  roubos: 'roubos',
  fechamentos: 'fechamentos'
};

// Cliente Supabase global
let supabaseClient = null;

// Inicializar cliente Supabase
function initSupabase(url, key) {
  try {
    const finalUrl = url || SUPABASE_URL;
    const finalKey = key || SUPABASE_ANON_KEY;
    
    if (!finalUrl || !finalKey) {
      console.warn('[SUPABASE] URL ou Key nao configurados');
      return null;
    }
    
    supabaseClient = supabase.createClient(finalUrl, finalKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      },
      db: {
        schema: 'public'
      }
    });
    
    console.log('[SUPABASE] Cliente inicializado com sucesso');
    return supabaseClient;
  } catch (erro) {
    console.error('[SUPABASE] Erro ao inicializar:', erro.message);
    return null;
  }
}

// Obter cliente atual
function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }
  return supabaseClient;
}

// Verificar conexao
async function checkSupabaseConnection() {
  try {
    const client = getSupabase();
    if (!client) return false;
    
    const { error } = await client.from(TABELAS.produtos).select('id').limit(1);
    return !error;
  } catch (e) {
    console.error('[SUPABASE] Falha na conexao:', e.message);
    return false;
  }
}

// Funcao generica para buscar dados
async function fetchTabela(nomeTabela, opcoes = {}) {
  try {
    const client = getSupabase();
    if (!client) {
      console.log(`[SUPABASE] Cliente indisponivel para tabela: ${nomeTabela}`);
      return { data: [], error: 'Cliente nao inicializado' };
    }
    
    let query = client.from(nomeTabela).select(opcoes.select || '*');
    
    if (opcoes.order) {
      query = query.order(opcoes.order.column, { ascending: opcoes.order.ascending ?? false });
    }
    if (opcoes.limit) {
      query = query.limit(opcoes.limit);
    }
    if (opcoes.eq) {
      query = query.eq(opcoes.eq.column, opcoes.eq.value);
    }
    if (opcoes.gte) {
      query = query.gte(opcoes.gte.column, opcoes.gte.value);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`ERRO NA TABELA: ${nomeTabela} -> ${error.message}`);
      return { data: [], error: error.message };
    }
    
    return { data: data || [], error: null };
  } catch (erro) {
    console.error(`ERRO NA TABELA: ${nomeTabela} -> ${erro.message}`);
    return { data: [], error: erro.message };
  }
}

// Funcao generica para inserir dados
async function insertTabela(nomeTabela, dados) {
  try {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Cliente nao inicializado' };
    
    const { data, error } = await client
      .from(nomeTabela)
      .insert(dados)
      .select();
    
    if (error) {
      console.error(`ERRO INSERT ${nomeTabela}: ${error.message}`);
      return { data: null, error: error.message };
    }
    
    return { data: data?.[0] || null, error: null };
  } catch (erro) {
    console.error(`ERRO INSERT ${nomeTabela}: ${erro.message}`);
    return { data: null, error: erro.message };
  }
}

// Funcao generica para atualizar dados
async function updateTabela(nomeTabela, id, dados) {
  try {
    const client = getSupabase();
    if (!client) return { data: null, error: 'Cliente nao inicializado' };
    
    const { data, error } = await client
      .from(nomeTabela)
      .update(dados)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error(`ERRO UPDATE ${nomeTabela}: ${error.message}`);
      return { data: null, error: error.message };
    }
    
    return { data: data?.[0] || null, error: null };
  } catch (erro) {
    console.error(`ERRO UPDATE ${nomeTabela}: ${erro.message}`);
    return { data: null, error: erro.message };
  }
}

// Funcao generica para deletar dados
async function deleteTabela(nomeTabela, id) {
  try {
    const client = getSupabase();
    if (!client) return { error: 'Cliente nao inicializado' };
    
    const { error } = await client
      .from(nomeTabela)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`ERRO DELETE ${nomeTabela}: ${error.message}`);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (erro) {
    console.error(`ERRO DELETE ${nomeTabela}: ${erro.message}`);
    return { error: erro.message };
  }
}

// Funcoes especificas para cada tabela

// PRODUTOS
async function getProdutos() {
  return fetchTabela(TABELAS.produtos, { order: { column: 'created_at', ascending: false } });
}

async function getProdutoById(id) {
  return fetchTabela(TABELAS.produtos, { eq: { column: 'id', value: id } });
}

async function createProduto(dados) {
  return insertTabela(TABELAS.produtos, dados);
}

async function updateProduto(id, dados) {
  return updateTabela(TABELAS.produtos, id, dados);
}

async function deleteProduto(id) {
  return deleteTabela(TABELAS.produtos, id);
}

// CATEGORIAS
async function getCategorias() {
  return fetchTabela(TABELAS.categorias, { order: { column: 'nome', ascending: true } });
}

async function createCategoria(dados) {
  return insertTabela(TABELAS.categorias, dados);
}

async function updateCategoria(id, dados) {
  return updateTabela(TABELAS.categorias, id, dados);
}

async function deleteCategoria(id) {
  return deleteTabela(TABELAS.categorias, id);
}

// VENDAS
async function getVendas() {
  return fetchTabela(TABELAS.vendas, { order: { column: 'created_at', ascending: false } });
}

async function getVendasHoje() {
  const hoje = new Date().toISOString().split('T')[0];
  return fetchTabela(TABELAS.vendas, { 
    order: { column: 'created_at', ascending: false },
    gte: { column: 'created_at', value: hoje }
  });
}

async function createVenda(dados) {
  return insertTabela(TABELAS.vendas, dados);
}

async function deleteVenda(id) {
  return deleteTabela(TABELAS.vendas, id);
}

// CAIXA
async function getCaixa() {
  return fetchTabela(TABELAS.caixa, { order: { column: 'created_at', ascending: false } });
}

async function createCaixa(dados) {
  return insertTabela(TABELAS.caixa, dados);
}

// MOVIMENTACOES
async function getMovimentacoes() {
  return fetchTabela(TABELAS.movimentacoes, { order: { column: 'created_at', ascending: false } });
}

async function createMovimentacao(dados) {
  return insertTabela(TABELAS.movimentacoes, dados);
}

// TRANSFERENCIAS
async function getTransferencias() {
  return fetchTabela(TABELAS.transferencias, { order: { column: 'created_at', ascending: false } });
}

async function createTransferencia(dados) {
  return insertTabela(TABELAS.transferencias, dados);
}

// BOMBAS
async function getBombas() {
  return fetchTabela(TABELAS.bombas, { order: { column: 'nome', ascending: true } });
}

async function createBomba(dados) {
  return insertTabela(TABELAS.bombas, dados);
}

async function updateBomba(id, dados) {
  return updateTabela(TABELAS.bombas, id, dados);
}

async function deleteBomba(id) {
  return deleteTabela(TABELAS.bombas, id);
}

// PERDAS
async function getPerdas() {
  return fetchTabela(TABELAS.perdas, { order: { column: 'created_at', ascending: false } });
}

async function createPerda(dados) {
  return insertTabela(TABELAS.perdas, dados);
}

// ROUBOS
async function getRoubos() {
  return fetchTabela(TABELAS.roubos, { order: { column: 'created_at', ascending: false } });
}

async function createRoubo(dados) {
  return insertTabela(TABELAS.roubos, dados);
}

// FECHAMENTOS
async function getFechamentos() {
  return fetchTabela(TABELAS.fechamentos, { order: { column: 'data', ascending: false } });
}

async function createFechamento(dados) {
  return insertTabela(TABELAS.fechamentos, dados);
}

// Verificar se produto existe (evitar duplicados)
async function checkProdutoExiste(nome, codigo, barcode) {
  try {
    const client = getSupabase();
    if (!client) return { existe: false };
    
    let query = client.from(TABELAS.produtos).select('id,nome,codigo');
    
    if (nome) {
      query = query.ilike('nome', nome.trim());
    }
    
    const { data, error } = await query.limit(5);
    
    if (error) return { existe: false, error };
    
    // Verificar nome similar ou codigo/barcode igual
    const similar = data?.filter(p => {
      const nomeMatch = nome && p.nome && (
        p.nome.toLowerCase() === nome.toLowerCase() ||
        p.nome.toLowerCase().includes(nome.toLowerCase()) ||
        nome.toLowerCase().includes(p.nome.toLowerCase())
      );
      const codigoMatch = codigo && p.codigo && p.codigo.toLowerCase() === codigo.toLowerCase();
      const barcodeMatch = barcode && p.barcode && p.barcode === barcode;
      return nomeMatch || codigoMatch || barcodeMatch;
    });
    
    return { existe: similar && similar.length > 0, produtos: similar || [] };
  } catch (e) {
    return { existe: false, error: e };
  }
}

// Funcao para sincronizar dados pendentes (offline -> online)
async function sincronizarPendentes() {
  const pendentes = JSON.parse(localStorage.getItem('pendentes_sync') || '[]');
  if (pendentes.length === 0) return;
  
  const novosPendentes = [];
  
  for (const item of pendentes) {
    try {
      const client = getSupabase();
      if (!client) {
        novosPendentes.push(item);
        continue;
      }
      
      const { error } = await client.from(item.tabela).insert(item.dados);
      
      if (error) {
        console.error(`[SYNC] Erro ao sincronizar ${item.tabela}:`, error.message);
        novosPendentes.push(item);
      } else {
        console.log(`[SYNC] Sincronizado: ${item.tabela}`);
      }
    } catch (e) {
      novosPendentes.push(item);
    }
  }
  
  localStorage.setItem('pendentes_sync', JSON.stringify(novosPendentes));
  
  if (novosPendentes.length === 0) {
    app.showToast('Todos os dados sincronizados com sucesso!', 'success');
  } else if (novosPendentes.length < pendentes.length) {
    app.showToast(`${pendentes.length - novosPendentes.length} itens sincronizados`, 'success');
  }
}

// Adicionar a fila de sync offline
function adicionarPendente(tabela, dados) {
  const pendentes = JSON.parse(localStorage.getItem('pendentes_sync') || '[]');
  pendentes.push({ tabela, dados, timestamp: new Date().toISOString() });
  localStorage.setItem('pendentes_sync', JSON.stringify(pendentes));
}

// API global
window.SupabaseAPI = {
  init: initSupabase,
  getClient: getSupabase,
  checkConnection: checkSupabaseConnection,
  tabelas: TABELAS,
  // Produtos
  getProdutos,
  getProdutoById,
  createProduto,
  updateProduto,
  deleteProduto,
  // Categorias
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  // Vendas
  getVendas,
  getVendasHoje,
  createVenda,
  deleteVenda,
  // Caixa
  getCaixa,
  createCaixa,
  // Movimentacoes
  getMovimentacoes,
  createMovimentacao,
  // Transferencias
  getTransferencias,
  createTransferencia,
  // Bombas
  getBombas,
  createBomba,
  updateBomba,
  deleteBomba,
  // Perdas
  getPerdas,
  createPerda,
  // Roubos
  getRoubos,
  createRoubo,
  // Fechamentos
  getFechamentos,
  createFechamento,
  // Util
  checkProdutoExiste,
  sincronizarPendentes,
  adicionarPendente
};

// Inicializar automaticamente
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
});
