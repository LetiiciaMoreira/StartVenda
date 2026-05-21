const ProdutoService = {
  produtosCache: [],

  getProdutos: async function () {
    try {
      if (this.produtosCache.length > 0) return this.produtosCache;
      const res = await fetch('http://localhost:3000/products');
      if (!res.ok) throw new Error('Erro ao buscar produtos');
      this.produtosCache = await res.json();
      return this.produtosCache;
    } catch (error) {
      console.error('Erro ao obter produtos:', error);
      return [];
    }
  },

  getProduto: async function (id) {
    const produtos = await this.getProdutos();
    const produto = produtos.find(p => p.id == id);
    if (!produto) throw new Error('Produto não encontrado');
    return produto;
  }
};

let cacheCarrinho = [];

const CarrinhoService = {
  getCarrinho: async function () {
    try {
      const id_usuario = await getUsuarioAutenticadoSeguro();
      if (!id_usuario) {
        return [];
      }
      const res = await fetch(`http://localhost:3000/carrinho?usuarioId=${id_usuario}`);
      if (!res.ok) throw new Error('Erro ao buscar carrinho');
      const dados = await res.json();
      cacheCarrinho = dados;
      return dados;
    } catch (error) {
      console.error('Erro ao obter carrinho:', error);
      return [];
    }
  },

  sincronizarCarrinho: async function () {
    console.log(cacheCarrinho)
    try {
      const res = await fetch('http://localhost:3000/carrinho', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cacheCarrinho)
      });
      if (!res.ok) throw new Error('Erro ao sincronizar carrinho');
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  },

  adicionarItem: async function (produto) {
    const item = cacheCarrinho.find(i => i.id === produto.id);
    if (item) {
      item.quantidade += 1;
    } else {
      cacheCarrinho.push({ ...produto, quantidade: 1 });
    }
    await this.sincronizarCarrinho();
    return cacheCarrinho;
  },

  removerItem: async function (id) {
    try {
      await fetch(`http://localhost:3000/carrinho/${id}`, { method: 'DELETE' });
      cacheCarrinho = cacheCarrinho.filter(item => item.id != id);
      await this.getCarrinho();
      return cacheCarrinho;
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      return cacheCarrinho;
    }
  },

  limparCarrinho: async function () {
    const id_usuario = await getUsuarioAutenticadoSeguro();
    if (!id_usuario) {
      alert('Você precisa estar logado para limpar o carrinho.');
      return [];
    }
    const itens = await this.getCarrinho();
    for (const item of itens) {
      await fetch(`http://localhost:3000/carrinho/${item.id}`, { method: 'DELETE' });
    }
    cacheCarrinho = [];
    return [];
  },

  calcularTotal: async function () {
    const itens = await this.getCarrinho();
    let total = 0;
    for (const item of itens) {
      try {
        const produto = await ProdutoService.getProduto(item.produtoId);
        total += Number(produto.price) * item.quantidade;
      } catch (e) {
      }
    }
    return total;
  }
};

function renderEstruturaCarrinhoHTML() {
  const container = document.getElementById('carrinho-container');
  container.innerHTML = `
    <div id="carrinho">
      <div class="carrinho-header">
        <h2><i class="bi bi-cart"></i> Seu Carrinho</h2>
        <button id="fechar-carrinho" title="Fechar">Fechar</button>
      </div>
      <div id="carrinho-itens"></div>
      <div class="carrinho-footer">
        <div class="resumo">
          <div class="resumo-item total">
            <span>Total:</span>
            <span id="carrinho-total">R$ 0,00</span>
          </div>
        </div>
        <div class="carrinho-acoes">
          <button id="btn-limpar" class="btn-secundario">
            <i class="bi bi-trash"></i> Limpar
          </button>
          <button id="btn-finalizar" class="btn-primario">
            <i class="bi bi-check-lg"></i> Finalizar
          </button>
        </div>
      </div>
    </div>
  `;
}

