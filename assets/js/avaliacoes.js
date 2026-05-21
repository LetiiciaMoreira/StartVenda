const apiUrl = 'http://localhost:3000/avaliacoes';
const produtosUrl = 'http://localhost:3000/products';
const lojasUrl = 'http://localhost:3000/lojas';
const perguntasUrl = 'http://localhost:3000/perguntas';
let editingId = null;

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

const id_produto = getProductIdFromUrl();

function loadProduct() {
    if (!id_produto) return;
    fetch(`${produtosUrl}/${id_produto}`)
        .then(res => res.json())
        .then(produto => {
            document.getElementById('productImage').src = produto.images;
            document.getElementById('productName').textContent = produto.name || 'Produto';
            document.getElementById('productTitle').textContent = produto.name || 'Produto';
            document.getElementById('productDesc').textContent = produto.description || '';
            document.getElementById('productShortDesc').textContent = produto.description ? produto.description.substring(0, 80) + '...' : '';
            document.getElementById('productPrice').textContent = produto.price ? `R$ ${Number(produto.price).toLocaleString('pt-BR', {minimumFractionDigits:2})}` : '';
            if (produto.id_loja) {
                loadStore(produto.id_loja);
            }
        })
        .catch(() => {
            document.getElementById('productName').textContent = 'Produto não encontrado';
        });
}

function loadStore(id_loja) {
    fetch(`${lojasUrl}/${id_loja}`)
        .then(res => res.json())
        .then(loja => {
            document.getElementById('storeLogo').src = loja.url_logo;
            document.getElementById('storeName').textContent = loja.nome || 'Loja';
            document.getElementById('storeDesc').textContent = loja.descricao || '';
        })
        .catch(() => {
            document.getElementById('storeName').textContent = 'Loja não encontrada';
        });
}

async function getNomeUsuario(id_usuario) {
    const resp = await fetch(`http://localhost:3000/usuarios/${id_usuario}`);
    if (!resp.ok) return 'Usuário';
    const usuario = await resp.json();
    return usuario.nome || 'Usuário';
}

async function loadComments() {
    const res = await fetch(`${apiUrl}?id_produto=${id_produto}`);
    const data = await res.json();
    const container = document.getElementById('commentsContainer');
    container.innerHTML = '';
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    let jaAvaliou = false;

    for (const item of data) {
        let dataHora = '';
        if (item.data) {
            try {
                dataHora = new Date(item.data).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch { dataHora = ''; }
        }

        const nomeUsuario = await getNomeUsuario(item.id_usuario);
        const li = document.createElement('li');
        li.innerHTML = `
            <p><strong>${nomeUsuario}</strong> em ${dataHora ? ' - ' + dataHora : ''}</p>
            <p>${'★'.repeat(item.estrelas || 0)}${'☆'.repeat(5 - (item.estrelas || 0))}</p>
            <p>${item.texto || ''}</p>
        `;

        if (usuario && item.id_usuario === usuario.id) {
            jaAvaliou = true;
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Editar';
            editBtn.onclick = () => startEdit(item);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Excluir';
            deleteBtn.onclick = () => deleteComment(item.id);
            li.append(editBtn, deleteBtn);
        }
        container.append(li);
    }

    const commentForm = document.getElementById('commentForm');
    const commentTitle = document.querySelector('#comment-section h3');
    if (jaAvaliou) {
        commentTitle.textContent = 'Você já avaliou este produto. Você pode editar ou excluir sua avaliação.';
    } else {
        commentTitle.textContent = 'Deixe seu comentário';
    }
    commentForm.style.display = '';
}

function startEdit(item) {
    editingId = item.id;
    document.getElementById('comment').value = item.texto || '';
    document.getElementById('rating').value = String(item.estrelas || item.nota || '');
    document.getElementById('submitBtn').textContent = 'Atualizar Comentário';
    document.getElementById('commentForm').style.display = '';
    document.getElementById('commentForm').scrollIntoView({ behavior: 'smooth' });
}

function deleteComment(id) {
    fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
        .then(res => { if (!res.ok) throw new Error(); loadComments(); })
        .catch(() => alert('Erro ao excluir comentário.'));
}

async function podeComentar(idUsuario, idProduto) {
    const resp = await fetch(`http://localhost:3000/pedidos?usuarioId=${idUsuario}`);
    const pedidos = await resp.json();
    return pedidos.some(pedido => Array.isArray(pedido.produtosId) && pedido.produtosId.includes(idProduto));
}

async function verificarPermissaoComentario() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const commentSection = document.getElementById('comment-section');
    const commentForm = document.getElementById('commentForm');
    const commentTitle = commentSection.querySelector('h3');
    if (!usuario) {
        commentForm.style.display = 'none';
        commentTitle.style.display = 'none';
        return;
    }
    const pode = await podeComentar(usuario.id, id_produto);
    if (!pode) {
        commentForm.style.display = 'none';
        commentTitle.style.display = 'none';
    } else {
        commentForm.style.display = '';
        commentTitle.style.display = '';
    }
}

