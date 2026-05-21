const urlParams = new URLSearchParams(window.location.search);
const lojaId = urlParams.get('id');
let id_usuario = null;

const api = 'http://localhost:3000';
let pedidos = [];
let produtos = [];
let loja = null;

async function verificarLoja() {
    const res = await fetch(`${api}/lojas/${lojaId}`);
    if (!res.ok) {
        alert('Loja não encontrada!');
        window.location.href = '/';
        return;
    }
    loja = await res.json();
    if (loja.id_usuario != id_usuario) {
        alert('Você não tem permissão para acessar esta loja.');
        window.location.href = '/';
    }
}

async function carregarDados() {
    const resPedidos = await fetch(`${api}/pedidos`);
    pedidos = await resPedidos.json();
    const resProdutos = await fetch(`${api}/products`);
    produtos = await resProdutos.json();
}

function filtrarPedidos(dataInicio, dataFim) {
    const idsProdutosLoja = produtos
        .filter(p => p.id_loja == lojaId)
        .map(p => p.id);
    return pedidos.filter(pedido => {
        let contemProdutoLoja = false;
        pedido.produtosId.forEach(pid => {
            if (idsProdutosLoja.map(String).includes(String(pid))) {
                contemProdutoLoja = true;
            }
        });
        pedido.produtosId.forEach(pid => {
            if (idsProdutosLoja.includes(pid)) {
            contemProdutoLoja = true;
            }
        });
        if (!contemProdutoLoja) return false;

        const dataVenda = new Date(pedido.data_venda);
        if (dataInicio && dataVenda < dataInicio) return false;
        if (dataFim && dataVenda > dataFim) return false;
        return true;
    });
}

function calcularTotais(pedidosFiltrados) {
    const porStatus = { concluido: 0, pendente: 0, em_andamento: 0 };
    const porPagamento = { PIX: 0, Dinheiro: 0, 'Cartão de Crédito': 0 };
    let total = 0;

    pedidosFiltrados.forEach(p => {
        if (porStatus[p.status] !== undefined) porStatus[p.status] += p.valor_total;
        if (porPagamento[p.metodo_pagamento] !== undefined) porPagamento[p.metodo_pagamento] += p.valor_total;
        total += p.valor_total;
    });

    return { porStatus, porPagamento, total };
}

