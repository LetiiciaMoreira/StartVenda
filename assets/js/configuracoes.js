function getIdLojaFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function carregarBannerLoja() {
    const id = getIdLojaFromUrl();
    if (!id) return;
    try {
        const resp = await fetch('http://localhost:3000/lojas/' + id);
        if (!resp.ok) return;
        const loja = await resp.json();
        if (loja.url_banner) {
            document.getElementById('bannerLoja').src = loja.url_banner;
        }
        if (loja.nome) {
            document.getElementById('nomeLoja').textContent = loja.nome;
        }
    } catch (e) {
    }
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
const lojaId = getQueryParam("id");
if (lojaId) {
    const btnProdutos = document.getElementById('btnGerenciarProdutos');
    if (btnProdutos) {
        btnProdutos.href = `../../products/index.html?id_loja=${lojaId}`;
    }
    const btnGanhos = document.getElementById('btnAcompanharGanhos');
    if (btnGanhos) {
        btnGanhos.href = `../../ganhos/ganhos.html?id=${lojaId}`;
    }
    const btnResponderDuvidas = document.getElementById('btnResponderDuvidas');
    if (btnResponderDuvidas) {
        btnResponderDuvidas.href = `../../responderPerguntas/index.html?id=${lojaId}`;
    }
    const btnVerPedidos = document.getElementById('btnVerPedidos');
    if (btnVerPedidos) {
        btnVerPedidos.href = `../../pedidos/index.html?id=${lojaId}`;
    }
}
document.addEventListener('DOMContentLoaded', carregarBannerLoja);

async function carregarGraficoEstoque() {
    const lojaId = (() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    })();
    if (!lojaId) return;

    const resp = await fetch('http://localhost:3000/products');
    if (!resp.ok) return;
    let products = await resp.json();
    products = products.filter(p => p.deleted_at == null && String(p.id_loja) === String(lojaId));

    const ctx = document.getElementById('estoqueChart');
    if (!ctx) return;

    const allProducts = [...products].sort((a, b) => b.stock - a.stock);

    const labels = allProducts.map(p => p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name);
    const data = allProducts.map(p => p.stock);

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 600, 0);
    gradient.addColorStop(0, '#7F4E9D');
    gradient.addColorStop(1, '#FF6B6B');

    if (window.estoqueChartInstance) {
        window.estoqueChartInstance.destroy();
    }

    window.estoqueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Quantidade em Estoque',
                data,
                backgroundColor: gradient,
                borderRadius: 12,
                maxBarThickness: 38,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: {
                    backgroundColor: '#7F4E9D',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#FF6B6B',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#7F4E9D',
                        font: { weight: 'bold' }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(127,78,157,0.08)' },
                    ticks: {
                        color: '#FF6B6B',
                        font: { weight: 'bold' }
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', carregarGraficoEstoque);

document.addEventListener('DOMContentLoaded', () => {
    const lojaId = new URLSearchParams(window.location.search).get('id');
    const btnEditar = document.getElementById('btnEditarLoja');
    if (btnEditar && lojaId) {
        btnEditar.href = `../../cadastro_loja/index.html?id=${lojaId}`;
    }
});