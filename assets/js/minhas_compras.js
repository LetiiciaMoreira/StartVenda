let produtos = [];
let compras = [];
let pedidosDoUsuario = [];
let lojas = [];
let countTotal = 0;

window.onload = async function () {
    const usuarioLogado = await getUsuarioAutenticadoSeguro();
    if (!usuarioLogado) {
        alert('Você precisa estar logado.');
        window.location.href = "../login/login.html";
        return;
    }

    fetch('http://localhost:3000/products')
        .then(response => response.json())
        .then(dataProdutos => {
            produtos = dataProdutos.map(p => ({
                id: p.id,
                nome: p.name,
                preco: p.price,
                img: p.images,
                idLoja: p.id_loja
            }));
            return fetch('http://localhost:3000/lojas');
        })
        .then(response => response.json())
        .then(dataLojas => {
            lojas = dataLojas;
            return fetch('http://localhost:3000/pedidos');
        })
        .then(response => response.json())
        .then(dataPedidos => {
            compras = dataPedidos.map(p => ({
                idProdutos: p.id,
                produtosID: p.produtosId,
                idCliente: p.usuarioId,
                data: p.data_venda,
                status_venda: p.status,
                valor: p.valor_total
            }));

            pedidosDoUsuario = compras.filter(p => p.idCliente == usuarioLogado);
            renderizarComprasEContar(pedidosDoUsuario, produtos);
            renderizarComprasEContar(pedidosDoUsuario, produtos);
            totalProdutos();

            document.getElementById('btnFiltrar').onclick = function () {
                filtrarPorData();
            }
            document.getElementById('btnLimparFiltro').onclick = function () {
                limparFiltroData();
            }

        })
        .catch(error => {
            console.error('Erro ao buscar dados:', error);
        });
};

function renderizarComprasEContar(compras, listaProdutos) {
    const cards = document.getElementById('listaCompras');
    if (!cards) return;

    cards.innerHTML = '';
    countTotal = 0;

    for (let i = 0; i < compras.length; i++) {
        let produtosHTML = '';
        let countProdutos = 0;

        const produtosIDs = Array.isArray(compras[i].produtosID) ? compras[i].produtosID : [compras[i].produtosID];

        for (let j = 0; j < produtosIDs.length; j++) {
            const id = produtosIDs[j];
            const produto = listaProdutos.find(p => p.id == id);

            if (produto) {
                countProdutos++;
                produtosHTML += `
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <img src="${produto.img}" alt="imagem" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #eee;">
                        <div>
                            <div style="font-weight: 500;">${produto.nome}</div>
                            <div style="font-size: 0.9em; color: #888;">${nomeLoja(produto.idLoja)}</div>
                            <div style="font-size: 0.95em; color: #222;">R$${produto.preco}</div>
                        </div>
                    </div>
                `;
            }
        }

        let checkoutBtn = '';
        if (compras[i].status_venda.toLowerCase() !== 'concluido') {
            checkoutBtn = `
                <a href="/modulos/chat/cliente/index.html?id=${compras[i].idProdutos}" 
                   class="btn btn-compra btn-checkout-chamativo" 
                   style="margin-left: 16px; display: flex; align-items: center; gap: 8px;">
                    <i class="bi bi-cart-check-fill" style="font-size: 1.3em;"></i>
                    Ir para Checkout
                </a>
            `;
        }

        cards.innerHTML += `
            <div style="background: #fff; border-radius: 12px; border: 1px solid #eee; margin-bottom: 24px; padding: 20px 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 1.05em; color: #444;">
                        <strong>Pedido #${compras[i].idProdutos}</strong> &bull; ${formatarDataBR(compras[i].data)}
                    </span>
                    <span style="font-size: 0.95em; color: #888; text-transform: uppercase; letter-spacing: 1px;">
                        ${compras[i].status_venda}
                    </span>
                </div>
                <div>
                    ${produtosHTML}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; font-size: 0.98em;">
                    <span style="color: #666;">${countProdutos} produto(s)</span>
                    <span style="font-weight: 500; color: #222;">Total: R$${compras[i].valor}</span>
                    ${checkoutBtn}
                </div>
            </div>
        `;
        countTotal += countProdutos;
    }
}

function totalProdutos() {
    let produtosTotal = document.getElementById('qtdProdutos');
    if (!produtosTotal) {
        return;
    }
    produtosTotal.innerHTML = `${countTotal} produtos`;
}

function filtrarPesquisa() {
    const input = document.getElementById('searchInput');
    const termo = input.value.trim().toLowerCase();

    if (termo === '') {
        renderizarComprasEContar(pedidosDoUsuario, produtos);
    } else {
        const produtosFiltrados = produtos.filter(p =>
            p.nome.toLowerCase().includes(termo)
        );
        renderizarComprasEContar(pedidosDoUsuario, produtosFiltrados);
    }
    totalProdutos();
}

function nomeLoja(idLoja) {
    const loja = lojas.find(l => l.id === idLoja);
    if (loja) {
        return loja.nome;
    } else {
        return 'Loja Desconhecida';
    }
}

function filtrarPorData() {
    let dataInicio = document.getElementById('dataInicio').value;
    let dataFim = document.getElementById('dataFim').value;

    if (!dataInicio && !dataFim) {
        renderizarComprasEContar(pedidosDoUsuario, produtos);
        totalProdutos();
        return;
    }

    let inicio = null, fim = null;

    if (dataInicio) {
        inicio = new Date(dataInicio);
    }

    if (dataFim) {
        fim = new Date(dataFim + 'T23:59:59');
    }

    let pedidosFiltrados = pedidosDoUsuario.filter(pedido => {
        let dataPedido = new Date(pedido.data);

        let depoisDoInicio = true;
        if (inicio) {
            depoisDoInicio = dataPedido >= inicio;
        }

        let antesDoFim = true;
        if (fim) {
            antesDoFim = dataPedido <= fim;
        }

        return depoisDoInicio && antesDoFim;
    });

    renderizarComprasEContar(pedidosFiltrados, produtos);
    totalProdutos();
}

function limparFiltroData() {
    document.getElementById('dataInicio').value = '';
    document.getElementById('dataFim').value = '';

    renderizarComprasEContar(pedidosDoUsuario, produtos);
    totalProdutos();
}

function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
}