let chartStatus, chartPagamento, chartEvolucao;
function renderizarGraficos(totais) {
    const ctxStatus = document.getElementById('graficoStatus').getContext('2d');
    if (chartStatus) chartStatus.destroy();
    chartStatus = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Concluído', 'Pendente', 'Em Andamento'],
            datasets: [{
                data: [
                    totais.porStatus.concluido,
                    totais.porStatus.pendente,
                    totais.porStatus.em_andamento
                ],
                backgroundColor: ['#7F4E9D', '#FF6B6B', '#ffb300'],
            }]
        },
        options: {
            plugins: { legend: { position: 'bottom' } }
        }
    });

    const ctxPagamento = document.getElementById('graficoPagamento').getContext('2d');
    if (chartPagamento) chartPagamento.destroy();
    chartPagamento = new Chart(ctxPagamento, {
        type: 'pie',
        data: {
            labels: ['PIX', 'Dinheiro', 'Cartão de Crédito'],
            datasets: [{
                data: [
                    totais.porPagamento.PIX,
                    totais.porPagamento.Dinheiro,
                    totais.porPagamento['Cartão de Crédito']
                ],
                backgroundColor: ['#7F4E9D', '#FF6B6B', '#ffb300'],
            }]
        },
        options: {
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function calcularEstatisticas(pedidosFiltrados) {
    const totalPedidos = pedidosFiltrados.length;
    const totalValor = pedidosFiltrados.reduce((acc, p) => acc + p.valor_total, 0);
    const ticketMedio = totalPedidos ? totalValor / totalPedidos : 0;

    const dias = {};
    pedidosFiltrados.forEach(p => {
        const dataVenda = new Date(p.data_venda + 'T00:00:00');
        const dia = dataVenda.toLocaleDateString('pt-BR');
        dias[dia] = (dias[dia] || 0) + 1;
    });
    const pedidosDia = Object.values(dias);
    const mediaPedidosDia = pedidosDia.length ? (pedidosDia.reduce((a, b) => a + b, 0) / pedidosDia.length) : 0;

    return {
        totalPedidos,
        ticketMedio,
        mediaPedidosDia: mediaPedidosDia.toFixed(2)
    };
}

function renderizarEvolucao(pedidosFiltrados) {
    const porDia = {};
    pedidosFiltrados.forEach(p => {
        const dataVenda = new Date(p.data_venda + 'T00:00:00');
        const dia = dataVenda.toLocaleDateString('pt-BR');
        porDia[dia] = (porDia[dia] || 0) + p.valor_total;
    });
    const labels = Object.keys(porDia).sort((a, b) => {
        const [da, ma, ya] = a.split('/').map(Number);
        const [db, mb, yb] = b.split('/').map(Number);
        return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    });
    const data = labels.map(l => porDia[l]);

    const ctx = document.getElementById('graficoEvolucao').getContext('2d');
    if (chartEvolucao) chartEvolucao.destroy();
    chartEvolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Ganhos por dia',
                data,
                borderColor: '#7F4E9D',
                backgroundColor: 'rgba(127,78,157,0.08)',
                tension: 0.3,
                fill: true,
                pointRadius: 3,
                pointBackgroundColor: '#7F4E9D'
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                x: { display: true, title: { display: false } },
                y: { display: true, title: { display: false } }
            }
        }
    });
}

function renderizarResumo(totais) {
    document.getElementById('resumoGanhos').innerHTML = `
        <div class="card shadow-sm mx-auto" style="max-width:400px;">
            <div class="card-body">
                <h5 class="card-title mb-2">Total de Ganhos</h5>
                <p class="fw-bold text-primary" style="font-size:2rem;">R$ ${totais.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
        </div>
    `;
}

async function atualizarDashboard() {
    const dataInicio = document.getElementById('dataInicio').value ? new Date(document.getElementById('dataInicio').value) : null;
    const dataFim = document.getElementById('dataFim').value ? new Date(document.getElementById('dataFim').value) : null;
    const pedidosFiltrados = filtrarPedidos(dataInicio, dataFim);
    const totais = calcularTotais(pedidosFiltrados);
    renderizarGraficos(totais);

    const stats = calcularEstatisticas(pedidosFiltrados);
    document.getElementById('statPedidos').textContent = stats.totalPedidos;
    document.getElementById('statTicketMedio').textContent = `R$ ${stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('statPedidosDia').textContent = stats.mediaPedidosDia;

    renderizarEvolucao(pedidosFiltrados);

    document.getElementById('saldoTotal').textContent = `R$ ${totais.porStatus.concluido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    document.getElementById('saldoPendente').textContent = `R$ ${totais.porStatus.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('saldoAndamento').textContent = `R$ ${totais.porStatus.em_andamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    if (loja && loja.nome) {
        document.getElementById('nomeLoja').textContent = loja.nome;
    }
    if (loja && loja.url_logo) {
        document.getElementById('logoLoja').src = loja.url_logo;
    }
}

document.getElementById('btnFiltrar').onclick = atualizarDashboard;
document.getElementById('btnLimparFiltro').onclick = function () {
    document.getElementById('dataInicio').value = '';
    document.getElementById('dataFim').value = '';
    atualizarDashboard();
};

(async function () {
    id_usuario = await getUsuarioAutenticadoSeguro();
    if (!id_usuario) {
        alert('Você precisa estar logado para editar uma loja.');
        window.location.href = "../login/login.html";
        return;
    }
    await verificarLoja();
    await carregarDados();
    atualizarDashboard();
})();