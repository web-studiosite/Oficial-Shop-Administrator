/* ==========================================
   SHOP ADMINISTRATION ERP - FORMULAS.JS
   Calculos, formatacao e funcoes utilitarias
   ========================================== */

// ===== FORMATACAO =====

function formatMoney(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return 'MT 0,00';
  return 'MT ' + parseFloat(valor).toLocaleString('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatNumber(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return '0';
  return parseFloat(valor).toLocaleString('pt-MZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatDate(data) {
  if (!data) return '--';
  const d = new Date(data);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateOnly(data) {
  if (!data) return '--';
  const d = new Date(data);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// ===== CALCULOS ERP =====

// Calcular margem de lucro (%)
function calcularMargemLucro(precoCompra, precoVenda) {
  const compra = parseFloat(precoCompra) || 0;
  const venda = parseFloat(precoVenda) || 0;
  if (compra <= 0) return 0;
  return ((venda - compra) / compra) * 100;
}

// Calcular lucro unitario
function calcularLucroUnitario(precoCompra, precoVenda) {
  const compra = parseFloat(precoCompra) || 0;
  const venda = parseFloat(precoVenda) || 0;
  return venda - compra;
}

// Calcular total de venda
function calcularTotalVenda(quantidade, precoUnitario, descontoPercent = 0) {
  const qtd = parseFloat(quantidade) || 0;
  const preco = parseFloat(precoUnitario) || 0;
  const desc = parseFloat(descontoPercent) || 0;
  const subtotal = qtd * preco;
  const descontoValor = subtotal * (desc / 100);
  return subtotal - descontoValor;
}

// Calcular lucro total de venda
function calcularLucroVenda(quantidade, precoCompra, precoVenda, descontoPercent = 0) {
  const qtd = parseFloat(quantidade) || 0;
  const compra = parseFloat(precoCompra) || 0;
  const venda = parseFloat(precoVenda) || 0;
  const desc = parseFloat(descontoPercent) || 0;
  const totalVenda = (qtd * venda) * (1 - desc / 100);
  const totalCusto = qtd * compra;
  return totalVenda - totalCusto;
}

// Calcular custo medio ponderado
function calcularCustoMedio(estoqueAtual, custoAtual, novaQuantidade, novoCusto) {
  const estq = parseFloat(estoqueAtual) || 0;
  const custo = parseFloat(custoAtual) || 0;
  const qtd = parseFloat(novaQuantidade) || 0;
  const custoN = parseFloat(novoCusto) || 0;
  
  const totalQuantidade = estq + qtd;
  if (totalQuantidade <= 0) return 0;
  
  const valorTotal = (estq * custo) + (qtd * custoN);
  return valorTotal / totalQuantidade;
}

// Calcular valor total em estoque
function calcularValorEstoque(quantidade, custoMedio) {
  return (parseFloat(quantidade) || 0) * (parseFloat(custoMedio) || 0);
}

// Calcular saldo de caixa
function calcularSaldoCaixa(movimentos) {
  let entradas = 0;
  let saidas = 0;
  
  for (const m of movimentos) {
    const valor = parseFloat(m.valor) || 0;
    if (m.tipo === 'entrada') {
      entradas += valor;
    } else {
      saidas += valor;
    }
  }
  
  return { entradas, saidas, saldo: entradas - saidas };
}

// Calcular totais de vendas
function calcularTotaisVendas(vendas) {
  let total = 0;
  let lucroTotal = 0;
  let quantidade = 0;
  
  for (const v of vendas) {
    total += parseFloat(v.total) || 0;
    lucroTotal += parseFloat(v.lucro) || 0;
    quantidade += parseFloat(v.quantidade) || 0;
  }
  
  return { total, lucroTotal, quantidade };
}

// Calcular totais de perdas/roubos
function calcularTotaisPerdas(perdas) {
  let quantidadeTotal = 0;
  let valorTotal = 0;
  
  for (const p of perdas) {
    quantidadeTotal += parseFloat(p.quantidade) || 0;
    valorTotal += parseFloat(p.valor) || 0;
  }
  
  return { quantidadeTotal, valorTotal };
}

// Calcular diferenca de inventario
function calcularDiferencaInventario(sistema, fisico) {
  const sist = parseFloat(sistema) || 0;
  const fis = parseFloat(fisico) || 0;
  return fis - sist;
}

// Calcular variacao percentual
function calcularVariacaoPercentual(valorAnterior, valorAtual) {
  const ant = parseFloat(valorAnterior) || 0;
  const atual = parseFloat(valorAtual) || 0;
  if (ant === 0) return atual > 0 ? 100 : 0;
  return ((atual - ant) / Math.abs(ant)) * 100;
}

// Calcular totais de combustivel
function calcularTotaisCombustivel(registros) {
  let entradas = 0;
  let consumo = 0;
  let perdas = 0;
  
  for (const r of registros) {
    const total = parseFloat(r.total) || 0;
    const litros = parseFloat(r.litros) || 0;
    if (r.tipo_movimento === 'entrada') {
      entradas += total;
    } else {
      consumo += total;
    }
    if (r.perda) {
      perdas += parseFloat(r.perda) || 0;
    }
  }
  
  return { entradas, consumo, saldo: entradas - consumo, perdas };
}

// ===== GERADOR DE CODIGO INTELIGENTE =====

function gerarCodigoInteligente(nome, categoria, unidade) {
  const agora = new Date();
  const ano = agora.getFullYear().toString().slice(-2);
  const sequencia = Math.floor(Math.random() * 900) + 100;
  
  let prefixo = 'PRD';
  
  if (nome) {
    const palavras = nome.trim().split(/\s+/);
    if (palavras.length >= 2) {
      prefixo = (palavras[0].substring(0, 3) + '-' + palavras[1].substring(0, 3)).toUpperCase();
    } else if (palavras.length === 1) {
      prefixo = palavras[0].substring(0, 6).toUpperCase();
    }
  }
  
  // Adicionar indicador de categoria
  let catCode = '';
  if (categoria) {
    catCode = '-' + categoria.toString().substring(0, 3).toUpperCase();
  }
  
  // Adicionar indicador de unidade
  let unitCode = unidade ? unidade.toString().substring(0, 2).toUpperCase() : 'UN';
  
  return `${prefixo}${catCode}-${ano}-${sequencia}`;
}

// ===== FUNCOES DE DATA =====

function getHoje() {
  return new Date().toISOString().split('T')[0];
}

function getInicioDia(data) {
  const d = data ? new Date(data) : new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getFimDia(data) {
  const d = data ? new Date(data) : new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function getDataFormatada(data) {
  const d = data ? new Date(data) : new Date();
  return d.toLocaleDateString('pt-MZ');
}

function getHoraFormatada(data) {
  const d = data ? new Date(data) : new Date();
  return d.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });
}

// ===== VALIDACAO =====

function validarEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validarNumeroPositivo(valor) {
  const n = parseFloat(valor);
  return !isNaN(n) && n > 0;
}

function validarNaoVazio(valor) {
  return valor !== null && valor !== undefined && valor.toString().trim() !== '';
}

// ===== LOCALSTORAGE =====

function saveLocal(key, data) {
  try {
    localStorage.setItem(`shopadmin_${key}`, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('[LOCALSTORAGE] Erro ao salvar:', e.message);
    return false;
  }
}

function loadLocal(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(`shopadmin_${key}`);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('[LOCALSTORAGE] Erro ao carregar:', e.message);
    return defaultValue;
  }
}

function removeLocal(key) {
  localStorage.removeItem(`shopadmin_${key}`);
}

// ===== EXPORTACAO =====

function exportToCSV(dados, nomeArquivo) {
  if (!dados || dados.length === 0) return;
  
  const headers = Object.keys(dados[0]);
  const csvContent = [
    headers.join(';'),
    ...dados.map(row => headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(';') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    }).join(';'))
  ].join('\n');
  
  downloadFile(csvContent, `${nomeArquivo}.csv`, 'text/csv;charset=utf-8');
}

function exportToJSON(dados, nomeArquivo) {
  const jsonContent = JSON.stringify(dados, null, 2);
  downloadFile(jsonContent, `${nomeArquivo}.json`, 'application/json');
}

function exportToTXT(dados, nomeArquivo) {
  let txtContent = '';
  for (const item of dados) {
    for (const [key, value] of Object.entries(item)) {
      txtContent += `${key}: ${value}\n`;
    }
    txtContent += '---\n';
  }
  downloadFile(txtContent, `${nomeArquivo}.txt`, 'text/plain');
}

function exportToXML(dados, nomeArquivo, rootElement = 'dados') {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;
  for (const item of dados) {
    xml += '  <item>\n';
    for (const [key, value] of Object.entries(item)) {
      const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
      xml += `    <${safeKey}>${escapeXml(value)}</${safeKey}>\n`;
    }
    xml += '  </item>\n';
  }
  xml += `</${rootElement}>`;
  downloadFile(xml, `${nomeArquivo}.xml`, 'application/xml');
}

function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function enviarPorWhatsApp(telefone, mensagem) {
  const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

// ===== UTILS =====

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) result[groupKey] = [];
    result[groupKey].push(item);
    return result;
  }, {});
}

