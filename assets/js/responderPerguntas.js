async function getUsuario() {
    const id_usuario = await getUsuarioAutenticadoSeguro();
    if (!id_usuario) {
        alert('Você precisa estar logado para editar uma loja.');
        window.location.href = "../login/login.html";
        return null;
    } else {
        return id_usuario;
    }
}

function getIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function getNomeUsuario(id_usuario) {
    const resp = await fetch(`http://localhost:3000/usuarios/${id_usuario}`);
    if (!resp.ok) return 'Usuário';
    const usuario = await resp.json();
    return usuario.nome || 'Usuário';
}

async function getProdutoInfo(id_produto) {
    const resp = await fetch(`http://localhost:3000/products/${id_produto}`);
    if (!resp.ok) return null;
    return await resp.json();
}

async function main() {
    const id_usuario = await getUsuarioAutenticadoSeguro();
    if (!id_usuario) {
        alert('Você precisa estar logado para editar uma loja.');
        window.location.href = "../login/login.html";
        return;
    }

    const id_loja = getIdFromUrl();
    if (!id_loja) {
        alert('Loja não encontrada.');
        return;
    }

    const lojaResp = await fetch(`http://localhost:3000/lojas/${id_loja}`);
    if (!lojaResp.ok) {
        alert('Loja não encontrada.');
        return;
    }
    const loja = await lojaResp.json();
    if (loja.id_usuario != id_usuario) {
        alert('Você não tem permissão para responder perguntas desta loja.');
        window.location.href = "../../index.html";
        return;
    }

    const produtosResp = await fetch(`http://localhost:3000/products?id_loja=${id_loja}`);
    const produtos = await produtosResp.json();
    const produtosIds = produtos.map(p => p.id);

    const perguntasResp = await fetch(`http://localhost:3000/perguntas`);
    const perguntas = await perguntasResp.json();

    const perguntasSemResposta = perguntas.filter(p => 
        p.resposta === "" && produtosIds.includes(String(p.id_produto))
    );

    const container = document.getElementById('perguntasContainer');
    container.innerHTML = '';

    if (perguntasSemResposta.length === 0) {
        container.innerHTML = '<li>Nenhuma pergunta pendente para resposta.</li>';
        return;
    }

    for (const pergunta of perguntasSemResposta) {
        const nomeUsuario = await getNomeUsuario(pergunta.id_usuario);
        const dataHora = pergunta.data ? new Date(pergunta.data).toLocaleString('pt-BR') : '';
        const produto = await getProdutoInfo(pergunta.id_produto);
        const produtoNome = produto.name;
        const produtoImg = produto.images;

        const li = document.createElement('li');
        li.style.marginBottom = '32px';
        li.innerHTML = `
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:10px;">
                <img src="${produtoImg}" alt="${produtoNome}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;background:#f8f8f8;">
                <span style="font-weight:600;color:var(--main-color-dark);font-size:1.1rem;">${produtoNome}</span>
            </div>
            <p><strong>${nomeUsuario}</strong> em ${dataHora}</p>
            <p>${pergunta.texto}</p>
            <form data-id="${pergunta.id}" class="respostaForm">
                <label for="resposta_${pergunta.id}">Resposta:</label>
                <textarea id="resposta_${pergunta.id}" required style="width:100%;min-height:60px;"></textarea>
                <button type="submit">Responder</button>
                <span class="msg" style="margin-left:12px;color:#7F4E9D;font-weight:500;"></span>
            </form>
        `;
        container.appendChild(li);
    }

    document.querySelectorAll('.respostaForm').forEach(form => {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const idPergunta = this.getAttribute('data-id');
            const resposta = this.querySelector('textarea').value.trim();
            const msgSpan = this.querySelector('.msg');
            if (!resposta) {
                msgSpan.textContent = 'Digite a resposta.';
                return;
            }
            const resp = await fetch(`http://localhost:3000/perguntas/${idPergunta}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resposta })
            });
            if (resp.ok) {
                msgSpan.textContent = 'Respondido!';
                this.querySelector('textarea').disabled = true;
                this.querySelector('button').disabled = true;
            } else {
                msgSpan.textContent = 'Erro ao responder.';
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', main);