const CarrinhoOnlyController = {
  renderCarrinho: async function () {
    const carrinhoItens = document.getElementById('carrinho-itens');
    const carrinhoTotal = document.getElementById('carrinho-total');
    const contador = document.getElementById('contador-carrinho');

    const itens = await CarrinhoService.getCarrinho();
    let total = 0;

    if (contador) {
      const totalQtd = itens.reduce((sum, item) => sum + item.quantidade, 0);
      contador.textContent = totalQtd;
      contador.style.display = totalQtd > 0 ? 'flex' : 'none';
    }

    if (carrinhoItens) {
      carrinhoItens.innerHTML = '';

      if (itens.length === 0) {
        carrinhoItens.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio</p>';
      } else {
        for (const item of itens) {
          let produto;
          try {
            produto = await ProdutoService.getProduto(item.produtoId);
          } catch (e) {
            console.error('Produto não encontrado:', item.produtoId);
            continue;
          }
          total += Number(produto.price) * item.quantidade;
          const itemDiv = document.createElement('div');
          itemDiv.classList.add('item-carrinho');
          itemDiv.innerHTML = `
            <div class="item-info">
              <img src="${produto.images || '../../assets/images/no-image.png'}" alt="${produto.name}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;margin-right:10px;">
              <div>
                <h4>${this.escapeHtml(produto.name || '')}</h4>
                <div class="item-detalhes">
                  <span class="preco">R$ ${Number(produto.price).toFixed(2)}</span>
                  <div class="quantidade">
                    <button class="btn-diminuir" data-id="${item.id}" title="Diminuir quantidade">-</button>
                    <span>Qtd: ${item.quantidade}</span>
                    <button class="btn-aumentar" data-id="${item.id}" title="Aumentar quantidade">+</button>
                  </div>
                </div>
              </div>
            </div>
            <button class="btn-remover" data-id="${item.id}" title="Remover item">
              <i class="bi bi-trash"></i>
            </button>
          `;

          carrinhoItens.appendChild(itemDiv);
        }
      }
    }

    if (carrinhoTotal) {
      carrinhoTotal.textContent = `R$ ${total.toFixed(2)}`;
    }

    document.getElementById('btn-limpar')?.addEventListener('click', async () => {
      await CarrinhoService.limparCarrinho();
      await this.renderCarrinho();
    });
  },

  setupEventListeners: function () {
    document.addEventListener('click', async (e) => {
      const id = e.target.dataset.id || e.target.closest('[data-id]')?.dataset.id;
      if (!id) return;

      if (e.target.classList.contains('btn-remover') || e.target.closest('.btn-remover')) {
        await CarrinhoService.removerItem(id);
        await this.renderCarrinho();
      }

      if (e.target.classList.contains('btn-diminuir')) {
        const item = cacheCarrinho.find(i => i.id == id);
        if (item && item.quantidade > 1) {
          const novaQuantidade = item.quantidade - 1;
          await fetch(`http://localhost:3000/carrinho/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantidade: novaQuantidade })
          });
          item.quantidade = novaQuantidade;
          await CarrinhoService.getCarrinho();
          await this.renderCarrinho();
        } else {
          await CarrinhoService.removerItem(id);
          await this.renderCarrinho();
        }
      }

      if (e.target.classList.contains('btn-aumentar')) {
        const item = cacheCarrinho.find(i => i.id == id);
        if (item) {
          const novaQuantidade = item.quantidade + 1;
          await fetch(`http://localhost:3000/carrinho/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantidade: novaQuantidade })
          });
          item.quantidade = novaQuantidade;
          await CarrinhoService.getCarrinho();
          await this.renderCarrinho();
        }
      }
    });

    document.getElementById('fechar-carrinho')?.addEventListener('click', () => {
      document.getElementById('carrinho-container').classList.remove('aberto');
    });

    document.getElementById('btn-carrinho')?.addEventListener('click', async (e) => {
      e.preventDefault();
      document.getElementById('carrinho-container')?.classList.add('aberto');
      await CarrinhoOnlyController.renderCarrinho();
    });

    document.getElementById('btn-limpar')?.addEventListener('click', async () => {
      await CarrinhoService.limparCarrinho();
      await this.renderCarrinho();
    });

    document.getElementById('btn-finalizar')?.addEventListener('click', async () => {
      const itens = await CarrinhoService.getCarrinho();
      if (itens.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
      }
      let pathPrefix = '';
      const path = window.location.pathname.replace(/\\/g, '/').replace(/\/$/, '');
      const depth = path.split('/').length - 2;
      for (let i = 0; i < depth; i++) pathPrefix += '../';
      window.location.href = pathPrefix + "modulos/checkout/index.html";
    });
  },

  escapeHtml: function (unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe.replace(/[&<>"']/g, function (m) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[m];
    });
  },

  initCarrinho: async function () {
    renderEstruturaCarrinhoHTML();
    await this.renderCarrinho();
    this.setupEventListeners();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CarrinhoOnlyController.initCarrinho();
});