const urlParams = new URLSearchParams(window.location.search);
const pedidoId = urlParams.get('id');
const API = 'http://localhost:3000';

const chatMensagens = document.getElementById('chat-mensagens');
const formMensagem = document.getElementById('form-mensagem');
const inputMensagem = document.getElementById('mensagem-input');
const chatStatus = document.getElementById('chat-status');
const btnConcluir = document.getElementById('btn-concluir');
const btnConfirmarConcluir = document.getElementById('confirmar-concluir');
const vendaConcluida = document.getElementById('venda-concluida');

let mensagens = [];
let chatObj = null;

async function verificarPermissaoVendedor() {
    const usuarioId = await getUsuarioAutenticadoSeguro();
    if (!usuarioId) {
        alert('Você precisa estar logado para acessar essa página.');
        window.location.href = "../../login/login.html";
        return false;
    }
    const resPedido = await fetch(`${API}/pedidos/${pedidoId}`);
    if (!resPedido.ok) {
        alert('Pedido não encontrado.');
        window.location.href = "/";
        return false;
    }
    const pedido = await resPedido.json();
    console.log(pedido);
    if (!pedido.produtosId || !pedido.produtosId.length) {
        alert('Pedido sem itens.');
        window.location.href = "/";
        return false;
    }

    const idProduto = pedido.produtosId[0];
    if (!idProduto) {
        alert('Produto do pedido não encontrado.');
        window.location.href = "/";
        return false;
    }

    const resProduto = await fetch(`${API}/products/${idProduto}`);
    if (!resProduto.ok) {
        alert('Produto não encontrado.');
        window.location.href = "/";
        return false;
    }
    const produto = await resProduto.json();
    const idLoja = produto.id_loja;
    if (!idLoja) {
        alert('Loja do produto não encontrada.');
        window.location.href = "/";
        return false;
    }

    const resLoja = await fetch(`${API}/lojas/${idLoja}`);
    if (!resLoja.ok) {
        alert('Loja não encontrada.');
        window.location.href = "/";
        return false;
    }
    const loja = await resLoja.json();
    if (loja.id_usuario != usuarioId) {
        alert('Você não tem permissão para acessar este chat.');
        window.location.href = "/";
        return false;
    }
    return true;
}

async function verificarStatusPedido() {
    const res = await fetch(`${API}/pedidos/${pedidoId}`);
    if (!res.ok) return false;
    const pedido = await res.json();
    if (!pedido.status || !['pendente', 'em_andamento'].includes(pedido.status)) {
        chatStatus.textContent = 'Chat indisponível para este pedido.';
        chatStatus.classList.remove('d-none');
        formMensagem.classList.add('d-none');
        return false;
    }
    return true;
}

async function carregarMensagens() {
    const res = await fetch(`${API}/chats?pedidoId=${pedidoId}`);
    const data = await res.json();
    chatObj = data[0];
    mensagens = chatObj ? chatObj.mensagens : [];
    renderizarMensagens();
}

function renderizarMensagens() {
    chatMensagens.innerHTML = '';
    if (!mensagens || mensagens.length === 0) {
        chatMensagens.innerHTML = '<div class="text-center text-muted mt-3">Nenhuma mensagem ainda.</div>';
        return;
    }
    mensagens.forEach(msg => {
        const div = document.createElement('div');
        div.className = `mensagem ${msg.remetente}`;
        div.innerHTML = `<small>${msg.remetente === 'vendedor' ? 'Você' : 'Cliente'}</small><br>${msg.texto}`;
        chatMensagens.appendChild(div);
    });
    chatMensagens.scrollTo({ top: chatMensagens.scrollHeight, behavior: 'smooth' });
}

