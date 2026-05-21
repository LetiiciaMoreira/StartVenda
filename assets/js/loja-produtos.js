let lojaId = null;
let todosProdutos = [];

async function getMediaAvaliacoes(produtoId) {
    try {
        const resp = await fetch(`http://localhost:3000/avaliacoes?id_produto=${produtoId}`);
        if (!resp.ok) return 0;
        const avaliacoes = await resp.json();
        if (!avaliacoes.length) return 0;
        const soma = avaliacoes.reduce((acc, av) => acc + (Number(av.estrelas) || 0), 0);
        return soma / avaliacoes.length;
    } catch {
        return 0;
    }
}

function renderEstrelas(media) {
    const estrelas = [];
    for (let i = 1; i <= 5; i++) {
        if (media >= i) {
            estrelas.push('<i class="bi bi-star-fill text-warning"></i>');
        } else if (media >= i - 0.5) {
            estrelas.push('<i class="bi bi-star-half text-warning"></i>');
        } else {
            estrelas.push('<i class="bi bi-star text-warning"></i>');
        }
    }
    return estrelas.join('');
}

async function renderizarProduto(produto, userId) {
    const media = await getMediaAvaliacoes(produto.id);
    return `
        <div class="col-md-6 col-lg-3 product-card">
            <a href="../avaliacoes/index.html?id=${produto.id}" style="text-decoration:none;color:inherit;">
                <div class="card h-100 shadow-sm position-relative">
                    <img src="${produto.images || '../../assets/images/no-image.png'}" class="card-img-top" alt="Produto">
                    <div class="card-body">
                        <h5 class="card-title">${produto.name}</h5>
                        <p class="card-text">${renderEstrelas(media)} <span class="ms-2">${media ? media.toFixed(1) : ''}</span></p>
                        <p class="fw-bold text-primary">R$ ${Number(produto.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    ${userId ? `
                    <button class="btn btn-favorito position-absolute top-0 end-0 m-2" data-produto-id="${produto.id}" title="Favoritar">
                        <i class="bi bi-heart"></i>
                    </button>
                    ` : ''}
                </div>
            </a>
        </div>
    `;
}

async function carregarLoja() {
    const urlParams = new URLSearchParams(window.location.search);
    lojaId = urlParams.get('id');
    
    if (!lojaId) {
        document.getElementById('nome-loja').textContent = 'Loja não encontrada';
        return;
    }

    try {
        const resp = await fetch(`http://localhost:3000/lojas/${lojaId}`);
        if (!resp.ok) throw new Error('Loja não encontrada');
        
        const loja = await resp.json();
        document.getElementById('nome-loja').textContent = loja.nome;
        document.getElementById('descricao-loja').textContent = loja.descricao || 'Confira todos os produtos disponíveis!';
        
        if (loja.url_banner) {
            document.getElementById('banner-loja').style.backgroundImage = `url(${loja.url_banner})`;
            document.getElementById('banner-loja').style.backgroundSize = 'cover';
            document.getElementById('banner-loja').style.backgroundPosition = 'center';
        }
    } catch (error) {
        document.getElementById('nome-loja').textContent = 'Loja não encontrada';
        console.error('Erro ao carregar loja:', error);
    }
}

async function carregarProdutosDaLoja(categoriaId = null) {
    if (!lojaId) return;

    try {
        let url = `http://localhost:3000/products?id_loja=${lojaId}`;
        if (categoriaId) {
            url += `&category_id=${categoriaId}`;
        }
        
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Erro ao buscar produtos');
        
        const produtos = await resp.json();
        todosProdutos = produtos;
        
        const container = document.getElementById('produtos-loja');
        container.innerHTML = '';

        if (produtos.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted py-5">Nenhum produto encontrado nesta loja.</div>';
            return;
        }

        const userId = await getUsuarioAutenticadoSeguro();

        for (const produto of produtos) {
            container.innerHTML += await renderizarProduto(produto, userId);
        }

        marcarFavoritos();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        document.getElementById('produtos-loja').innerHTML = '<div class="col-12 text-center text-muted py-5">Erro ao carregar produtos.</div>';
    }
}

async function buscarProdutos(termo) {
    if (!lojaId) return;

    try {
        const resp = await fetch(`http://localhost:3000/products?id_loja=${lojaId}&name_like=${encodeURIComponent(termo)}`);
        if (!resp.ok) throw new Error('Erro ao buscar produtos');
        
        const produtos = await resp.json();
        const container = document.getElementById('produtos-loja');
        container.innerHTML = '';

        if (produtos.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted py-5">Nenhum produto encontrado com este termo.</div>';
            return;
        }

        const userId = await getUsuarioAutenticadoSeguro();

        for (const produto of produtos) {
            container.innerHTML += await renderizarProduto(produto, userId);
        }

        marcarFavoritos();
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
    }
}