function somarPor(array, key) {
  return array.reduce((total, item) => total + (parseFloat(item[key]) || 0), 0);
}

function mediaPor(array, key) {
  if (array.length === 0) return 0;
  return somarPor(array, key) / array.length;
}

function maxPor(array, key) {
  if (array.length === 0) return 0;
  return Math.max(...array.map(item => parseFloat(item[key]) || 0));
}

function minPor(array, key) {
  if (array.length === 0) return 0;
  return Math.min(...array.map(item => parseFloat(item[key]) || 0));
}

// ===== DETECAO DE PRODUTOS SIMILARES =====

function calcularSimilaridade(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Distancia de Levenshtein simplificada
  const len = Math.max(s1.length, s2.length);
  if (len === 0) return 1;
  
  let matches = 0;
  const minLen = Math.min(s1.length, s2.length);
  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  return matches / len;
}

function detectarProdutoSimilar(nome, produtosExistentes) {
  const SIMILARIDADE_LIMITE = 0.75;
  
  for (const prod of produtosExistentes) {
    const similaridade = calcularSimilaridade(nome, prod.nome || '');
    if (similaridade >= SIMILARIDADE_LIMITE) {
      return { similar: true, produto: prod, score: similaridade };
    }
  }
  
  return { similar: false, produto: null, score: 0 };
}
// ===== ESTOQUE REAL BASEADO EM MOVIMENTACOES =====