formMensagem.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = inputMensagem.value.trim();
    if (!texto) return;
    const novaMsg = {
        id: Date.now(),
        remetente: 'vendedor',
        texto,
        data: new Date().toISOString()
    };

    try {
        const pedidoRes = await fetch(`${API}/pedidos/${pedidoId}`);
        if (pedidoRes.ok) {
            const pedido = await pedidoRes.json();
            if (pedido.status === "pendente") {
                await fetch(`${API}/pedidos/${pedidoId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: "em_andamento" })
                });
            }
        }
    } catch (err) {}

    if (!chatObj) {
        const novoChat = {
            pedidoId: pedidoId,
            mensagens: [novaMsg]
        };
        await fetch(`${API}/chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoChat)
        });
        await carregarMensagens();
    } else {
        chatObj.mensagens.push(novaMsg);
        await fetch(`${API}/chats/${chatObj.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensagens: chatObj.mensagens })
        });
        await carregarMensagens();
    }
    inputMensagem.value = '';
});

async function atualizarBotaoConcluir() {
    const res = await fetch(`${API}/pedidos/${pedidoId}`);
    if (!res.ok) return;
    const pedido = await res.json();
    if (pedido.status === "concluido" || pedido.status === "cancelado") {
        btnConcluir.style.display = "none";
    } else {
        btnConcluir.style.display = "";
    }
}

btnConfirmarConcluir?.addEventListener('click', async () => {
    const pedidoRes = await fetch(`${API}/pedidos/${pedidoId}`);
    if (!pedidoRes.ok) {
        return alert('Erro ao buscar pedido.');
    }
    const pedido = await pedidoRes.json();

    const contagemProdutos = {};
    if (pedido.produtosId && pedido.produtosId.length) {
        pedido.produtosId.forEach(id => {
            contagemProdutos[id] = (contagemProdutos[id] || 0) + 1;
        });

        for (const produtoId in contagemProdutos) {
            const quantidadeComprada = contagemProdutos[produtoId];

            const produtoRes = await fetch(`${API}/products/${produtoId}`);
            if (!produtoRes.ok) {
                continue;
            }
            const produto = await produtoRes.json();

            const novoEstoque = (produto.stock || 0) - quantidadeComprada;
            await fetch(`${API}/products/${produtoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: novoEstoque < 0 ? 0 : novoEstoque })
            });
        }
    }

    await fetch(`${API}/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "concluido" })
    });
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalConcluir'));
    modal.hide();
    await atualizarBotaoConcluir();
    chatStatus.textContent = 'Venda concluída!';
    chatStatus.classList.remove('d-none');
    formMensagem.classList.add('d-none');
});

btnConcluir?.addEventListener('click', async () => {
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalConcluir'));
    modal.show();
});

function showConfettiVendedor() {
    const confetti = document.querySelector('#venda-concluida .confetti');
    if (!confetti) return;
    confetti.innerHTML = '';
    const colors = ['#7F4E9D', '#FF6B6B', '#FFD166', '#43BCCD', '#f5e9ff', '#ffe3e3'];
    for (let i = 0; i < 24; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.left = `${Math.random() * 95}%`;
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.animationDelay = `${Math.random() * 0.7}s`;
        el.style.width = el.style.height = `${10 + Math.random() * 8}px`;
        confetti.appendChild(el);
    }
}

async function checarStatusPedidoVendedor() {
    const res = await fetch(`${API}/pedidos/${pedidoId}`);
    if (!res.ok) return;
    const pedido = await res.json();
    if (pedido.status === "concluido") {
        vendaConcluida.classList.remove('d-none');
        document.querySelector('.chat-card').classList.add('d-none');
        chatStatus.classList.add('d-none');
        showConfettiVendedor();
    } else {
        vendaConcluida.classList.add('d-none');
        document.querySelector('.chat-card').classList.remove('d-none');
    }
}

(async function init() {
    if (!pedidoId) {
        chatStatus.textContent = 'Pedido não informado na URL.';
        chatStatus.classList.remove('d-none');
        formMensagem.classList.add('d-none');
        return;
    }
    const permitido = await verificarPermissaoVendedor();
    if (!permitido) return;
    const pode = await verificarStatusPedido();
    if (pode) {
        await carregarMensagens();
        setInterval(carregarMensagens, 3000);
    }
    await atualizarBotaoConcluir();
    setInterval(checarStatusPedidoVendedor, 2000);
    await checarStatusPedidoVendedor();
})();