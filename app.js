/* ==========================================
   SHOP ADMINISTRATION ERP - APP.JS
   Sistema completo de gestao empresarial
   ========================================== */

const app = {
  // Estado
  state: {
    currentUser: null,
    currentRole: 'admin',
    currentPage: 'dashboard',
    sidebarCollapsed: false,
    supabaseOnline: false,
    dados: {
      produtos: [],
      categorias: [],
      vendas: [],
      caixa: [],
      movimentacoes: [],
      transferencias: [],
      bombas: [],
      perdas: [],
      roubos: [],
      fechamentos: []
    },
    charts: {},
    notifications: [],
    diaFechado: false,
    produtoEditando: null,
    categoriaEditando: null,
    importBuffer: null
  },

  // ===== INICIALIZACAO =====
  init() {
    this.carregarDadosLocais();
    this.setupEventListeners();
    this.atualizarStatusSupabase();
    this.iniciarMonitoramento();
    console.log('[APP] Shop Administration ERP inicializado');
  },

  setupEventListeners() {
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
      const userMenu = document.querySelector('.user-menu');
      const dropdown = document.getElementById('user-dropdown');
      if (userMenu && dropdown && !userMenu.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  },

  iniciarMonitoramento() {
    // Verificar conexao Supabase a cada 30 segundos
    setInterval(() => this.atualizarStatusSupabase(), 30000);
  },

  // ===== LOGIN =====
  async login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;

    if (!Formulas.validarEmail(email)) {
      this.showToast('Email invalido', 'error');
      return;
    }
    if (!Formulas.validarNaoVazio(password)) {
      this.showToast('Senha obrigatoria', 'error');
      return;
    }

    this.state.currentUser = { email, role, nome: email.split('@')[0] };
    this.state.currentRole = role;

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('user-name').textContent = this.state.currentUser.nome;

    // Configurar UI baseada no perfil
    this.configurarUIBaseadaNoPerfil();

    // Carregar dados
    await this.carregarDados();

    // Navegar para pagina inicial
    if (role === 'junior' || role === 'caixa') {
      this.navigate('junior');
    } else {
      this.navigate('dashboard');
    }

    this.showToast(`Bem-vindo, ${this.state.currentUser.nome}!`, 'success');
  },

  logout() {
    this.state.currentUser = null;
    this.state.currentRole = 'admin';
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    this.showToast('Sessao encerrada', 'info');
  },

  configurarUIBaseadaNoPerfil() {
    const role = this.state.currentRole;
    const adminSections = document.querySelectorAll('.admin-only');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

    if (role === 'junior' || role === 'caixa') {
      adminSections.forEach(s => s.style.display = 'none');
      // Limitar navegacao
      navItems.forEach(item => {
        const page = item.getAttribute('data-page');
        if (['relatorios', 'configuracoes', 'combustivel', 'bombas', 'perdas', 'roubos', 'caixa'].includes(page)) {
          item.style.display = 'none';
        }
      });
    } else {
      adminSections.forEach(s => s.style.display = '');
      navItems.forEach(item => item.style.display = '');
    }
  },

  // ===== NAVEGACAO =====
  navigate(page) {
    // Verificar restricoes
    if (this.state.currentRole === 'junior' || this.state.currentRole === 'caixa') {
      const permitidas = ['junior', 'loja', 'armazem', 'estoque', 'inventario', 'transferencias', 'importacao'];
      if (!permitidas.includes(page)) {
        this.showToast('Acesso restrito ao Gestor Principal', 'warning');
        return;
      }
    }

    this.state.currentPage = page;

    // Atualizar paginas
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    // Atualizar nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navEl) navEl.classList.add('active');

    // Atualizar titulo
    const titulos = {
      dashboard: 'Dashboard',
      produtos: 'Gestao de Produtos',
      categorias: 'Categorias',
      estoque: 'Controle de Estoque',
      loja: 'Loja',
      armazem: 'Armazem Central',
      transferencias: 'Transferencias',
      vendas: 'Vendas',
      inventario: 'Inventario',
      reconciliacao: 'Reconciliacao',
      fechamento: 'Fechamento de Dia',
      combustivel: 'Combustivel',
      bombas: 'Bombas',
      caixa: 'Fluxo de Caixa',
      perdas: 'Registro de Perdas',
      roubos: 'Registro de Roubos',
      relatorios: 'Relatorios Inteligentes',
      importacao: 'Importacao de Dados',
      configuracoes: 'Configuracoes',
      junior: 'Painel Operacional'
    };

    document.getElementById('page-title').textContent = titulos[page] || page;
    document.getElementById('breadcrumb').textContent = `Principal / ${titulos[page] || page}`;

    // Renderizar conteudo especifico
    this.renderPage(page);
  },

  renderPage(page) {
    switch(page) {
      case 'dashboard': this.renderDashboard(); break;
      case 'produtos': this.renderProdutos(); break;
      case 'categorias': this.renderCategorias(); break;
      case 'estoque': this.renderEstoque(); break;
      case 'loja': this.renderLoja(); break;
      case 'armazem': this.renderArmazem(); break;
      case 'vendas': this.renderVendas(); break;
      case 'inventario': this.renderInventario(); break;
      case 'transferencias': this.renderTransferencias(); break;
      case 'perdas': this.renderPerdas(); break;
      case 'roubos': this.renderRoubos(); break;
      case 'caixa': this.renderCaixa(); break;
      case 'combustivel': this.renderCombustivel(); break;
      case 'bombas': this.renderBombas(); break;
      case 'fechamento': this.renderFechamento(); break;
      case 'reconciliacao': this.renderReconciliacao(); break;
    }
  },

  toggleSidebar() {
    this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
    document.getElementById('sidebar').classList.toggle('collapsed');
  },

  toggleUserMenu() {
    document.getElementById('user-dropdown').classList.toggle('hidden');
  },

  // ===== SUPABASE =====
  async atualizarStatusSupabase() {
    try {
      const online = await SupabaseAPI.checkConnection();
      this.state.supabaseOnline = online;
      const badge = document.getElementById('supabase-status');
      if (badge) {
        badge.innerHTML = `<i class="fas fa-circle" style="color:${online ? 'var(--success)' : 'var(--danger)'}"></i> Supabase`;
      }
      const syncBadge = document.getElementById('sync-status');
      if (syncBadge) {
        syncBadge.innerHTML = `<i class="fas fa-${online ? 'sync' : 'exclamation-circle'}" style="color:${online ? 'var(--success)' : 'var(--warning)'}"></i> ${online ? 'Sincronizado' : 'Offline'}`;
      }

      const offlineBadge = document.getElementById('offline-status');
      if (offlineBadge) {
        offlineBadge.classList.toggle('hidden', online);
      }

      if (online) {
        await SupabaseAPI.sincronizarPendentes();
      }
    } catch (e) {
      console.warn('[APP] Falha ao verificar Supabase:', e.message);
    }
  },

  async carregarDados() {
    this.showToast('Carregando dados...', 'info');

    // Carregar cada tabela individualmente (sem Promise.all)
    const tabelas = [
      { nome: 'produtos', fn: SupabaseAPI.getProdutos },
      { nome: 'categorias', fn: SupabaseAPI.getCategorias },
      { nome: 'vendas', fn: SupabaseAPI.getVendas },
      { nome: 'caixa', fn: SupabaseAPI.getCaixa },
      { nome: 'movimentacoes', fn: SupabaseAPI.getMovimentacoes },
      { nome: 'transferencias', fn: SupabaseAPI.getTransferencias },
      { nome: 'bombas', fn: SupabaseAPI.getBombas },
      { nome: 'perdas', fn: SupabaseAPI.getPerdas },
      { nome: 'roubos', fn: SupabaseAPI.getRoubos },
      { nome: 'fechamentos', fn: SupabaseAPI.getFechamentos }
    ];

    for (const t of tabelas) {
      try {
        const { data, error } = await t.fn();
        if (!error && data) {
          this.state.dados[t.nome] = data;
        } else {
          // Fallback para localStorage
          this.state.dados[t.nome] = Formulas.loadLocal(t.nome, []);
        }
      } catch (e) {
        console.error(`[APP] Erro ao carregar ${t.nome}:`, e.message);
        this.state.dados[t.nome] = Formulas.loadLocal(t.nome, []);
      }
    }

    // Se nao houver categorias padrao, criar
    if (this.state.dados.categorias.length === 0) {
      this.state.dados.categorias = [
        { id: Formulas.generateId(), nome: 'Bebidas', descricao: 'Bebidas em geral', cor: '#3b82f6', created_at: new Date().toISOString() },
        { id: Formulas.generateId(), nome: 'Alimentos', descricao: 'Produtos alimenticios', cor: '#10b981', created_at: new Date().toISOString() },
        { id: Formulas.generateId(), nome: 'Higiene', descricao: 'Produtos de higiene pessoal', cor: '#8b5cf6', created_at: new Date().toISOString() },
        { id: Formulas.generateId(), nome: 'Limpeza', descricao: 'Produtos de limpeza', cor: '#f59e0b', created_at: new Date().toISOString() },
        { id: Formulas.generateId(), nome: 'Outros', descricao: 'Outros produtos', cor: '#64748b', created_at: new Date().toISOString() }
      ];
      Formulas.saveLocal('categorias', this.state.dados.categorias);
    }

    this.renderDashboard();
    this.showToast('Dados carregados!', 'success');
  },

  carregarDadosLocais() {
    const tabelas = ['produtos', 'categorias', 'vendas', 'caixa', 'movimentacoes', 'transferencias', 'bombas', 'perdas', 'roubos', 'fechamentos'];
    for (const t of tabelas) {
      this.state.dados[t] = Formulas.loadLocal(t, []);
    }
  },

  // ===== PRODUTOS =====
  gerarCodigoInteligente() {
    const nome = document.getElementById('prod-nome').value;
    const categoria = document.getElementById('prod-categoria').value;
    const unidade = document.getElementById('prod-unidade').value;
    if (nome) {
      const codigo = Formulas.gerarCodigoInteligente(nome, categoria, unidade);
      document.getElementById('prod-codigo').value = codigo;
    }
  },

  calcularMargem() {
    const compra = parseFloat(document.getElementById('prod-preco-compra').value) || 0;
    const venda = parseFloat(document.getElementById('prod-preco-venda').value) || 0;
    const margem = Formulas.calcularMargemLucro(compra, venda);
    document.getElementById('prod-margem').value = margem.toFixed(2) + '%';
  },

  async preencherSelectCategorias() {
    const select = document.getElementById('prod-categoria');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione...</option>';
    for (const cat of this.state.dados.categorias) {
      const option = document.createElement('option');
      option.value = cat.nome;
      option.textContent = cat.nome;
      select.appendChild(option);
    }
  },

  async preencherSelectProdutos(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Selecione...</option>';
    for (const prod of this.state.dados.produtos) {
      const option = document.createElement('option');
      option.value = prod.id;
      option.textContent = `${prod.nome} (${prod.codigo}) - Stock: ${prod.quantidade || 0}`;
      option.dataset.produto = JSON.stringify(prod);
      select.appendChild(option);
    }
  },

  async preencherSelectBombas() {
    const select = document.getElementById('comb-bomba');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione...</option>';
    for (const bomba of this.state.dados.bombas) {
      const option = document.createElement('option');
      option.value = bomba.id;
      option.textContent = `${bomba.nome} - ${bomba.tipo_combustivel || 'Misto'}`;
      select.appendChild(option);
    }
  },

  async confirmarSalvarProduto() {
    const nome = document.getElementById('prod-nome').value.trim();
    const codigo = document.getElementById('prod-codigo').value.trim();
    const categoria = document.getElementById('prod-categoria').value;
    const precoCompra = parseFloat(document.getElementById('prod-preco-compra').value) || 0;
    const precoVenda = parseFloat(document.getElementById('prod-preco-venda').value) || 0;
    const quantidade = parseFloat(document.getElementById('prod-quantidade').value) || 0;
    const unidade = document.getElementById('prod-unidade').value;
    const estoqueMin = parseFloat(document.getElementById('prod-estoque-min').value) || 10;
    const descricao = document.getElementById('prod-descricao').value.trim();
    const barcode = document.getElementById('prod-barcode').value.trim();

    if (!Formulas.validarNaoVazio(nome)) {
      this.showToast('Nome do produto obrigatorio', 'error');
      return;
    }
    if (!Formulas.validarNaoVazio(categoria)) {
      this.showToast('Categoria obrigatoria', 'error');
      return;
    }
    if (precoCompra <= 0) {
      this.showToast('Preco de compra invalido', 'error');
      return;
    }
    if (precoVenda <= 0) {
      this.showToast('Preco de venda invalido', 'error');
      return;
    }

    // Verificar duplicados
    const { existe, produtos } = await SupabaseAPI.checkProdutoExiste(nome, codigo, barcode);
    if (existe && !this.state.produtoEditando) {
      const nomes = produtos.map(p => p.nome).join(', ');
      this.showToast(`PRODUTO JA EXISTE: ${nomes}`, 'warning');

      // Mostrar opcoes
      if (confirm('Produto ja existe. Deseja adicionar stock ao produto existente?')) {
        const prodExistente = produtos[0];
        const qtdAdicional = parseFloat(prompt('Quantidade a adicionar:', '0')) || 0;
        if (qtdAdicional > 0) {
          await this.adicionarStockExistente(prodExistente.id, qtdAdicional, precoCompra);
        }
        this.closeAllModals();
        return;
      } else {
        return;
      }
    }

    const dados = {
      id: this.state.produtoEditando || Formulas.generateId(),
      nome,
      codigo: codigo || Formulas.gerarCodigoInteligente(nome, categoria, unidade),
      categoria,
      preco_compra: precoCompra,
      preco_venda: precoVenda,
      margem_lucro: Formulas.calcularMargemLucro(precoCompra, precoVenda),
      quantidade,
      quantidade_armazem: quantidade,
      quantidade_loja: 0,
      unidade,
      estoque_minimo: estoqueMin,
      descricao,
      barcode,
      custo_medio: precoCompra,
      vendidos: 0,
      perdidos: 0,
      roubados: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Salvar no Supabase ou local
    try {
      if (this.state.supabaseOnline) {
        if (this.state.produtoEditando) {
          await SupabaseAPI.updateProduto(this.state.produtoEditando, dados);
        } else {
          await SupabaseAPI.createProduto(dados);
        }
      } else {
        SupabaseAPI.adicionarPendente('produtos', dados);
      }
    } catch (e) {
      console.warn('[APP] Falha ao salvar no Supabase, usando local:', e.message);
    }

    // Atualizar local
    if (this.state.produtoEditando) {
      const idx = this.state.dados.produtos.findIndex(p => p.id === this.state.produtoEditando);
      if (idx >= 0) this.state.dados.produtos[idx] = dados;
    } else {
      this.state.dados.produtos.push(dados);
    }

    // Registrar movimentacao
    if (!this.state.produtoEditando) {
      await this.registrarMovimentacao('entrada', nome, quantidade, quantidade, 'Cadastro de produto');
    }

    Formulas.saveLocal('produtos', this.state.dados.produtos);
    this.closeAllModals();
    this.renderProdutos();
    this.renderDashboard();
    this.showToast(this.state.produtoEditando ? 'Produto atualizado!' : 'Produto adicionado com sucesso!', 'success');
    this.state.produtoEditando = null;
  },

  async adicionarStockExistente(produtoId, quantidade, custo) {
    const prod = this.state.dados.produtos.find(p => p.id === produtoId);
    if (!prod) return;

    const qtdAnterior = parseFloat(prod.quantidade) || 0;
    const qtdNova = qtdAnterior + quantidade;
    const custoAnterior = parseFloat(prod.custo_medio) || parseFloat(prod.preco_compra) || 0;
    const novoCustoMedio = Formulas.calcularCustoMedio(qtdAnterior, custoAnterior, quantidade, custo);

    // ESTOQUE PASSA A SER CONTROLADO PELAS MOVIMENTACOES
// prod.quantidade = qtdNova;
// prod.quantidade_armazem = (parseFloat(prod.quantidade_armazem) || 0) + quantidade;

    try {
      if (this.state.supabaseOnline) {
        await SupabaseAPI.updateProduto(produtoId, prod);
      }
    } catch (e) {
      SupabaseAPI.adicionarPendente('produtos', prod);
    }

    await this.registrarMovimentacao('entrada', prod.nome, quantidade, qtdNova, `Adicao de stock - custo medio recalculado: ${Formulas.formatMoney(novoCustoMedio)}`);

    Formulas.saveLocal('produtos', this.state.dados.produtos);
    this.renderProdutos();
    this.renderEstoque();
    this.showToast(`Stock adicionado! Novo saldo: ${qtdNova}`, 'success');
  },

  editarProduto(id) {
    const prod = this.state.dados.produtos.find(p => p.id === id);
    if (!prod) return;

    this.state.produtoEditando = id;
    document.getElementById('prod-modal-title').textContent = 'Editar Produto';
    document.getElementById('prod-nome').value = prod.nome || '';
    document.getElementById('prod-codigo').value = prod.codigo || '';
    document.getElementById('prod-categoria').value = prod.categoria || '';
    document.getElementById('prod-unidade').value = prod.unidade || 'un';
    document.getElementById('prod-preco-compra').value = prod.preco_compra || '';
    document.getElementById('prod-preco-venda').value = prod.preco_venda || '';
    document.getElementById('prod-margem').value = (prod.margem_lucro ? prod.margem_lucro.toFixed(2) : '0') + '%';
    document.getElementById('prod-quantidade').value = prod.quantidade || '';
    document.getElementById('prod-estoque-min').value = prod.estoque_minimo || 10;
    document.getElementById('prod-descricao').value = prod.descricao || '';
    document.getElementById('prod-barcode').value = prod.barcode || '';

    this.openModal('modal-produto');
  },

  async excluirProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      if (this.state.supabaseOnline) {
        await SupabaseAPI.deleteProduto(id);
      }
    } catch (e) {
      console.warn('[APP] Falha ao excluir do Supabase:', e.message);
    }

    this.state.dados.produtos = this.state.dados.produtos.filter(p => p.id !== id);
    Formulas.saveLocal('produtos', this.state.dados.produtos);
    this.renderProdutos();
    this.showToast('Produto excluido', 'info');
  },

  previewProduto() {
    const nome = document.getElementById('prod-nome').value || 'N/A';
    const codigo = document.getElementById('prod-codigo').value || 'N/A';
    const categoria = document.getElementById('prod-categoria').value || 'N/A';
    const precoCompra = Formulas.formatMoney(document.getElementById('prod-preco-compra').value);
    const precoVenda = Formulas.formatMoney(document.getElementById('prod-preco-venda').value);
    const margem = document.getElementById('prod-margem').value;
    const qtd = document.getElementById('prod-quantidade').value || '0';

    document.getElementById('prod-preview').style.display = 'block';
    document.getElementById('prod-preview-content').innerHTML = `
      <div class="rec-item"><span>Nome</span><span>${nome}</span></div>
      <div class="rec-item"><span>Codigo</span><span>${codigo}</span></div>
      <div class="rec-item"><span>Categoria</span><span>${categoria}</span></div>
      <div class="rec-item"><span>Preco Compra</span><span>${precoCompra}</span></div>
      <div class="rec-item"><span>Preco Venda</span><span>${precoVenda}</span></div>
      <div class="rec-item"><span>Margem</span><span>${margem}</span></div>
      <div class="rec-item"><span>Quantidade</span><span>${qtd}</span></div>
    `;
  },

  // ===== CATEGORIAS =====
  async confirmarSalvarCategoria() {
    const nome = document.getElementById('cat-nome').value.trim();
    const descricao = document.getElementById('cat-descricao').value.trim();
    const cor = document.getElementById('cat-cor').value;

    if (!Formulas.validarNaoVazio(nome)) {
      this.showToast('Nome da categoria obrigatorio', 'error');
      return;
    }

    const dados = {
      id: this.state.categoriaEditando || Formulas.generateId(),
      nome,
      descricao,
      cor,
      created_at: new Date().toISOString()
    };

    try {
      if (this.state.supabaseOnline) {
        if (this.state.categoriaEditando) {
          await SupabaseAPI.updateCategoria(this.state.categoriaEditando, dados);
        } else {
          await SupabaseAPI.createCategoria(dados);
        }
      }
    } catch (e) {
      console.warn('[APP] Falha ao salvar categoria:', e.message);
    }

    if (this.state.categoriaEditando) {
      const idx = this.state.dados.categorias.findIndex(c => c.id === this.state.categoriaEditando);
      if (idx >= 0) this.state.dados.categorias[idx] = dados;
    } else {
      this.state.dados.categorias.push(dados);
    }

    Formulas.saveLocal('categorias', this.state.dados.categorias);
    this.closeAllModals();
    this.renderCategorias();
    this.showToast('Categoria salva!', 'success');
    this.state.categoriaEditando = null;
  },

  async excluirCategoria(id) {
    if (!confirm('Deseja excluir esta categoria?')) return;
    this.state.dados.categorias = this.state.dados.categorias.filter(c => c.id !== id);
    try { if (this.state.supabaseOnline) await SupabaseAPI.deleteCategoria(id); } catch (e) {}
    Formulas.saveLocal('categorias', this.state.dados.categorias);
    this.renderCategorias();
    this.showToast('Categoria excluida', 'info');
  },


  // ===== MOVIMENTACAO =====
  async registrarMovimentacao(tipo, produto, quantidade, saldoAtual, observacao) {
    const mov = {
      id: Formulas.generateId(),
      tipo,
      produto,
      quantidade: parseFloat(quantidade) || 0,
      saldo_anterior: parseFloat(quantidade) || 0,
      saldo_atual: parseFloat(saldoAtual) || 0,
      observacao: observacao || '',
      utilizador: this.state.currentUser?.nome || 'Sistema',
      data: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    try {
      if (this.state.supabaseOnline) {
        await SupabaseAPI.createMovimentacao(mov);
      } else {
        SupabaseAPI.adicionarPendente('movimentacoes', mov);
      }
    } catch (e) {
      console.warn('[APP] Falha ao registrar movimentacao:', e.message);
    }

    this.state.dados.movimentacoes.unshift(mov);
    Formulas.saveLocal('movimentacoes', this.state.dados.movimentacoes);
  },

  // ===== VENDAS =====
  async confirmarVenda() {
    const produtoId = document.getElementById('venda-produto').value;
    const quantidade = parseFloat(document.getElementById('venda-quantidade').value) || 0;
    const desconto = parseFloat(document.getElementById('venda-desconto').value) || 0;
    const observacao = document.getElementById('venda-obs').value.trim();

    if (!produtoId) { this.showToast('Selecione um produto', 'error'); return; }
    if (quantidade <= 0) { this.showToast('Quantidade invalida', 'error'); return; }

    const prod = this.state.dados.produtos.find(p => p.id === produtoId);
    if (!prod) { this.showToast('Produto nao encontrado', 'error'); return; }

    const qtdDisponivel = parseFloat(prod.quantidade_loja) || parseFloat(prod.quantidade) || 0;
    if (quantidade > qtdDisponivel) {
      this.showToast(`Stock insuficiente! Disponivel: ${qtdDisponivel}`, 'error');
      return;
    }

    const precoVenda = parseFloat(prod.preco_venda) || 0;
    const precoCompra = parseFloat(prod.preco_compra) || 0;
    const total = Formulas.calcularTotalVenda(quantidade, precoVenda, desconto);
    const lucro = Formulas.calcularLucroVenda(quantidade, precoCompra, precoVenda, desconto);

    const venda = {
      id: Formulas.generateId(),
      produto_id: produtoId,
      produto_nome: prod.nome,
      quantidade,
      preco_unitario: precoVenda,
      desconto,
      subtotal: quantidade * precoVenda,
      total,
      lucro,
      observacao,
      utilizador: this.state.currentUser?.nome || 'Sistema',
      data: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Salvar
    try {
      if (this.state.supabaseOnline) {
        await SupabaseAPI.createVenda(venda);
      } else {
        SupabaseAPI.adicionarPendente('vendas', venda);
      }
    } catch (e) {
      console.warn('[APP] Falha ao salvar venda:', e.message);
    }

    this.state.dados.vendas.unshift(venda);
    Formulas.saveLocal('vendas', this.state.dados.vendas);

    // Atualizar estoque
    const qtdAnterior = parseFloat(prod.quantidade) || 0;
    prod.quantidade = qtdAnterior - quantidade;
    prod.quantidade_loja = (parseFloat(prod.quantidade_loja) || 0) - quantidade;
    prod.vendidos = (parseFloat(prod.vendidos) || 0) + quantidade;
    prod.updated_at = new Date().toISOString();

    try {
      if (this.state.supabaseOnline) await SupabaseAPI.updateProduto(prod.id, prod);
    } catch (e) { SupabaseAPI.adicionarPendente('produtos', prod); }

    Formulas.saveLocal('produtos', this.state.dados.produtos);

    // Registrar no caixa
    await this.registrarCaixa('entrada', `Venda: ${prod.nome} x${quantidade}`, total);

    // Registrar movimentacao
    await this.registrarMovimentacao('saida', prod.nome, quantidade, prod.quantidade, `Venda - Total: ${Formulas.formatMoney(total)}`);

    this.closeAllModals();
    this.renderVendas();
    this.renderDashboard();
    this.showToast(`Venda registada! Lucro: ${Formulas.formatMoney(lucro)}`, 'success');
  },

  atualizarPrecoVenda() {
    const select = document.getElementById('venda-produto');
    const option = select.selectedOptions[0];
    if (option && option.dataset.produto) {
      const prod = JSON.parse(option.dataset.produto);
      document.getElementById('venda-preco').value = prod.preco_venda || 0;
      this.calcularTotalVenda();
    }
  },

  calcularTotalVenda() {
    const qtd = parseFloat(document.getElementById('venda-quantidade').value) || 0;
    const preco = parseFloat(document.getElementById('venda-preco').value) || 0;
    const desc = parseFloat(document.getElementById('venda-desconto').value) || 0;
    const total = Formulas.calcularTotalVenda(qtd, preco, desc);
    document.getElementById('venda-total').value = Formulas.formatMoney(total);
  },

  previewVenda() {
    this.calcularTotalVenda();
    const select = document.getElementById('venda-produto');
    const option = select.selectedOptions[0];
    const produtoNome = option ? option.textContent.split(' (')[0] : 'N/A';
    const qtd = document.getElementById('venda-quantidade').value;
    const preco = Formulas.formatMoney(document.getElementById('venda-preco').value);
    const desc = document.getElementById('venda-desconto').value;
    const total = document.getElementById('venda-total').value;

    document.getElementById('venda-preview').style.display = 'block';
    document.getElementById('venda-preview-content').innerHTML = `
      <div class="rec-item"><span>Produto</span><span>${produtoNome}</span></div>
      <div class="rec-item"><span>Quantidade</span><span>${qtd}</span></div>
      <div class="rec-item"><span>Preco Unit</span><span>${preco}</span></div>
      <div class="rec-item"><span>Desconto</span><span>${desc}%</span></div>
      <div class="rec-item total"><span>TOTAL</span><span>${total}</span></div>
    `;
  },

  // ===== STOCK =====
  async confirmarAddStock() {
    const produtoId = document.getElementById('stock-produto').value;
    const quantidade = parseFloat(document.getElementById('stock-quantidade').value) || 0;
    const custo = parseFloat(document.getElementById('stock-custo').value) || 0;
    const destino = document.getElementById('stock-destino').value;
    const obs = document.getElementById('stock-obs').value.trim();

    if (!produtoId) { this.showToast('Selecione um produto', 'error'); return; }
    if (quantidade <= 0) { this.showToast('Quantidade invalida', 'error'); return; }

    const prod = this.state.dados.produtos.find(p => p.id === produtoId);
    if (!prod) { this.showToast('Produto nao encontrado', 'error'); return; }

    const qtdAnterior = parseFloat(prod.quantidade) || 0;
    const custoAnterior = parseFloat(prod.custo_medio) || parseFloat(prod.preco_compra) || 0;
    const qtdNova = qtdAnterior + quantidade;
    const novoCustoMedio = custo > 0
      ? Formulas.calcularCustoMedio(qtdAnterior, custoAnterior, quantidade, custo)
      : custoAnterior;

    prod.quantidade = qtdNova;
    if (destino === 'loja') {
      prod.quantidade_loja = (parseFloat(prod.quantidade_loja) || 0) + quantidade;
    } else {
      prod.quantidade_armazem = (parseFloat(prod.quantidade_armazem) || 0) + quantidade;
    }
    prod.custo_medio = novoCustoMedio;
    prod.updated_at = new Date().toISOString();

    try {
      if (this.state.supabaseOnline) await SupabaseAPI.updateProduto(prod.id, prod);
    } catch (e) { SupabaseAPI.adicionarPendente('produtos', prod); }

    Formulas.saveLocal('produtos', this.state.dados.produtos);

    await this.registrarMovimentacao('entrada', prod.nome, quantidade, qtdNova, `Stock adicionado (${destino})${obs ? ': ' + obs : ''}`);

    this.closeAllModals();
    this.renderEstoque();
    this.renderProdutos();
    this.renderDashboard();
    this.showToast(`Stock adicionado! Novo custo medio: ${Formulas.formatMoney(novoCustoMedio)}`, 'success');
  },

  previewAddStock() {
    const select = document.getElementById('stock-produto');
    const option = select.selectedOptions[0];
    const produtoNome = option ? option.textContent.split(' (')[0] : 'N/A';
    const qtd = document.getElementById('stock-quantidade').value || '0';
    const custo = Formulas.formatMoney(document.getElementById('stock-custo').value || 0);
    const destino = document.getElementById('stock-destino').value;

    document.getElementById('stock-preview').style.display = 'block';
    document.getElementById('stock-preview-content').innerHTML = `
      <div class="rec-item"><span>Produto</span><span>${produtoNome}</span></div>
      <div class="rec-item"><span>Quantidade</span><span>+${qtd}</span></div>
      <div class="rec-item"><span>Custo Unit</span><span>${custo}</span></div>
      <div class="rec-item"><span>Destino</span><span>${destino.toUpperCase()}</span></div>
    `;
  },

  // ===== CAIXA =====
  async registrarCaixa(tipo, descricao, valor) {
    const mov = {
      id: Formulas.generateId(),
      tipo,
      descricao,
      valor: parseFloat(valor) || 0,
      utilizador: this.state.currentUser?.nome || 'Sistema',
      data: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    try {
      if (this.state.supabaseOnline) await SupabaseAPI.createCaixa(mov);
      else SupabaseAPI.adicionarPendente('caixa', mov);
    } catch (e) {}

    this.state.dados.caixa.unshift(mov);
    Formulas.saveLocal('caixa', this.state.dados.caixa);
  },

  async confirmarCaixa() {
    const tipo = document.getElementById('caixa-tipo').value;
    const valor = parseFloat(document.getElementById('caixa-valor').value) || 0;
    const descricao = document.getElementById('caixa-descricao').value.trim();
    const obs = document.getElementById('caixa-obs').value.trim();

    if (!Formulas.validarNaoVazio(descricao)) { this.showToast('Descricao obrigatoria', 'error'); return; }
    if (valor <= 0) { this.showToast('Valor invalido', 'error'); return; }

    await this.registrarCaixa(tipo, descricao + (obs ? ` - ${obs}` : ''), valor);

    this.closeAllModals();
    this.renderCaixa();
    this.renderDashboard();
    this.showToast(`Movimento de ${tipo} registado!`, 'success');
  },

  // ===== TRANSFERENCIAS =====
  async confirmarTransferencia() {
    const produtoId = document.getElementById('trans-produto').value;
    const de = document.getElementById('trans-de').value;
    const para = document.getElementById('trans-para').value;
    const quantidade = parseFloat(document.getElementById('trans-quantidade').value) || 0;
    const obs = document.getElementById('trans-obs').value.trim();

    if (!produtoId) { this.showToast('Selecione um produto', 'error'); return; }
    if (de === para) { this.showToast('Origem e destino nao podem ser iguais', 'error'); return; }
    if (quantidade <= 0) { this.showToast('Quantidade invalida', 'error'); return; }

    const prod = this.state.dados.produtos.find(p => p.id === produtoId);
    if (!prod) { this.showToast('Produto nao encontrado', 'error'); return; }

    const disponivel = de === 'armazem'
      ? (parseFloat(prod.quantidade_armazem) || 0)
      : (parseFloat(prod.quantidade_loja) || 0);

    if (quantidade > disponivel) {
      this.showToast(`Stock insuficiente no ${de}! Disponivel: ${disponivel}`, 'error');
      return;
    }

    // Atualizar produto
    if (de === 'armazem') {
      prod.quantidade_armazem = (parseFloat(prod.quantidade_armazem) || 0) - quantidade;
    } else {
      prod.quantidade_loja = (parseFloat(prod.quantidade_loja) || 0) - quantidade;
    }

    if (para === 'armazem') {
      prod.quantidade_armazem = (parseFloat(prod.quantidade_armazem) || 0) + quantidade;
    } else {
      prod.quantidade_loja = (parseFloat(prod.quantidade_loja) || 0) + quantidade;
    }

    prod.updated_at = new Date().toISOString();

    try {
      if (this.state.supabaseOnline) await SupabaseAPI.updateProduto(prod.id, prod);
    } catch (e) { SupabaseAPI.adicionarPendente('produtos', prod); }

    Formulas.saveLocal('produtos', this.state.dados.produtos);

    // Registrar transferencia
    const trans = {
      id: Formulas.generateId(),
      produto_id: produtoId,
      produto_nome: prod.nome,
      de,
      para,
      quantidade,
      observacao: obs,
      utilizador: this.state.currentUser?.nome || 'Sistema',
      data: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    try {
      if (this.state.supabaseOnline) await SupabaseAPI.createTransferencia(trans);
      else SupabaseAPI.adicionarPendente('transferencias', trans);
    } catch (e) {}

    this.state.dados.transferencias.unshift(trans);
    Formulas.saveLocal('transferencias', this.state.dados.transferencias);

    await this.registrarMovimentacao('transferencia', prod.nome, quantidade, prod.quantidade, `Transferencia: ${de} -> ${para}`);

    this.closeAllModals();
    this.renderTransferencias();
    this.renderEstoque();
    this.showToast(`Transferencia de ${de} para ${para} concluida!`, 'success');
  },

  // ===== PERDAS =====
  async confirmarPerda() {
    const produtoId = document.getElementById('perda-produto').value;
    const quantidade = parseFloat(document.getElementById('perda-quantidade').value) || 0;
    const local = document.getElementById('perda-local').value;
    const motivo = document.getElementById('perda-motivo').value.trim();

    if (!produtoId) { this.showToast('Selecione um produto', 'error'); return; }
    if (quantidade <= 0) { this.showToast('Quantidade invalida', 'error'); return; }
    if (!Formulas.validarNaoVazio(motivo)) { this.showToast('Motivo obrigatorio', 'error'); return; }

    const prod = this.state.dados.produtos.find(p => p.id === produtoId);
    if (!prod) { this.showToast('Produto nao encontrado', 'error'); return; }

    const custo = parseFloat(prod.custo_medio) || parseFloat(prod.preco_compra) || 0;
    const valor = quantidade * custo;

    const perda = {
      id: Formulas.generateId(),
      produto_id: produtoId,
      produto_nome: prod.nome,
      quantidade,
      valor,
      motivo,
      local,
      utilizador: this.state.currentUser?.nome || 'Sistema',
      data: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    try {
      if (this.state.supabaseOnline) await SupabaseAPI.createPerda(perda);
      else SupabaseAPI.adicionarPendente('perdas', perda);
    } catch (e) {}

    this.state.dados.perdas.unshift(perda);
    Formulas.saveLocal('perdas', this.state.dados.perdas);

    // Atualizar estoque
    prod.quantidade = (parseFloat(prod.quantidade) || 0) - quantidade;
    if (local === 'loja') {
      prod.quantidade_loja = (parseFloat(prod.quantidade_loja) || 0) - quantidade;
    } else {
      prod.quantidade_armazem = (parseFloat(prod.quantidade_armazem) || 0) - quantidade;
    }
    prod.perdidos = (parseFloat(prod.perdidos) || 0) + quantidade;
    prod.updated_at = new Date().toISOString();

    try {
      if (this.state.supabaseOnline) await SupabaseAPI.updateProduto(prod.id, prod);
    } catch (e) { SupabaseAPI.adicionarPendente('produtos', prod); }

    Formulas.saveLocal('produtos', this.state.dados.produtos);

    await this.registrarMovimentacao('perda', prod.nome, quantidade, prod.quantidade, `Perda registrada: ${motivo}`);

    this.closeAllModals();
    this.renderPerdas();
    this.renderDashboard();
    this.showToast(`Perda registrada! Valor: ${Formulas.formatMoney(valor)}`, 'warning');
  },

  previewPerda() {
    const select = document.getElementById('perda-produto');
    const option = select.selectedOptions[0];
    const produtoNome = option ? option.textContent.split(' (')[0] : 'N/A';
    const qtd = document.getElementById('perda-quantidade').value || '0';
    const local = document.getElementById('perda-local').value;
    const motivo = document.getElementById('perda-motivo').value;

    document.getElementById('perda-preview').style.display = 'block';
    document.getElementById('perda-preview-content').innerHTML = `
      <div class="rec-item"><span>Produto</span><span>${produtoNome}</span></div>
      <div class="rec-item"><span>Quantidade</span><span>-${qtd}</span></div>
      <div class="rec-item"><span>Local</span><span>${local.toUpperCase()}</span></div>
      <div class="rec-item"><span>Motivo</span><span>${motivo}</span></div>
    `;
  },

  // ===== ROUBOS =====
  async confirmarRoubo() {
    const produtoId = document.getElementById('roubo-produto').value;
    const quantidade = parseFloat(document.getElementById('roubo-quantidade').value) || 0;
    const local = document.getElementById('roubo-local').value;
    const descricao = document.getElementById('roubo-descricao').value.trim();

    if (!produtoId) { this.showToast('Selecione um produto', 'error'); return; }
    if (quantidade <= 0) { this.showToast('Quantidade invalida', 'error'); return; }
    if (!Formulas.validarNaoVazio(descricao)) { this.showToast('Descricao obrigatoria', 'error'); return; }

    const prod = this.state.dados.produtos.find(p => p.id === produtoId);
    if (!prod) { this.showToast('Produto nao encontrado', 'error'); return; }

    const custo = parseFloat(prod.custo_medio) || parseFloat(prod.preco_compra) || 0;
    const valor = quantidade * custo;

    const roubo = {
      id: Formulas.generateId(),
      produto_id: produtoId,
      produto_nome: prod.nome,
      quantidade,
      valor,
      descricao,
      local,
      utilizador: this.state.currentUser?.nome || 'Sistema',
      data: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    try {
      if (this.state.supabaseOnline) await SupabaseAPI.createRoubo(roubo);
      else SupabaseAPI.adicionarPendente('roubos', roubo);
    } catch (e) {}

    this.state.dados.roubos.unshift(roubo);
    Formulas.saveLocal('roubos', this.state.dados.roubos);

    // Atualizar estoque
    prod.quantidade = (parseFloat(prod.quantidade) || 0) - quantidade;
    if (local === 'loja') {
      prod.quantidade_loja = (parseFloat(prod.quantidade_loja) || 0) - quantidade;
    } else {
      prod.quantidade_armazem = (parseFloat(prod.quantidade_armazem) || 0) - quantidade;
    }
    prod.roubados = (parseFloat(prod.roubados) || 0) + quantidade;
    prod.updated_at = new Date().toISOString();

    try {
      if (this.state.supabaseOnline) await SupabaseAPI.updateProduto(prod.id, prod);
    } catch (e) { SupabaseAPI.adicionarPendente('produtos', prod); }

    Formulas.saveLocal('produtos', this.state.dados.produtos);

    await this.registrarMovimentacao('roubo', prod.nome, quantidade, prod.quantidade, `Roubo registrado: ${descricao}`);

    this.closeAllModals();
    this.renderRoubos();
    this.renderDashboard();
    this.showToast(`Roubo registrado! Valor: ${Formulas.formatMoney(valor)}`, 'error');
  },

  previewRoubo() {
    const select = document.getElementById('roubo-produto');
    const option = select.selectedOptions[0];
    const produtoNome = option ? option.textContent.split(' (')[0] : 'N/A';
    const qtd = document.getElementById('roubo-quantidade').value || '0';
    const local = document.getElementById('roubo-local').value;
    const desc = document.getElementById('roubo-descricao').value;

    document.getElementById('roubo-preview').style.display = 'block';
    document.getElementById('roubo-preview-content').innerHTML = `
      <div class="rec-item"><span>Produto</span><span>${produtoNome}</span></div>
      <div class="rec-item"><span>Quantidade</span><span>-${qtd}</span></div>
      <div class="rec-item"><span>Local</span><span>${local.toUpperCase()}</span></div>
      <div class="rec-item"><span>Descricao</span><span>${desc}</span></div>
    `;
  },

  // ===== COMBUSTIVEL =====
  async confirmarCombustivel() {
    const tipo = document.getElementById('comb-tipo').value;
    const bombaId = document.getElementById('comb-bomba').value;
    const litros = parseFloat(document.getElementById('comb-litros').value) || 0;
    const custoLitro = parseFloat(document.getElementById('comb-custo-litro').value) || 0;
    const obs = document.getElementById('comb-obs').value.trim();

    if (!bombaId) { this.showToast('Selecione uma bomba', 'error'); return; }
    if (litros <= 0) { this.showToast('Litros invalido', 'error'); return; }
    if (custoLitro <= 0) { this.showToast('Custo por litro invalido', 'error'); return; }

    const total = litros * custoLitro;
    const bomba = this.state.dados.bombas.find(b => b.id === bombaId);

    const reg = {
      id: Formulas.generateId(),
      tipo,
      bomba_id: bombaId,
      bomba_nome: bomba ? bomba.nome : 'Desconhecida',
      litros,
      custo_litro: custoLitro,
      total,
      observacao: obs,
      utilizador: this.state.currentUser?.nome || 'Sistema',
      data: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Salvar localmente (nao ha tabela especifica de combustivel no Supabase)
    const combustivel = Formulas.loadLocal('combustivel', []);
    combustivel.unshift(reg);
    Formulas.saveLocal('combustivel', combustivel);

    this.closeAllModals();
    this.renderCombustivel();
    this.renderDashboard();
    this.showToast(`Abastecimento registado! Total: ${Formulas.formatMoney(total)}`, 'success');
  },

  // ===== BOMBAS =====
  async confirmarBomba() {
    const nome = document.getElementById('bomba-nome').value.trim();
    const tipo = document.getElementById('bomba-tipo').value;
    const capacidade = parseFloat(document.getElementById('bomba-capacidade').value) || 0;
    const local = document.getElementById('bomba-local').value.trim();

    if (!Formulas.validarNaoVazio(nome)) { this.showToast('Nome da bomba obrigatorio', 'error'); return; }

    const bomba = {
      id: Formulas.generateId(),
      nome,
      tipo_combustivel: tipo,
      capacidade,
      localizacao: local,
      created_at: new Date().toISOString()
    };

    try {
      if (this.state.supabaseOnline) await SupabaseAPI.createBomba(bomba);
      else SupabaseAPI.adicionarPendente('bombas', bomba);
    } catch (e) {}

    this.state.dados.bombas.push(bomba);
    Formulas.saveLocal('bombas', this.state.dados.bombas);

    this.closeAllModals();
    this.renderBombas();
    this.showToast('Bomba adicionada!', 'success');
  },

  async excluirBomba(id) {
    if (!confirm('Deseja excluir esta bomba?')) return;
    this.state.dados.bombas = this.state.dados.bombas.filter(b => b.id !== id);
    try { if (this.state.supabaseOnline) await SupabaseAPI.deleteBomba(id); } catch (e) {}
    Formulas.saveLocal('bombas', this.state.dados.bombas);
    this.renderBombas();
    this.showToast('Bomba excluida', 'info');
  },


  // ===== RENDER DASHBOARD =====
  renderDashboard() {
    // Vendas hoje
    const hoje = Formulas.getHoje();
    const vendasHoje = this.state.dados.vendas.filter(v => v.created_at && v.created_at.startsWith(hoje));
    const { total: totalVendasHoje, lucroTotal: lucroHoje } = Formulas.calcularTotaisVendas(vendasHoje);
    document.getElementById('dash-vendas').textContent = Formulas.formatMoney(totalVendasHoje);
    document.getElementById('vendas-hoje').textContent = Formulas.formatMoney(totalVendasHoje);
    document.getElementById('vendas-lucro').textContent = Formulas.formatMoney(lucroHoje);
    document.getElementById('vendas-qtd').textContent = vendasHoje.length;

    // Caixa
    const saldoCaixa = Formulas.calcularSaldoCaixa(this.state.dados.caixa);
    document.getElementById('dash-caixa').textContent = Formulas.formatMoney(saldoCaixa.saldo);
    document.getElementById('caixa-entradas').textContent = Formulas.formatMoney(saldoCaixa.entradas);
    document.getElementById('caixa-saidas').textContent = Formulas.formatMoney(saldoCaixa.saidas);
    document.getElementById('caixa-saldo').textContent = Formulas.formatMoney(saldoCaixa.saldo);

    // Combustivel
    const combustivel = Formulas.loadLocal('combustivel', []);
    const totaisComb = Formulas.calcularTotaisCombustivel(combustivel);
    document.getElementById('dash-combustivel').textContent = Formulas.formatMoney(totaisComb.saldo);
    document.getElementById('comb-entradas').textContent = Formulas.formatMoney(totaisComb.entradas);
    document.getElementById('comb-consumo').textContent = Formulas.formatMoney(totaisComb.consumo);
    document.getElementById('comb-saldo').textContent = Formulas.formatMoney(totaisComb.saldo);

    // Estoque baixo
    const estoqueBaixo = this.state.dados.produtos.filter(p => {
      const qtd = parseFloat(p.quantidade) || 0;
      const min = parseFloat(p.estoque_minimo) || 10;
      return qtd > 0 && qtd <= min;
    });
    document.getElementById('dash-estoque-baixo').textContent = estoqueBaixo.length;
    document.getElementById('est-itens-baixos').textContent = estoqueBaixo.length;

    // Inventario
    const totalItens = this.state.dados.produtos.reduce((t, p) => t + (parseFloat(p.quantidade) || 0), 0);
    const valorTotal = this.state.dados.produtos.reduce((t, p) => {
      return t + ((parseFloat(p.quantidade) || 0) * (parseFloat(p.custo_medio) || parseFloat(p.preco_compra) || 0));
    }, 0);
    document.getElementById('dash-inventario').textContent = `${totalItens} itens`;
    document.getElementById('inv-total').textContent = totalItens;
    document.getElementById('inv-valor').textContent = Formulas.formatMoney(valorTotal);
    document.getElementById('est-total-itens').textContent = totalItens;
    document.getElementById('est-valor-total').textContent = Formulas.formatMoney(valorTotal);

    // Perdas + Roubos
    const totaisPerdas = Formulas.calcularTotaisPerdas(this.state.dados.perdas);
    const totaisRoubos = Formulas.calcularTotaisPerdas(this.state.dados.roubos);
    const totalPerdasRoubos = totaisPerdas.valorTotal + totaisRoubos.valorTotal;
    document.getElementById('dash-perdas').textContent = Formulas.formatMoney(totalPerdasRoubos);

    // Reconciliacoes
    document.getElementById('dash-reconciliacoes').textContent = this.state.dados.fechamentos.length;

    // Lucro total
    const todasVendas = this.state.dados.vendas;
    const { lucroTotal } = Formulas.calcularTotaisVendas(todasVendas);
    document.getElementById('dash-lucro').textContent = Formulas.formatMoney(lucroTotal);

    // Tabela alertas
    this.renderAlertasEstoque(estoqueBaixo);

    // Tabela movimentacoes
    this.renderUltimasMovimentacoes();

    // Graficos
    this.renderCharts(vendasHoje);
  },

  renderAlertasEstoque(produtos) {
    const tbody = document.getElementById('dash-alertas-body');
    if (!tbody) return;
    if (produtos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum alerta</td></tr>';
      return;
    }
    tbody.innerHTML = produtos.slice(0, 5).map(p => {
      const qtd = parseFloat(p.quantidade) || 0;
      const min = parseFloat(p.estoque_minimo) || 10;
      return `<tr>
        <td>${p.nome}</td>
        <td>${p.codigo}</td>
        <td>${qtd}</td>
        <td>${min}</td>
        <td><span class="status-pill ${qtd === 0 ? 'danger' : 'warning'}">${qtd === 0 ? 'ZERADO' : 'BAIXO'}</span></td>
      </tr>`;
    }).join('');
  },

  renderUltimasMovimentacoes() {
    const tbody = document.getElementById('dash-movimentacoes-body');
    if (!tbody) return;
    const movs = this.state.dados.movimentacoes.slice(0, 5);
    if (movs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma movimentacao</td></tr>';
      return;
    }
    tbody.innerHTML = movs.map(m => `
      <tr>
        <td>${Formulas.formatDate(m.data)}</td>
        <td><span class="status-pill ${m.tipo === 'entrada' ? 'success' : m.tipo === 'saida' ? 'warning' : 'info'}">${m.tipo.toUpperCase()}</span></td>
        <td>${m.produto}</td>
        <td>${m.quantidade}</td>
        <td>${m.utilizador}</td>
      </tr>
    `).join('');
  },

  renderCharts(vendasHoje) {
    // Grafico de vendas semanal
    const ctx1 = document.getElementById('chart-vendas-semanal');
    if (ctx1) {
      const dias = [];
      const valores = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dataStr = d.toISOString().split('T')[0];
        dias.push(d.toLocaleDateString('pt-MZ', { weekday: 'short' }));
        const vendasDia = this.state.dados.vendas.filter(v => v.created_at && v.created_at.startsWith(dataStr));
        valores.push(vendasDia.reduce((t, v) => t + (parseFloat(v.total) || 0), 0));
      }

      if (this.state.chartVendas) this.state.chartVendas.destroy();
      this.state.chartVendas = new Chart(ctx1, {
        type: 'line',
        data: {
          labels: dias,
          datasets: [{
            label: 'Vendas (MT)',
            data: valores,
            borderColor: '#D4AF37',
            backgroundColor: 'rgba(212,175,55,0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#D4AF37',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(30,58,95,0.2)' }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: 'rgba(30,58,95,0.2)' }, ticks: { color: '#94a3b8' } }
          }
        }
      });
    }

    // Grafico de categorias
    const ctx2 = document.getElementById('chart-categorias');
    if (ctx2) {
      const cats = {};
      for (const v of this.state.dados.vendas) {
        const prod = this.state.dados.produtos.find(p => p.id === v.produto_id);
        const cat = prod ? (prod.categoria || 'Outros') : 'Outros';
        cats[cat] = (cats[cat] || 0) + (parseFloat(v.total) || 0);
      }

      if (this.state.chartCategorias) this.state.chartCategorias.destroy();
      this.state.chartCategorias = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: Object.keys(cats),
          datasets: [{
            data: Object.values(cats),
            backgroundColor: ['#D4AF37', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } }
          }
        }
      });
    }
  },

  // ===== RENDER PRODUTOS =====
  renderProdutos() {
    const tbody = document.getElementById('produtos-body');
    const countEl = document.getElementById('prod-count');
    const prods = this.state.dados.produtos;

    countEl.textContent = `${prods.length} produtos`;

    if (prods.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center">Nenhum produto cadastrado</td></tr>';
      return;
    }

    tbody.innerHTML = prods.map(p => {
      const qtd = parseFloat(p.quantidade) || 0;
      const min = parseFloat(p.estoque_minimo) || 10;
      const status = qtd === 0 ? '<span class="status-pill danger">ZERADO</span>' :
                     qtd <= min ? '<span class="status-pill warning">BAIXO</span>' :
                     '<span class="status-pill success">OK</span>';
      const margem = parseFloat(p.margem_lucro) || Formulas.calcularMargemLucro(p.preco_compra, p.preco_venda);

      return `<tr>
        <td><code>${p.codigo}</code></td>
        <td><strong>${p.nome}</strong></td>
        <td>${p.categoria || '-'}</td>
        <td>${Formulas.formatMoney(p.preco_compra)}</td>
        <td>${Formulas.formatMoney(p.preco_venda)}</td>
        <td>${margem.toFixed(1)}%</td>
        <td>${qtd}</td>
        <td>${p.unidade || 'un'}</td>
        <td>${status}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="app.editarProduto('${p.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="app.excluirProduto('${p.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  },

  filtrarProdutos() {
    const termo = document.getElementById('prod-search').value.toLowerCase();
    const linhas = document.querySelectorAll('#produtos-body tr');
    linhas.forEach(linha => {
      const texto = linha.textContent.toLowerCase();
      linha.style.display = texto.includes(termo) ? '' : 'none';
    });
  },

  // ===== RENDER CATEGORIAS =====
  renderCategorias() {
    const grid = document.getElementById('categorias-grid');
    const cats = this.state.dados.categorias;

    if (cats.length === 0) {
      grid.innerHTML = '<div class="loading-text">Nenhuma categoria</div>';
      return;
    }

    grid.innerHTML = cats.map(c => {
      const count = this.state.dados.produtos.filter(p => p.categoria === c.nome).length;
      return `<div class="category-card">
        <div class="cat-header">
          <div class="cat-color" style="background:${c.cor || '#D4AF37'}">${c.nome.charAt(0).toUpperCase()}</div>
          <div>
            <h4>${c.nome}</h4>
            <p>${c.descricao || ''} - ${count} produtos</p>
          </div>
        </div>
        <div class="cat-actions">
          <button class="btn btn-sm btn-secondary" onclick="app.editarCategoria('${c.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="app.excluirCategoria('${c.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
    }).join('');
  },

  editarCategoria(id) {
    const cat = this.state.dados.categorias.find(c => c.id === id);
    if (!cat) return;
    this.state.categoriaEditando = id;
    document.getElementById('cat-nome').value = cat.nome;
    document.getElementById('cat-descricao').value = cat.descricao || '';
    document.getElementById('cat-cor').value = cat.cor || '#D4AF37';
    this.openModal('modal-categoria');
  },

  filtrarCategorias() {
    const termo = document.getElementById('cat-search').value.toLowerCase();
    const cards = document.querySelectorAll('.category-card');
    cards.forEach(card => {
      card.style.display = card.textContent.toLowerCase().includes(termo) ? '' : 'none';
    });
  },

  // ===== RENDER ESTOQUE =====
  renderEstoque() {
    const tbody = document.getElementById('estoque-body');
    const prods = this.state.dados.produtos;

    if (prods.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">Nenhum produto em estoque</td></tr>';
      return;
    }

    let itensBaixos = 0;

    tbody.innerHTML = prods.map(p => {
      const qtd = parseFloat(p.quantidade) || 0;
      const min = parseFloat(p.estoque_minimo) || 10;
      const armazem = parseFloat(p.quantidade_armazem) || 0;
      const loja = parseFloat(p.quantidade_loja) || 0;
      const custoMedio = parseFloat(p.custo_medio) || parseFloat(p.preco_compra) || 0;
      const status = qtd === 0 ? '<span class="status-pill danger">ZERADO</span>' :
                     qtd <= min ? '<span class="status-pill warning">BAIXO</span>' :
                     '<span class="status-pill success">OK</span>';
      if (qtd <= min && qtd > 0) itensBaixos++;

      return `<tr>
        <td><strong>${p.nome}</strong></td>
        <td><code>${p.codigo}</code></td>
        <td>${armazem}</td>
        <td>${loja}</td>
        <td><strong>${qtd}</strong></td>
        <td>${min}</td>
        <td>${Formulas.formatMoney(custoMedio)}</td>
        <td>${status}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="app.editarProduto('${p.id}')"><i class="fas fa-edit"></i></button>
        </td>
      </tr>`;
    }).join('');

    document.getElementById('est-itens-baixos').textContent = itensBaixos;
  },

  filtrarEstoque() {
    const termo = document.getElementById('est-search').value.toLowerCase();
    const linhas = document.querySelectorAll('#estoque-body tr');
    linhas.forEach(linha => {
      linha.style.display = linha.textContent.toLowerCase().includes(termo) ? '' : 'none';
    });
  },

  // ===== RENDER LOJA =====
  renderLoja() {
    const tbody = document.getElementById('loja-body');
    const countEl = document.getElementById('loja-count');
    const prods = this.state.dados.produtos.filter(p => (parseFloat(p.quantidade_loja) || 0) > 0);

    countEl.textContent = `${prods.length} produtos`;

    if (prods.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum produto na loja</td></tr>';
      return;
    }

    tbody.innerHTML = prods.map(p => {
      const vendidos = parseFloat(p.vendidos) || 0;
      return `<tr>
        <td><code>${p.codigo}</code></td>
        <td><strong>${p.nome}</strong></td>
        <td>${p.categoria || '-'}</td>
        <td>${Formulas.formatMoney(p.preco_venda)}</td>
        <td>${parseFloat(p.quantidade_loja) || 0}</td>
        <td>${vendidos}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="app.efetuarVendaRapida('${p.id}')"><i class="fas fa-cash-register"></i> Vender</button>
        </td>
      </tr>`;
    }).join('');
  },

  filtrarLoja() {
    const termo = document.getElementById('loja-search').value.toLowerCase();
    const linhas = document.querySelectorAll('#loja-body tr');
    linhas.forEach(linha => {
      linha.style.display = linha.textContent.toLowerCase().includes(termo) ? '' : 'none';
    });
  },

  efetuarVendaRapida(produtoId) {
    this.preencherSelectProdutos('venda-produto');
    document.getElementById('venda-produto').value = produtoId;
    this.atualizarPrecoVenda();
    this.openModal('modal-venda');
  },

  // ===== RENDER ARMAZEM =====
  renderArmazem() {
    const tbody = document.getElementById('armazem-body');
    const countEl = document.getElementById('armazem-count');
    const prods = this.state.dados.produtos.filter(p => (parseFloat(p.quantidade_armazem) || 0) > 0);

    countEl.textContent = `${prods.length} produtos`;

    if (prods.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Armazem vazio</td></tr>';
      return;
    }

    tbody.innerHTML = prods.map(p => `<tr>
      <td><code>${p.codigo}</code></td>
      <td><strong>${p.nome}</strong></td>
      <td>${p.categoria || '-'}</td>
      <td>${parseFloat(p.quantidade_armazem) || 0}</td>
      <td>${p.unidade || 'un'}</td>
      <td>${Formulas.formatDate(p.updated_at)}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="app.transferirParaLoja('${p.id}')"><i class="fas fa-exchange-alt"></i> P/Loja</button>
      </td>
    </tr>`).join('');
  },

  filtrarArmazem() {
    const termo = document.getElementById('arm-search').value.toLowerCase();
    const linhas = document.querySelectorAll('#armazem-body tr');
    linhas.forEach(linha => {
      linha.style.display = linha.textContent.toLowerCase().includes(termo) ? '' : 'none';
    });
  },

  transferirParaLoja(produtoId) {
    this.preencherSelectProdutos('trans-produto');
    document.getElementById('trans-produto').value = produtoId;
    document.getElementById('trans-de').value = 'armazem';
    document.getElementById('trans-para').value = 'loja';
    this.openModal('modal-transferencia');
  },

  // ===== RENDER VENDAS =====
  renderVendas() {
    const tbody = document.getElementById('vendas-body');
    const vendas = this.state.dados.vendas;

    if (vendas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">Nenhuma venda registada</td></tr>';
      return;
    }

    tbody.innerHTML = vendas.map(v => `<tr>
      <td>${Formulas.formatDate(v.data || v.created_at)}</td>
      <td>${v.produto_nome || '-'}</td>
      <td>${v.quantidade}</td>
      <td>${Formulas.formatMoney(v.preco_unitario)}</td>
      <td>${v.desconto || 0}%</td>
      <td>${Formulas.formatMoney(v.total)}</td>
      <td style="color:var(--success)">${Formulas.formatMoney(v.lucro)}</td>
      <td>${v.utilizador || '-'}</td>
      <td><button class="btn btn-sm btn-danger" onclick="app.excluirVenda('${v.id}')"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('');
  },

  filtrarVendas() {
    const termo = document.getElementById('venda-search').value.toLowerCase();
    const linhas = document.querySelectorAll('#vendas-body tr');
    linhas.forEach(linha => {
      linha.style.display = linha.textContent.toLowerCase().includes(termo) ? '' : 'none';
    });
  },

  async excluirVenda(id) {
    if (!confirm('Deseja excluir esta venda?')) return;
    try { if (this.state.supabaseOnline) await SupabaseAPI.deleteVenda(id); } catch (e) {}
    this.state.dados.vendas = this.state.dados.vendas.filter(v => v.id !== id);
    Formulas.saveLocal('vendas', this.state.dados.vendas);
    this.renderVendas();
    this.renderDashboard();
  },

  // ===== RENDER INVENTARIO =====
  renderInventario() {
    const tbody = document.getElementById('inventario-body');
    const prods = this.state.dados.produtos;

    if (prods.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center">Inventario vazio</td></tr>';
      return;
    }

    tbody.innerHTML = prods.map(p => {
      const qtd = parseFloat(p.quantidade) || 0;
      const custo = parseFloat(p.custo_medio) || parseFloat(p.preco_compra) || 0;
      const valorStock = qtd * custo;
      const vendidos = parseFloat(p.vendidos) || 0;
      const perdidos = parseFloat(p.perdidos) || 0;
      const roubados = parseFloat(p.roubados) || 0;
      const min = parseFloat(p.estoque_minimo) || 10;
      const status = qtd === 0 ? '<span class="status-pill danger">ZERADO</span>' :
                     qtd <= min ? '<span class="status-pill warning">BAIXO</span>' :
                     '<span class="status-pill success">OK</span>';

      return `<tr>
        <td><strong>${p.nome}</strong></td>
        <td><code>${p.codigo}</code></td>
        <td>${qtd}</td>
        <td>${Formulas.formatMoney(valorStock)}</td>
        <td>${Formulas.formatMoney(custo)}</td>
        <td>${vendidos}</td>
        <td style="color:var(--warning)">${perdidos}</td>
        <td style="color:var(--danger)">${roubados}</td>
        <td>${min}</td>
        <td>${status}</td>
      </tr>`;
    }).join('');
  },

  filtrarInventario() {
    const termo = document.getElementById('inv-search').value.toLowerCase();
    const linhas = document.querySelectorAll('#inventario-body tr');
    linhas.forEach(linha => {
      linha.style.display = linha.textContent.toLowerCase().includes(termo) ? '' : 'none';
    });
  },

  // ===== RENDER TRANSFERENCIAS =====
  renderTransferencias() {
    const tbody = document.getElementById('transferencias-body');
    const trans = this.state.dados.transferencias;

    if (trans.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma transferencia</td></tr>';
      return;
    }

    tbody.innerHTML = trans.map(t => `<tr>
      <td>${Formulas.formatDate(t.data || t.created_at)}</td>
      <td>${t.produto_nome || '-'}</td>
      <td>${t.de || '-'}</td>
      <td>${t.para || '-'}</td>
      <td>${t.quantidade}</td>
      <td>${t.utilizador || '-'}</td>
      <td><span class="status-pill success"><i class="fas fa-check"></i> OK</span></td>
    </tr>`).join('');
  },

  // ===== RENDER PERDAS =====
  renderPerdas() {
    const tbody = document.getElementById('perdas-body');
    const perdas = this.state.dados.perdas;

    if (perdas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma perda registada</td></tr>';
      return;
    }

    tbody.innerHTML = perdas.map(p => `<tr>
      <td>${Formulas.formatDate(p.data || p.created_at)}</td>
      <td>${p.produto_nome || '-'}</td>
      <td>${p.quantidade}</td>
      <td style="color:var(--warning)">${Formulas.formatMoney(p.valor)}</td>
      <td>${p.motivo || '-'}</td>
      <td>${p.local || '-'}</td>
      <td>${p.utilizador || '-'}</td>
    </tr>`).join('');
  },

  // ===== RENDER ROUBOS =====
  renderRoubos() {
    const tbody = document.getElementById('roubos-body');
    const roubos = this.state.dados.roubos;

    if (roubos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum roubo registado</td></tr>';
      return;
    }

    tbody.innerHTML = roubos.map(r => `<tr>
      <td>${Formulas.formatDate(r.data || r.created_at)}</td>
      <td>${r.produto_nome || '-'}</td>
      <td>${r.quantidade}</td>
      <td style="color:var(--danger)">${Formulas.formatMoney(r.valor)}</td>
      <td>${r.descricao || '-'}</td>
      <td>${r.local || '-'}</td>
      <td>${r.utilizador || '-'}</td>
    </tr>`).join('');
  },

  // ===== RENDER CAIXA =====
  renderCaixa() {
    const tbody = document.getElementById('caixa-body');
    const movs = this.state.dados.caixa;

    let saldo = 0;
    const movsComSaldo = movs.map(m => {
      const valor = parseFloat(m.valor) || 0;
      if (m.tipo === 'entrada') saldo += valor;
      else saldo -= valor;
      return { ...m, saldo };
    });

    if (movs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum movimento</td></tr>';
      return;
    }

    tbody.innerHTML = movsComSaldo.map(m => `<tr>
      <td>${Formulas.formatDate(m.data || m.created_at)}</td>
      <td><span class="status-pill ${m.tipo === 'entrada' ? 'success' : 'danger'}">${m.tipo.toUpperCase()}</span></td>
      <td>${m.descricao || '-'}</td>
      <td style="color:${m.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)'}">${Formulas.formatMoney(m.valor)}</td>
      <td>${Formulas.formatMoney(m.saldo)}</td>
      <td>${m.utilizador || '-'}</td>
    </tr>`).join('');
  },

  // ===== RENDER COMBUSTIVEL =====
  renderCombustivel() {
    const tbody = document.getElementById('combustivel-body');
    const combustivel = Formulas.loadLocal('combustivel', []);

    if (combustivel.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum registro</td></tr>';
      return;
    }

    tbody.innerHTML = combustivel.map(c => `<tr>
      <td>${Formulas.formatDate(c.data || c.created_at)}</td>
      <td><span class="status-pill info">${(c.tipo || '-').toUpperCase()}</span></td>
      <td>${c.bomba_nome || '-'}</td>
      <td>${c.litros}</td>
      <td>${Formulas.formatMoney(c.custo_litro)}</td>
      <td>${Formulas.formatMoney(c.total)}</td>
      <td>${c.perda || 0} L</td>
      <td>${c.utilizador || '-'}</td>
    </tr>`).join('');
  },

  // ===== RENDER BOMBAS =====
  renderBombas() {
    const grid = document.getElementById('bombas-grid');
    const bombas = this.state.dados.bombas;

    if (bombas.length === 0) {
      grid.innerHTML = '<div class="loading-text">Nenhuma bomba cadastrada</div>';
      return;
    }

    grid.innerHTML = bombas.map(b => {
      const tipoColors = { gasolina: 'bg-orange', gasoleo: 'bg-blue', kerosene: 'bg-purple', misto: 'bg-green' };
      const colorClass = tipoColors[b.tipo_combustivel] || 'bg-gold';
      return `<div class="bomba-card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div class="stat-icon ${colorClass}"><i class="fas fa-gas-pump"></i></div>
          <div>
            <h4>${b.nome}</h4>
            <p style="font-size:12px;color:var(--text-muted);margin:0;">${b.localizacao || 'Sem localizacao'}</p>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px;">
          <span style="color:var(--text-muted)">Tipo</span>
          <span>${b.tipo_combustivel || 'Misto'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:12px;">
          <span style="color:var(--text-muted)">Capacidade</span>
          <span>${b.capacidade || 0} L</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-secondary" onclick="app.editarBomba('${b.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="app.excluirBomba('${b.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
    }).join('');
  },

  editarBomba(id) {
    const b = this.state.dados.bombas.find(x => x.id === id);
    if (!b) return;
    document.getElementById('bomba-nome').value = b.nome;
    document.getElementById('bomba-tipo').value = b.tipo_combustivel || 'gasolina';
    document.getElementById('bomba-capacidade').value = b.capacidade || '';
    document.getElementById('bomba-local').value = b.localizacao || '';
    this.openModal('modal-bomba');
  },

  // ===== RENDER FECHAMENTO =====
  renderFechamento() {
    const tbody = document.getElementById('fechamentos-body');
    const fechs = this.state.dados.fechamentos;

    document.getElementById('status-data').textContent = Formulas.getDataFormatada();

    if (fechs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum fechamento</td></tr>';
      return;
    }

    tbody.innerHTML = fechs.map(f => `<tr>
      <td>${Formulas.formatDateOnly(f.data)}</td>
      <td>${Formulas.formatMoney(f.vendas)}</td>
      <td>${Formulas.formatMoney(f.caixa)}</td>
      <td>${Formulas.formatMoney(f.combustivel)}</td>
      <td style="color:var(--warning)">${Formulas.formatMoney(f.perdas)}</td>
      <td style="color:var(--danger)">${Formulas.formatMoney(f.roubos)}</td>
      <td style="color:var(--success)">${Formulas.formatMoney(f.lucro)}</td>
      <td><span class="status-pill success">FECHADO</span></td>
    </tr>`).join('');
  },

  // ===== RENDER RECONCILIACAO =====
  renderReconciliacao() {
    // Loja
    const vendas = Formulas.calcularTotaisVendas(this.state.dados.vendas);
    document.getElementById('rec-loja-vendas').textContent = Formulas.formatMoney(vendas.total);
    document.getElementById('rec-loja-stock').textContent = this.state.dados.produtos.reduce((t, p) => t + (parseFloat(p.quantidade_loja) || 0), 0);
    document.getElementById('rec-loja-diff').textContent = 'MT 0,00';

    // Armazem
    const valorArmazem = this.state.dados.produtos.reduce((t, p) => {
      return t + ((parseFloat(p.quantidade_armazem) || 0) * (parseFloat(p.custo_medio) || parseFloat(p.preco_compra) || 0));
    }, 0);
    document.getElementById('rec-arm-entradas').textContent = Formulas.formatMoney(valorArmazem);
    document.getElementById('rec-arm-saidas').textContent = Formulas.formatMoney(vendas.totalCusto || 0);
    document.getElementById('rec-arm-saldo').textContent = Formulas.formatMoney(valorArmazem - (vendas.totalCusto || 0));

    // Perdas
    const perdas = Formulas.calcularTotaisPerdas(this.state.dados.perdas);
    document.getElementById('rec-perdas-total').textContent = Formulas.formatMoney(perdas.valorTotal);
    document.getElementById('rec-perdas-itens').textContent = perdas.quantidadeTotal;

    // Roubos
    const roubos = Formulas.calcularTotaisPerdas(this.state.dados.roubos);
    document.getElementById('rec-roubos-total').textContent = Formulas.formatMoney(roubos.valorTotal);
    document.getElementById('rec-roubos-itens').textContent = roubos.quantidadeTotal;

    // Caixa
    const caixa = Formulas.calcularSaldoCaixa(this.state.dados.caixa);
    document.getElementById('rec-caixa-entradas').textContent = Formulas.formatMoney(caixa.entradas);
    document.getElementById('rec-caixa-saidas').textContent = Formulas.formatMoney(caixa.saidas);
    document.getElementById('rec-caixa-saldo').textContent = Formulas.formatMoney(caixa.saldo);

    // Resumo
    document.getElementById('rec-resumo-lucro').textContent = Formulas.formatMoney(vendas.lucroTotal);
    document.getElementById('rec-resumo-diff').textContent = Formulas.formatMoney(perdas.valorTotal + roubos.valorTotal);
    document.getElementById('rec-resumo-final').textContent = Formulas.formatMoney(caixa.saldo - perdas.valorTotal - roubos.valorTotal);

    // Historico
    const tbody = document.getElementById('reconciliacoes-body');
    if (this.state.dados.fechamentos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhuma reconciliacao</td></tr>';
    } else {
      tbody.innerHTML = this.state.dados.fechamentos.slice(0, 10).map(f => `<tr>
        <td>${Formulas.formatDateOnly(f.data)}</td>
        <td>${Formulas.formatMoney(f.vendas || 0)}</td>
        <td>${Formulas.formatMoney(f.armazem || 0)}</td>
        <td style="color:var(--warning)">${Formulas.formatMoney(f.perdas || 0)}</td>
        <td style="color:var(--danger)">${Formulas.formatMoney(f.roubos || 0)}</td>
        <td>${Formulas.formatMoney(f.caixa || 0)}</td>
        <td>${Formulas.formatMoney(f.diferenca || 0)}</td>
        <td>${f.utilizador || '-'}</td>
      </tr>`).join('');
    }
  },

  // ===== RECONCILIAR SISTEMA =====
  async reconciliarSistema() {
    this.navigate('reconciliacao');
    this.openModal('modal-reconciliacao');
  },

  async analisarReconciliacao() {
    const vendas = Formulas.calcularTotaisVendas(this.state.dados.vendas);
    const caixa = Formulas.calcularSaldoCaixa(this.state.dados.caixa);
    const perdas = Formulas.calcularTotaisPerdas(this.state.dados.perdas);
    const roubos = Formulas.calcularTotaisPerdas(this.state.dados.roubos);
    const combustivel = Formulas.calcularTotaisCombustivel(Formulas.loadLocal('combustivel', []));

    const diferenca = caixa.saldo - perdas.valorTotal - roubos.valorTotal;
    const lucroReal = vendas.lucroTotal - perdas.valorTotal - roubos.valorTotal;

    document.getElementById('reconciliacao-resumo').innerHTML = `
      <div style="display:grid;gap:10px;">
        <div class="rec-item total"><span>VENDAS TOTAIS</span><span>${Formulas.formatMoney(vendas.total)}</span></div>
        <div class="rec-item"><span>Lucro Bruto</span><span>${Formulas.formatMoney(vendas.lucroTotal)}</span></div>
        <div class="rec-item"><span>Total Perdas</span><span style="color:var(--warning)">${Formulas.formatMoney(perdas.valorTotal)}</span></div>
        <div class="rec-item"><span>Total Roubos</span><span style="color:var(--danger)">${Formulas.formatMoney(roubos.valorTotal)}</span></div>
        <div class="rec-item"><span>Combustivel</span><span>${Formulas.formatMoney(combustivel.saldo)}</span></div>
        <div class="rec-item"><span>Saldo Caixa</span><span>${Formulas.formatMoney(caixa.saldo)}</span></div>
        <div class="rec-item total" style="border-top:2px solid var(--accent);padding-top:12px;">
          <span>LUCRO REAL</span><span style="color:${lucroReal >= 0 ? 'var(--success)' : 'var(--danger)'}">${Formulas.formatMoney(lucroReal)}</span>
        </div>
        <div class="rec-item total">
          <span>SALDO FINAL</span><span style="color:var(--accent)">${Formulas.formatMoney(diferenca)}</span>
        </div>
      </div>
    `;
  },

  async confirmarReconciliacao() {
    if (!confirm('Deseja confirmar a reconciliacao?')) return;

    const vendas = Formulas.calcularTotaisVendas(this.state.dados.vendas);
    const caixa = Formulas.calcularSaldoCaixa(this.state.dados.caixa);
    const perdas = Formulas.calcularTotaisPerdas(this.state.dados.perdas);
    const roubos = Formulas.calcularTotaisPerdas(this.state.dados.roubos);
    const combustivel = Formulas.calcularTotaisCombustivel(Formulas.loadLocal('combustivel', []));

    const diferenca = caixa.saldo - perdas.valorTotal - roubos.valorTotal;
    const lucroReal = vendas.lucroTotal - perdas.valorTotal - roubos.valorTotal;

    const fechamento = {
      id: Formulas.generateId(),
      data: new Date().toISOString(),
      vendas: vendas.total,
      lucro: lucroReal,
      caixa: caixa.saldo,
      armazem: this.state.dados.produtos.reduce((t, p) => {
        return t + ((parseFloat(p.quantidade_armazem) || 0) * (parseFloat(p.custo_medio) || parseFloat(p.preco_compra) || 0));
      }, 0),
      combustivel: combustivel.saldo,
      perdas: perdas.valorTotal,
      roubos: roubos.valorTotal,
      diferenca,
      utilizador: this.state.currentUser?.nome || 'Sistema',
      created_at: new Date().toISOString()
    };

    try {
      if (this.state.supabaseOnline) await SupabaseAPI.createFechamento(fechamento);
      else SupabaseAPI.adicionarPendente('fechamentos', fechamento);
    } catch (e) {}

    this.state.dados.fechamentos.unshift(fechamento);
    Formulas.saveLocal('fechamentos', this.state.dados.fechamentos);

    this.closeAllModals();
    this.renderReconciliacao();
    this.renderDashboard();
    this.showToast('Reconciliacao concluida!', 'success');
  },

  // ===== FECHAMENTO DE DIA =====
  async carregarResumoDia() {
    const vendas = Formulas.calcularTotaisVendas(this.state.dados.vendas);
    const caixa = Formulas.calcularSaldoCaixa(this.state.dados.caixa);
    const perdas = Formulas.calcularTotaisPerdas(this.state.dados.perdas);
    const roubos = Formulas.calcularTotaisPerdas(this.state.dados.roubos);
    const combustivel = Formulas.calcularTotaisCombustivel(Formulas.loadLocal('combustivel', []));

    document.getElementById('fechamento-resumo').innerHTML = `
      <div style="display:grid;gap:10px;">
        <div class="rec-item"><span>Data</span><span>${Formulas.getDataFormatada()}</span></div>
        <div class="rec-item"><span>Vendas Totais</span><span>${Formulas.formatMoney(vendas.total)}</span></div>
        <div class="rec-item"><span>Transacoes</span><span>${vendas.quantidade}</span></div>
        <div class="rec-item"><span>Lucro</span><span style="color:var(--success)">${Formulas.formatMoney(vendas.lucroTotal)}</span></div>
        <div class="rec-item"><span>Caixa Final</span><span>${Formulas.formatMoney(caixa.saldo)}</span></div>
        <div class="rec-item"><span>Combustivel</span><span>${Formulas.formatMoney(combustivel.saldo)}</span></div>
        <div class="rec-item"><span>Perdas</span><span style="color:var(--warning)">${Formulas.formatMoney(perdas.valorTotal)}</span></div>
        <div class="rec-item"><span>Roubos</span><span style="color:var(--danger)">${Formulas.formatMoney(roubos.valorTotal)}</span></div>
        <div class="rec-item total"><span>RESUMO GERAL</span><span style="color:var(--accent)">${Formulas.formatMoney(caixa.saldo - perdas.valorTotal - roubos.valorTotal)}</span></div>
      </div>
    `;
  },

  async confirmarFecharDia() {
    if (!confirm('DESEJA REALMENTE FECHAR O DIA? Esta operacao e irreversivel!')) return;

    await this.carregarResumoDia();

    const vendas = Formulas.calcularTotaisVendas(this.state.dados.vendas);
    const caixa = Formulas.calcularSaldoCaixa(this.state.dados.caixa);
    const perdas = Formulas.calcularTotaisPerdas(this.state.dados.perdas);
    const roubos = Formulas.calcularTotaisPerdas(this.state.dados.roubos);
    const combustivel = Formulas.calcularTotaisCombustivel(Formulas.loadLocal('combustivel', []));

    const fechamento = {
      id: Formulas.generateId(),
      data: new Date().toISOString(),
      vendas: vendas.total,
      lucro: vendas.lucroTotal,
      caixa: caixa.saldo,
      combustivel: combustivel.saldo,
      perdas: perdas.valorTotal,
      roubos: roubos.valorTotal,
      movimentacoes: this.state.dados.movimentacoes.length,
      utilizador: this.state.currentUser?.nome || 'Sistema',
      created_at: new Date().toISOString()
    };

    try {
      if (this.state.supabaseOnline) await SupabaseAPI.createFechamento(fechamento);
    } catch (e) {}

    this.state.dados.fechamentos.unshift(fechamento);
    Formulas.saveLocal('fechamentos', this.state.dados.fechamentos);

    this.state.diaFechado = true;
    Formulas.saveLocal('dia_fechado', { data: Formulas.getHoje(), fechado: true });

    this.closeAllModals();
    this.renderFechamento();
    this.showToast('Dia fechado com sucesso!', 'success');
  },

  async iniciarNovoDia() {
    if (!confirm('Deseja iniciar um novo dia? Os dados serao preservados.')) return;

    this.state.diaFechado = false;
    Formulas.saveLocal('dia_fechado', { data: Formulas.getHoje(), fechado: false });

    this.showToast('Novo dia iniciado!', 'success');
    this.renderDashboard();
    this.renderFechamento();
  },

  // ===== RELATORIOS =====
  gerarRelatorio(tipo) {
    let dados = [];
    let nomeArquivo = `relatorio_${tipo}_${Formulas.getHoje()}`;

    switch(tipo) {
      case 'vendas':
        dados = this.state.dados.vendas.map(v => ({
          data: Formulas.formatDate(v.data || v.created_at),
          produto: v.produto_nome,
          quantidade: v.quantidade,
          preco_unitario: Formulas.formatMoney(v.preco_unitario),
          desconto: `${v.desconto || 0}%`,
          total: Formulas.formatMoney(v.total),
          lucro: Formulas.formatMoney(v.lucro),
          utilizador: v.utilizador
        }));
        break;
      case 'estoque':
        dados = this.state.dados.produtos.map(p => ({
          codigo: p.codigo,
          nome: p.nome,
          categoria: p.categoria,
          armazem: p.quantidade_armazem || 0,
          loja: p.quantidade_loja || 0,
          total: p.quantidade,
          custo_medio: Formulas.formatMoney(p.custo_medio || p.preco_compra),
          valor_total: Formulas.formatMoney((p.quantidade || 0) * (p.custo_medio || p.preco_compra || 0))
        }));
        break;
      case 'inventario':
        dados = this.state.dados.produtos.map(p => ({
          produto: p.nome,
          codigo: p.codigo,
          quantidade: p.quantidade,
          vendidos: p.vendidos || 0,
          perdidos: p.perdidos || 0,
          roubados: p.roubados || 0,
          custo_medio: Formulas.formatMoney(p.custo_medio || p.preco_compra)
        }));
        break;
      case 'perdas':
        dados = this.state.dados.perdas.map(p => ({
          data: Formulas.formatDate(p.data || p.created_at),
          produto: p.produto_nome,
          quantidade: p.quantidade,
          valor: Formulas.formatMoney(p.valor),
          motivo: p.motivo,
          local: p.local,
          utilizador: p.utilizador
        }));
        break;
      case 'roubos':
        dados = this.state.dados.roubos.map(r => ({
          data: Formulas.formatDate(r.data || r.created_at),
          produto: r.produto_nome,
          quantidade: r.quantidade,
          valor: Formulas.formatMoney(r.valor),
          descricao: r.descricao,
          local: r.local,
          utilizador: r.utilizador
        }));
        break;
      case 'combustivel':
        dados = Formulas.loadLocal('combustivel', []).map(c => ({
          data: Formulas.formatDate(c.data || c.created_at),
          tipo: c.tipo,
          bomba: c.bomba_nome,
          litros: c.litros,
          custo_litro: Formulas.formatMoney(c.custo_litro),
          total: Formulas.formatMoney(c.total)
        }));
        break;
      case 'caixa':
        dados = this.state.dados.caixa.map(c => ({
          data: Formulas.formatDate(c.data || c.created_at),
          tipo: c.tipo,
          descricao: c.descricao,
          valor: Formulas.formatMoney(c.valor),
          utilizador: c.utilizador
        }));
        break;
      case 'lucro':
        const vendasLucro = Formulas.calcularTotaisVendas(this.state.dados.vendas);
        dados = [{
          total_vendas: Formulas.formatMoney(vendasLucro.total),
          lucro_total: Formulas.formatMoney(vendasLucro.lucroTotal),
          total_transacoes: vendasLucro.quantidade,
          media_lucro_por_venda: Formulas.formatMoney(vendasLucro.quantidade > 0 ? vendasLucro.lucroTotal / vendasLucro.quantidade : 0)
        }];
        break;
    }

    if (dados.length === 0) {
      this.showToast('Sem dados para gerar relatorio', 'warning');
      return;
    }

    // Menu de exportacao
    const opcoes = prompt('Exportar como:\n1 - CSV\n2 - JSON\n3 - TXT\n4 - XML\n\nEscolha (1-4):', '1');

    switch(opcoes) {
      case '1': Formulas.exportToCSV(dados, nomeArquivo); break;
      case '2': Formulas.exportToJSON(dados, nomeArquivo); break;
      case '3': Formulas.exportToTXT(dados, nomeArquivo); break;
      case '4': Formulas.exportToXML(dados, nomeArquivo); break;
      default: Formulas.exportToCSV(dados, nomeArquivo);
    }

    this.showToast(`Relatorio de ${tipo} exportado!`, 'success');
  },

  // ===== IMPORTACAO =====
  handleDragOver(e) { e.preventDefault(); },

  handleDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) this.processarArquivo(files[0]);
  },

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) this.processarArquivo(file);
  },

  processarArquivo(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const conteudo = e.target.result;
      const nome = file.name.toLowerCase();

      try {
        let dados = [];
        if (nome.endsWith('.csv') || nome.endsWith('.txt') || nome.endsWith('.tsv')) {
          dados = this.parseCSV(conteudo);
        } else if (nome.endsWith('.json')) {
          dados = JSON.parse(conteudo);
        } else if (nome.endsWith('.xml')) {
          dados = this.parseXML(conteudo);
        }

        if (dados.length === 0) {
          this.showToast('Nenhum dado encontrado no arquivo', 'warning');
          return;
        }

        this.state.importBuffer = dados;

        document.getElementById('import-info').textContent = `${dados.length} registros detectados`;
        document.getElementById('upload-area').style.display = 'none';
        document.getElementById('import-preview').style.display = 'block';

        // Mostrar preview
        const container = document.getElementById('import-table-container');
        const headers = Object.keys(dados[0]);
        container.innerHTML = `
          <table class="data-table">
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${dados.slice(0, 10).map(row =>
              `<tr>${headers.map(h => `<td>${row[h] !== null && row[h] !== undefined ? String(row[h]).substring(0, 50) : ''}</td>`).join('')}</tr>`
            ).join('')}</tbody>
          </table>
          ${dados.length > 10 ? `<p style="text-align:center;color:var(--text-muted);margin-top:10px;">... e mais ${dados.length - 10} registros</p>` : ''}
        `;
      } catch (err) {
        this.showToast('Erro ao processar arquivo: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  },

  parseCSV(conteudo) {
    const linhas = conteudo.split('\n').filter(l => l.trim());
    if (linhas.length < 2) return [];
    const headers = linhas[0].split(';').map(h => h.trim().replace(/"/g, ''));
    return linhas.slice(1).map(l => {
      const valores = l.split(';');
      const obj = {};
      headers.forEach((h, i) => { obj[h] = valores[i] ? valores[i].replace(/"/g, '').trim() : ''; });
      return obj;
    });
  },

  parseXML(conteudo) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(conteudo, 'text/xml');
    const items = xml.querySelectorAll('item, row, record, produto, venda');
    return Array.from(items).map(item => {
      const obj = {};
      item.children.forEach(child => { obj[child.tagName] = child.textContent; });
      return obj;
    });
  },

  cancelarImportacao() {
    this.state.importBuffer = null;
    document.getElementById('upload-area').style.display = 'block';
    document.getElementById('import-preview').style.display = 'none';
    document.getElementById('import-file').value = '';
  },

  async confirmarImportacao() {
    if (!this.state.importBuffer || this.state.importBuffer.length === 0) {
      this.showToast('Nenhum dado para importar', 'warning');
      return;
    }

    const dados = this.state.importBuffer;
    let importados = 0;

    for (const item of dados) {
      // Tentar mapear campos
      const nome = item.nome || item.Nome || item.produto || item.PRODUTO || '';
      if (!nome) continue;

      const codigo = item.codigo || item.Codigo || item.CODIGO || Formulas.gerarCodigoInteligente(nome, '', 'un');
      const categoria = item.categoria || item.Categoria || item.CATEGORIA || 'Outros';
      const precoCompra = parseFloat(item.preco_compra || item.precoCompra || item.preco_de_compra || item['preco compra'] || 0);
      const precoVenda = parseFloat(item.preco_venda || item.precoVenda || item.preco_de_venda || item['preco venda'] || 0);
      const quantidade = parseFloat(item.quantidade || item.Quantidade || item.quantidade_stock || item.qtd || 0);
      const unidade = item.unidade || item.Unidade || item.UNIT || 'un';

      const produto = {
        id: Formulas.generateId(),
        nome,
        codigo,
        categoria,
        preco_compra: precoCompra,
        preco_venda: precoVenda,
        margem_lucro: Formulas.calcularMargemLucro(precoCompra, precoVenda),
        quantidade,
        quantidade_armazem: quantidade,
        quantidade_loja: 0,
        unidade,
        estoque_minimo: 10,
        custo_medio: precoCompra,
        vendidos: 0,
        perdidos: 0,
        roubados: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Verificar duplicados
      const { existe } = await SupabaseAPI.checkProdutoExiste(nome, codigo);
      if (!existe) {
        try {
          if (this.state.supabaseOnline) await SupabaseAPI.createProduto(produto);
        } catch (e) {}
        this.state.dados.produtos.push(produto);
        await this.registrarMovimentacao('entrada', nome, quantidade, quantidade, 'Importacao');
        importados++;
      }
    }

    Formulas.saveLocal('produtos', this.state.dados.produtos);
    this.cancelarImportacao();
    this.renderProdutos();
    this.renderEstoque();
    this.renderDashboard();
    this.showToast(`${importados} produtos importados com sucesso!`, 'success');
  },

  // ===== INVENTARIO FISICO =====
  async realizarInventarioFisico() {
    const list = document.getElementById('inventario-fisico-list');
    const prods = this.state.dados.produtos;

    list.innerHTML = prods.map(p => `
      <div class="inv-fisico-item" data-id="${p.id}" data-sistema="${p.quantidade || 0}">
        <label>${p.nome} <small style="color:var(--text-muted)">(${p.codigo})</small></label>
        <span style="text-align:center;color:var(--text-muted)">${p.quantidade || 0}</span>
        <input type="number" class="inv-qtd-fisica" placeholder="Contagem" min="0" value="${p.quantidade || 0}">
      </div>
    `).join('');

    this.openModal('modal-inventario-fisico');
  },

  calcularDiferencasInventario() {
    const items = document.querySelectorAll('.inv-fisico-item');
    const diferencas = [];

    items.forEach(item => {
      const id = item.dataset.id;
      const sistema = parseFloat(item.dataset.sistema) || 0;
      const fisica = parseFloat(item.querySelector('.inv-qtd-fisica').value) || 0;
      const diff = fisica - sistema;

      if (diff !== 0) {
        const prod = this.state.dados.produtos.find(p => p.id === id);
        diferencas.push({ id, nome: prod ? prod.nome : id, sistema, fisica, diff });
      }
    });

    const resultado = document.getElementById('inventario-resultado');
    resultado.style.display = 'block';

    if (diferencas.length === 0) {
      document.getElementById('inventario-diff-content').innerHTML = '<p style="color:var(--success)"><i class="fas fa-check"></i> Sem divergencias!</p>';
    } else {
      document.getElementById('inventario-diff-content').innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Produto</th><th>Sistema</th><th>Fisico</th><th>Diferenca</th></tr></thead>
            <tbody>${diferencas.map(d => `<tr>
              <td>${d.nome}</td>
              <td>${d.sistema}</td>
              <td>${d.fisica}</td>
              <td style="color:${d.diff > 0 ? 'var(--success)' : 'var(--danger)'}">${d.diff > 0 ? '+' : ''}${d.diff}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      `;
    }
  },

  async confirmarInventario() {
    const items = document.querySelectorAll('.inv-fisico-item');
    let corrigidos = 0;

    for (const item of items) {
      const id = item.dataset.id;
      const sistema = parseFloat(item.dataset.sistema) || 0;
      const fisica = parseFloat(item.querySelector('.inv-qtd-fisica').value) || 0;
      const diff = fisica - sistema;

      if (diff !== 0) {
        const prod = this.state.dados.produtos.find(p => p.id === id);
        if (prod) {
          prod.quantidade = fisica;
          prod.quantidade_armazem = fisica;
          prod.updated_at = new Date().toISOString();

          try {
            if (this.state.supabaseOnline) await SupabaseAPI.updateProduto(id, prod);
          } catch (e) {}

          await this.registrarMovimentacao('ajuste', prod.nome, Math.abs(diff), fisica, `Ajuste inventario fisico: ${diff > 0 ? 'sobra' : 'falta'} de ${Math.abs(diff)}`);
          corrigidos++;
        }
      }
    }

    Formulas.saveLocal('produtos', this.state.dados.produtos);
    this.closeAllModals();
    this.renderInventario();
    this.renderEstoque();
    this.showToast(`${corrigidos} produtos corrigidos!`, 'success');
  },

  // ===== IMPORT PRODUTOS MODAL =====
  handleImportProdutos(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const conteudo = ev.target.result;
        let dados = [];

        if (file.name.endsWith('.csv')) {
          dados = this.parseCSV(conteudo);
        } else if (file.name.endsWith('.json')) {
          dados = JSON.parse(conteudo);
        }

        this.state.importBuffer = dados;

        const container = document.getElementById('import-prod-table');
        if (dados.length > 0) {
          const headers = Object.keys(dados[0]);
          container.innerHTML = `
            <table class="data-table">
              <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
              <tbody>${dados.slice(0, 10).map(row =>
                `<tr>${headers.map(h => `<td>${row[h] !== undefined ? String(row[h]).substring(0, 30) : ''}</td>`).join('')}</tr>`
              ).join('')}</tbody>
            </table>
          `;
          document.getElementById('import-prod-preview').style.display = 'block';
          document.getElementById('btn-confirm-import-prod').style.display = '';
        }
      } catch (err) {
        this.showToast('Erro: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  },

  async confirmarImportProdutos() {
    await this.confirmarImportacao();
    this.closeAllModals();
  },

  // ===== CONFIGURACOES =====
  salvarConfigSupabase() {
    const url = document.getElementById('config-url').value.trim();
    const key = document.getElementById('config-key').value.trim();

    if (!url || !key) {
      this.showToast('URL e Key sao obrigatorios', 'error');
      return;
    }

    Formulas.saveLocal('supabase_config', { url, key });
    SupabaseAPI.init(url, key);
    this.atualizarStatusSupabase();
    this.showToast('Configuracao salva! Reconectando...', 'success');
  },

  salvarConfigAlertas() {
    const estMin = document.getElementById('config-estoque-min').value;
    const combMin = document.getElementById('config-comb-min').value;
    Formulas.saveLocal('alertas_config', { estoqueMin: estMin, combustivelMin: combMin });
    this.showToast('Alertas configurados!', 'success');
  },

  salvarConfigTema() {
    const tema = document.getElementById('config-tema').value;
    Formulas.saveLocal('tema', tema);
    this.showToast('Tema aplicado!', 'success');
  },

  limparTodosDados() {
    if (!confirm('ATENCAO! Isso apagara TODOS os dados locais. Continuar?')) return;
    if (!confirm('Tem absoluta certeza? Esta acao nao pode ser desfeita!')) return;

    const tabelas = ['produtos', 'categorias', 'vendas', 'caixa', 'movimentacoes', 'transferencias', 'bombas', 'perdas', 'roubos', 'fechamentos'];
    for (const t of tabelas) {
      Formulas.removeLocal(t);
      this.state.dados[t] = [];
    }

    this.showToast('Todos os dados foram limpos', 'info');
    this.renderDashboard();
  },

  // ===== MODAIS =====
  openModal(id) {
    document.getElementById('modal-overlay').classList.add('active');

    // Se for modal de produto, preencher selects
    if (id === 'modal-produto') {
      this.state.produtoEditando = null;
      document.getElementById('prod-modal-title').textContent = 'Novo Produto';
      this.preencherSelectCategorias();
      // Limpar form
      document.getElementById('prod-nome').value = '';
      document.getElementById('prod-codigo').value = '';
      document.getElementById('prod-preco-compra').value = '';
      document.getElementById('prod-preco-venda').value = '';
      document.getElementById('prod-margem').value = '';
      document.getElementById('prod-quantidade').value = '';
      document.getElementById('prod-descricao').value = '';
      document.getElementById('prod-barcode').value = '';
      document.getElementById('prod-preview').style.display = 'none';
    }

    if (id === 'modal-venda') {
      this.preencherSelectProdutos('venda-produto');
      document.getElementById('venda-quantidade').value = 1;
      document.getElementById('venda-desconto').value = 0;
      document.getElementById('venda-total').value = '';
      document.getElementById('venda-obs').value = '';
      document.getElementById('venda-preview').style.display = 'none';
    }

    if (id === 'modal-add-stock') {
      this.preencherSelectProdutos('stock-produto');
      document.getElementById('stock-quantidade').value = '';
      document.getElementById('stock-custo').value = '';
      document.getElementById('stock-obs').value = '';
      document.getElementById('stock-preview').style.display = 'none';
    }

    if (id === 'modal-perda') {
      this.preencherSelectProdutos('perda-produto');
      document.getElementById('perda-quantidade').value = '';
      document.getElementById('perda-motivo').value = '';
      document.getElementById('perda-preview').style.display = 'none';
    }

    if (id === 'modal-roubo') {
      this.preencherSelectProdutos('roubo-produto');
      document.getElementById('roubo-quantidade').value = '';
      document.getElementById('roubo-descricao').value = '';
      document.getElementById('roubo-preview').style.display = 'none';
    }

    if (id === 'modal-combustivel') {
      this.preencherSelectBombas();
    }

    if (id === 'modal-transferencia') {
      this.preencherSelectProdutos('trans-produto');
    }

    if (id === 'modal-inventario-fisico') {
      this.realizarInventarioFisico();
    }

    if (id === 'modal-categoria') {
      document.getElementById('cat-nome').value = '';
      document.getElementById('cat-descricao').value = '';
      document.getElementById('cat-cor').value = '#D4AF37';
    }

    if (id === 'modal-caixa') {
      document.getElementById('caixa-valor').value = '';
      document.getElementById('caixa-descricao').value = '';
      document.getElementById('caixa-obs').value = '';
    }

    if (id === 'modal-bomba') {
      document.getElementById('bomba-nome').value = '';
      document.getElementById('bomba-capacidade').value = '';
      document.getElementById('bomba-local').value = '';
    }

    if (id === 'modal-reconciliacao') {
      document.getElementById('reconciliacao-resumo').innerHTML = '<p class="text-center">Clique em "Analisar" para ver o resumo.</p>';
    }

    if (id === 'modal-fechar-dia') {
      document.getElementById('fechamento-resumo').innerHTML = '<p class="text-center">Clique em "Carregar Resumo" para ver os dados do dia.</p>';
    }

    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  },

  closeAllModals() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  },

  // ===== TOAST =====
  showToast(mensagem, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;

    const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-circle', info: 'info-circle' };
    toast.innerHTML = `<i class="fas fa-${icons[tipo] || 'info-circle'}"></i><span>${mensagem}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  toggleNotifications() {
    this.showToast('Sem novas notificacoes', 'info');
  },

  // ===== EXPORTAR DADOS =====
  exportarDados(tipo) {
    this.gerarRelatorio(tipo);
  }
};

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