async function adicionarFavorito(produtoId) {
    const userId = await getUsuarioAutenticadoSeguro();
    if (!userId) {
        alert('Você precisa estar logado para favoritar produtos.');
        window.location.href = "../login/login.html";
        return;
    }
    const resp = await fetch('http://localhost:3000/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: userId, produtoId: Number(produtoId) })
    });
    if (!resp.ok) throw new Error('Erro ao favoritar produto');
    return await resp.json();
}

async function removerFavorito(produtoId) {
    const userId = await getUsuarioAutenticadoSeguro();
    if (!userId) {
        alert('Você precisa estar logado para desfavoritar produtos.');
        window.location.href = "../login/login.html";
        return;
    }
    const resp = await fetch(`http://localhost:3000/favoritos?clienteId=${userId}&produtoId=${produtoId}`);
    const favoritos = await resp.json();
    if (favoritos.length > 0) {
        for (const fav of favoritos) {
            await fetch(`http://localhost:3000/favoritos/${fav.id}`, { method: 'DELETE' });
        }
    }
}

function marcarFavoritos() {
    let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
    document.querySelectorAll('.btn-favorito').forEach(btn => {
        const produtoId = btn.getAttribute('data-produto-id');
        if (favoritos.includes(produtoId)) {
            btn.querySelector('i').classList.remove('bi-heart');
            btn.querySelector('i').classList.add('bi-heart-fill');
        } else {
            btn.querySelector('i').classList.remove('bi-heart-fill');
            btn.querySelector('i').classList.add('bi-heart');
        }
    });
}

async function carregarFavoritosDoServidor() {
    const userId = await getUsuarioAutenticadoSeguro();
    if (!userId) return;
    const resp = await fetch(`http://localhost:3000/favoritos?clienteId=${userId}`);
    const favoritos = await resp.json();
    localStorage.setItem('favoritos', JSON.stringify(favoritos.map(f => String(f.produtoId))));
}

document.addEventListener('DOMContentLoaded', async () => {
    await carregarLoja();
    await carregarProdutosDaLoja();
    await carregarFavoritosDoServidor();
    
    // Event listeners para categorias
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const categoriaId = card.getAttribute('data-category');
            carregarProdutosDaLoja(categoriaId);
        });
    });

    document.getElementById('mostrar-todos-produtos').addEventListener('click', () => {
        carregarProdutosDaLoja();
    });

    // Event listener para busca
    const inputBusca = document.getElementById('busca-produtos');
    const btnBuscar = document.getElementById('btn-buscar');

    btnBuscar.addEventListener('click', () => {
        const termo = inputBusca.value.trim();
        if (termo) {
            buscarProdutos(termo);
        } else {
            carregarProdutosDaLoja();
        }
    });

    inputBusca.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const termo = inputBusca.value.trim();
            if (termo) {
                buscarProdutos(termo);
            } else {
                carregarProdutosDaLoja();
            }
        }
    });
});

// Event listener para favoritos
document.addEventListener('click', async function (e) {
    if (e.target.closest('.btn-favorito')) {
        e.preventDefault();
        const btn = e.target.closest('.btn-favorito');
        const produtoId = btn.getAttribute('data-produto-id');
        const userId = await getUsuarioAutenticadoSeguro();
        if (!userId) {
            alert('Você precisa estar logado para favoritar produtos.');
            window.location.href = "../login/login.html";
            return;
        }
        let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
        if (favoritos.includes(produtoId)) {
            favoritos = favoritos.filter(id => id !== produtoId);
            btn.querySelector('i').classList.remove('bi-heart-fill');
            btn.querySelector('i').classList.add('bi-heart');
            localStorage.setItem('favoritos', JSON.stringify(favoritos));
            try {
                await removerFavorito(produtoId);
            } catch (err) {
                alert('Erro ao desfavoritar no servidor');
            }
        } else {
            favoritos.push(produtoId);
            btn.querySelector('i').classList.remove('bi-heart');
            btn.querySelector('i').classList.add('bi-heart-fill');
            localStorage.setItem('favoritos', JSON.stringify(favoritos));
            try {
                await adicionarFavorito(produtoId);
            } catch (err) {
                alert('Erro ao favoritar no servidor');
            }
        }
    }
});