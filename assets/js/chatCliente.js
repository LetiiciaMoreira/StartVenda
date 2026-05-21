const urlParams = new URLSearchParams(window.location.search);
const pedidoId = urlParams.get('id');
const API = 'http://localhost:3000';

const chatMensagens = document.getElementById('chat-mensagens');
const formMensagem = document.getElementById('form-mensagem');
const inputMensagem = document.getElementById('mensagem-input');
const chatStatus = document.getElementById('chat-status');
const compraConcluida = document.getElementById('compra-concluida');

let mensagens = [];
let chatObj = null;
let statusPedidoAtual = null;

async function verificarPermissaoPedido() {
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
    if (pedido.usuarioId != usuarioId) {
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
    statusPedidoAtual = pedido.status;
    if (!pedido.status || !['pendente', 'em_andamento'].includes(pedido.status)) {
        chatStatus.textContent = 'Chat indisponível para este pedido.';
        chatStatus.classList.remove('d-none');
        formMensagem.classList.add('d-none');
        return false;
    }
    return true;
}

function showConfetti() {
    const confetti = document.querySelector('.confetti');
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

async function checarStatusPedido() {
    const res = await fetch(`${API}/pedidos/${pedidoId}`);
    if (!res.ok) return;
    const pedido = await res.json();
    statusPedidoAtual = pedido.status;
    if (pedido.status === "concluido") {
        compraConcluida.classList.remove('d-none');
        document.querySelector('.chat-card').classList.add('d-none');
        chatStatus.classList.add('d-none');
        showConfetti();
    } else {
        compraConcluida.classList.add('d-none');
        document.querySelector('.chat-card').classList.remove('d-none');
    }
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
        div.innerHTML = `<small>${msg.remetente === 'comprador' ? 'Você' : 'Vendedor'}</small><br>${msg.texto}`;
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
        remetente: 'comprador',
        texto,
        data: new Date().toISOString()
    };

    if (!chatObj) {
        const novoChat = {
            pedidoId: Number(pedidoId),
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

(async function init() {
    if (!pedidoId) {
        chatStatus.textContent = 'Pedido não informado na URL.';
        chatStatus.classList.remove('d-none');
        formMensagem.classList.add('d-none');
        return;
    }
    const permitido = await verificarPermissaoPedido();
    if (!permitido) return;
    const pode = await verificarStatusPedido();
    if (pode) {
        await carregarMensagens();
        setInterval(carregarMensagens, 3000);
        setInterval(checarStatusPedido, 2000);
        await checarStatusPedido();
    }
})();