document.getElementById('commentForm').addEventListener('submit', async e => {
    e.preventDefault();
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
        document.getElementById('responseMessage').textContent = 'Você precisa estar logado.';
        return;
    }
    const pode = await podeComentar(usuario.id, id_produto);
    if (!pode) {
        document.getElementById('responseMessage').textContent = 'Você só pode avaliar produtos que já comprou.';
        return;
    }

    const res = await fetch(`${apiUrl}?id_produto=${id_produto}&id_usuario=${usuario.id}`);
    const jaAvaliou = (await res.json()).length > 0;
    if (jaAvaliou && !editingId) {
        document.getElementById('responseMessage').textContent = 'Você já avaliou este produto. Só é possível editar ou excluir sua avaliação.';
        return;
    }

    const texto = document.getElementById('comment').value;
    const estrelas = +document.getElementById('rating').value;
    const payload = { id_usuario: usuario.id, id_produto: id_produto, texto, estrelas, data: new Date().toISOString() };
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${apiUrl}/${editingId}` : apiUrl;
    fetch(url, { method, headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(() => {
            document.getElementById('responseMessage').textContent = editingId ? 'Comentário atualizado!' : 'Comentário enviado com sucesso!';
            document.getElementById('commentForm').reset();
            document.getElementById('submitBtn').textContent = 'Enviar Comentário';
            editingId = null; loadComments();
        })
        .catch(() => document.getElementById('responseMessage').textContent = 'Erro ao salvar comentário.');
});

async function loadQuestions() {
    const res = await fetch(`${perguntasUrl}?id_produto=${id_produto}`);
    const data = await res.json();
    const container = document.getElementById('questionsListContainer');
    container.innerHTML = '';
    for (const item of data) {
        let dataHora = '';
        if (item.data) {
            try {
                dataHora = new Date(item.data).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch { dataHora = ''; }
        }
        const nomeUsuario = await getNomeUsuario(item.id_usuario);
        const li = document.createElement('li');
        li.innerHTML = `
            <p><strong>${nomeUsuario}</strong> em ${dataHora ? ' - ' + dataHora : ''}</p>
            <p>${item.texto || ''}</p>
            ${item.resposta ? `<div style="margin-top:8px;padding:8px 12px;background:#f3f3f3;border-radius:8px;"><strong>Vendedor:</strong> ${item.resposta}</div>` : ''}
        `;
        container.append(li);
    }
}

document.getElementById('questionForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
        document.getElementById('questionResponseMessage').textContent = 'Você precisa estar logado.';
        return;
    }
    const texto = document.getElementById('question').value;
    const payload = {
        id_usuario: usuario.id,
        id_produto: id_produto,
        texto,
        data: new Date().toISOString(),
        resposta: ""
    };
    fetch(perguntasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => {
            if (!res.ok) throw new Error();
            document.getElementById('questionResponseMessage').textContent = 'Pergunta enviada!';
            document.getElementById('questionForm').reset();
            loadQuestions();
        })
        .catch(() => document.getElementById('questionResponseMessage').textContent = 'Erro ao enviar pergunta.');
});

document.addEventListener('DOMContentLoaded', () => {
    loadProduct();
    loadComments();
    loadQuestions();
    verificarPermissaoComentario();
});

document.addEventListener('DOMContentLoaded', function () {
    if (!localStorage.getItem('usuario')) {
        var modal = new bootstrap.Modal(document.getElementById('loginRequiredModal'));
        modal.show();

        document.getElementById('modalLoginForm').addEventListener('submit', async function (e) {
            e.preventDefault();
            const login = document.getElementById('modalLoginUser').value.trim();
            const senha = document.getElementById('modalLoginPass').value;

            async function hashSenha(senha) {
                const encoder = new TextEncoder();
                const data = encoder.encode(senha);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            }
            const senhaHash = await hashSenha(senha);

            const resp = await fetch('http://localhost:3000/usuarios?login=' + encodeURIComponent(login) + '&senha=' + encodeURIComponent(senhaHash));
            const users = await resp.json();
            if (users.length > 0) {
                localStorage.setItem('usuario', JSON.stringify(users[0]));
                modal.hide();
            } else {
                document.getElementById('modalLoginError').textContent = 'Usuário ou senha incorretos.';
                document.getElementById('modalLoginError').style.display = 'block';
            }
        });
    }
});

document.getElementById('btnCriarContaModal')?.addEventListener('click', function () {
    window.location.href = "../login/login.html";
});

async function getUsuarioAutenticadoSeguro() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario && usuario.id) {
        return usuario.id;
    }
    return null;
}

document.addEventListener('DOMContentLoaded', async () => {
    const usuarioId = await getUsuarioAutenticadoSeguro();
    if (!usuarioId) {
        alert('Você precisa estar logado para acessar essa página.');
        window.location.href = "../../modulos/login/login.html";
        return;
    }

    const produtoId = id_produto;
    const produtoResponse = await fetch(`http://localhost:3000/products/${produtoId}`);
    const produto = await produtoResponse.json();

    const categoryId = produto.category_id;

    const categorias = {
        1: "eletronicos",
        2: "moda",
        3: "casa",
        4: "esportes",
        5: "beleza",
        6: "livros"
    };

    const categoriaNome = categorias[categoryId];

    if (categoriaNome) {
        const response = await fetch(`http://localhost:3000/usuarios/${usuarioId}`);
        const usuario = await response.json();

        usuario.recomendacao[categoriaNome] += 1;

        await fetch(`http://localhost:3000/usuarios/${usuarioId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(usuario)
        });
    }
});

async function adicionarAoCarrinho() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
        alert('Você precisa estar logado para adicionar ao carrinho.');
        return;
    }
    const produtoId = getProductIdFromUrl();
    const produtoResp = await fetch(`http://localhost:3000/products/${produtoId}`);
    if (!produtoResp.ok) {
        alert('Produto não encontrado.');
        return;
    }
    const produto = await produtoResp.json();

    const carrinhoResp = await fetch(`http://localhost:3000/carrinho?usuarioId=${usuario.id}&produtoId=${produtoId}`);
    const itens = await carrinhoResp.json();

    if (itens.length > 0) {
        const item = itens[0];
        await fetch(`http://localhost:3000/carrinho/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantidade: item.quantidade + 1 })
        });
    } else {
        await fetch(`http://localhost:3000/carrinho`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioId: usuario.id,
                produtoId: produtoId,
                quantidade: 1
            })
        });
    }

    if (window.CarrinhoOnlyController && CarrinhoOnlyController.renderCarrinho) {
        await CarrinhoOnlyController.renderCarrinho();
    }

    const modal = new bootstrap.Modal(document.getElementById('modalCarrinhoAdicionado'));
    modal.show();
}

document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('btn-adicionar-carrinho');
    if (btn) {
        btn.addEventListener('click', adicionarAoCarrinho);
    }
});