function calcularEstoqueReal(produtoId, movimentacoes = []) {
  let saldo = 0;

  for (const mov of movimentacoes) {

    if (mov.produto_id != produtoId) continue;

    const qtd = parseFloat(mov.quantidade) || 0;

    // ENTRADAS
    if (
      mov.tipo === 'entrada' ||
      mov.tipo === 'devolucao' ||
      mov.tipo === 'reposicao'
    ) {
      saldo += qtd;
    }

    // SAIDAS
    if (
      mov.tipo === 'saida' ||
      mov.tipo === 'venda' ||
      mov.tipo === 'perda' ||
      mov.tipo === 'roubo' ||
      mov.tipo === 'transferencia'
    ) {
      saldo -= qtd;
    }
  }

  return saldo;
}
// ===== API GLOBAL =====
window.Formulas = {
  formatMoney,
  formatNumber,
  formatDate,
  formatDateOnly,
  calcularMargemLucro,
  calcularLucroUnitario,
  calcularTotalVenda,
  calcularLucroVenda,
  calcularCustoMedio,
  calcularValorEstoque,
  calcularSaldoCaixa,
  calcularTotaisVendas,
  calcularTotaisPerdas,
  calcularDiferencaInventario,
  calcularVariacaoPercentual,
  calcularTotaisCombustivel,
  gerarCodigoInteligente,
  getHoje,
  getInicioDia,
  getFimDia,
  getDataFormatada,
  getHoraFormatada,
  validarEmail,
  validarNumeroPositivo,
  validarNaoVazio,
  saveLocal,
  loadLocal,
  removeLocal,
  exportToCSV,
  exportToJSON,
  exportToTXT,
  exportToXML,
  downloadFile,
  enviarPorWhatsApp,
  deepClone,
  generateId,
  debounce,
  groupBy,
  somarPor,
  mediaPor,
  maxPor,
  minPor,
  calcularSimilaridade,
  detectarProdutoSimilar
};
