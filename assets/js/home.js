async function getPrincipaisLojas() {
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);
    const ano = seteDiasAtras.getFullYear();
    const mes = String(seteDiasAtras.getMonth() + 1).padStart(2, '0');
    const dia = String(seteDiasAtras.getDate()).padStart(2, '0');
    const dataSemanaPassada = `${ano}-${mes}-${dia}`;

    try {
        const produtosResp = await fetch('http://localhost:3000/products');
        if (!produtosResp.ok) {
            throw new Error(`Erro ao buscar produtos: ${produtosResp.status} ${produtosResp.statusText}`);
        }
        const produtos = await produtosResp.json();
        const mapaProdutoParaLoja = {};
        produtos.forEach(produto => {
            mapaProdutoParaLoja[produto.id] = produto.id_loja;
        });

        const pedidosResp = await fetch(`http://localhost:3000/pedidos`);
        if (!pedidosResp.ok) {
            throw new Error(`Erro ao buscar pedidos: ${pedidosResp.status} ${pedidosResp.statusText}`);
        }
        const pedidos = await pedidosResp.json();

        const contagemPorLoja = {};
        pedidos.forEach(pedido => {
            if (!Array.isArray(pedido.produtosId)) return;
            pedido.produtosId.forEach(id => {
                const id_loja = mapaProdutoParaLoja[id];
                if (id_loja == null) return;
                contagemPorLoja[id_loja] = (contagemPorLoja[id_loja] || 0) + 1;
            });
        });

        const arrayLojasOrdenado = Object.entries(contagemPorLoja)
            .map(([id_loja, totalVendas]) => ({ id_loja: id_loja, totalVendas }))
            .sort((a, b) => b.totalVendas - a.totalVendas);

        const top10 = arrayLojasOrdenado.slice(0, 10);
        const idsTop10 = top10.map(item => item.id_loja);

        if (idsTop10.length === 0) {
            console.log('Não há vendas na última semana ou nenhum produto vinculado a loja.');
            return [];
        }

        const queryString = idsTop10.map(id => `id=${id}`).join('&');
        const lojasResp = await fetch(`http://localhost:3000/lojas?${queryString}`);
        if (!lojasResp.ok) {
            throw new Error(`Erro ao buscar lojas: ${lojasResp.status} ${lojasResp.statusText}`);
        }
        const lojas = await lojasResp.json();

        const resultadoFinal = top10.map(({ id_loja, totalVendas }) => {
            const lojaObj = lojas.find(l => l.id === id_loja) || { id: id_loja, nome: '[Loja não encontrada]' };
            return { loja: lojaObj, totalVendas };
        });

        return resultadoFinal;
    } catch (erro) {
        console.error('Falha ao obter principais lojas:', erro);
        throw erro;
    }
}

async function getTop50Produtos() {
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);
    const ano = seteDiasAtras.getFullYear();
    const mes = String(seteDiasAtras.getMonth() + 1).padStart(2, '0');
    const dia = String(seteDiasAtras.getDate()).padStart(2, '0');
    const dataSemanaPassada = `${ano}-${mes}-${dia}`;

    try {
        const produtosResp = await fetch('http://localhost:3000/products');
        if (!produtosResp.ok) {
            throw new Error(`Erro ao buscar produtos: ${produtosResp.status} ${produtosResp.statusText}`);
        }
        const produtos = await produtosResp.json();

        const pedidosResp = await fetch(`http://localhost:3000/pedidos?data_venda_gte=${dataSemanaPassada}`);
        if (!pedidosResp.ok) {
            throw new Error(`Erro ao buscar pedidos: ${pedidosResp.status} ${pedidosResp.statusText}`);
        }
        const pedidos = await pedidosResp.json();

        const contagemPorProduto = {};
        pedidos.forEach(pedido => {
            if (!Array.isArray(pedido.produtosId)) return;
            pedido.produtosId.forEach(id => {
                contagemPorProduto[id] = (contagemPorProduto[id] || 0) + 1;
            });
        });

        const arrayProdutosOrdenado = Object.entries(contagemPorProduto)
            .map(([id_produto, totalVendas]) => ({ id_produto: id_produto, totalVendas }))
            .sort((a, b) => b.totalVendas - a.totalVendas);

        const top50 = arrayProdutosOrdenado.slice(0, 50);
        const idsTop50 = top50.map(item => item.id_produto);

        if (idsTop50.length === 0) {
            console.log('Não há vendas na última semana.');
            return [];
        }

        const queryString = idsTop50.map(id => `id=${id}`).join('&');
        const produtosTopResp = await fetch(`http://localhost:3000/products?${queryString}`);
        if (!produtosTopResp.ok) {
            throw new Error(`Erro ao buscar produtos top: ${produtosTopResp.status} ${produtosTopResp.statusText}`);
        }
        const produtosTop = await produtosTopResp.json();

        const resultadoFinal = top50.map(({ id_produto, totalVendas }) => {
            const produtoObj = produtosTop.find(p => p.id === id_produto) || { id: id_produto, nome: '[Produto não encontrado]' };
            return { produto: produtoObj, totalVendas };
        });

        return resultadoFinal;
    } catch (erro) {
        console.error('Falha ao obter top 50 produtos:', erro);
        throw erro;
    }
}

async function getUltimos5Produtos() {
    try {
        const resp = await fetch('http://localhost:3000/products?_sort=id&_order=desc&_limit=5');
        if (!resp.ok) {
            throw new Error(`Erro ao buscar últimos produtos: ${resp.status} ${resp.statusText}`);
        }
        const produtos = await resp.json();
        return produtos;
    } catch (erro) {
        console.error('Falha ao obter últimos 5 produtos:', erro);
        throw erro;
    }
}

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
            <a href="modulos/avaliacoes/index.html?id=${produto.id}" style="text-decoration:none;color:inherit;">
                <div class="card h-100 shadow-sm position-relative">
                    <img src="${produto.images || 'assets/images/no-image.png'}" class="card-img-top" alt="Produto">
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

async function carregarProdutosPorCategoria(categoriaId = null) {
    let url = 'http://localhost:3000/products';
    if (categoriaId) {
        url += `?category_id=${categoriaId}`;
    }
    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Erro ao buscar produtos');
        const produtos = await resp.json();

        const container = document.getElementById('top-produtos');
        container.innerHTML = '';

        const userId = await getUsuarioAutenticadoSeguro();

        for (const produto of produtos) {
            container.innerHTML += await renderizarProduto(produto, userId);
        }

        const ultimosProdutos = produtos
            .slice()
            .sort((a, b) => b.id - a.id)
            .slice(0, 4);

        const novidadesContainer = document.getElementById('ultimos-produtos');
        novidadesContainer.innerHTML = '';
        for (const produto of ultimosProdutos) {
            const media = await getMediaAvaliacoes(produto.id);
            novidadesContainer.innerHTML += `
                <div class="col-md-6 col-lg-3 product-card">
                    <a href="modulos/avaliacoes/index.html?id=${produto.id}" style="text-decoration:none;color:inherit;">
                        <div class="card h-100 shadow-sm position-relative">
                            <img src="${produto.images || 'assets/images/no-image.png'}" class="card-img-top" alt="Produto">
                            <div class="card-body">
                                <h5 class="card-title">${produto.name}</h5>
                                <p class="card-text">${renderEstrelas(media)} <span class="ms-2">${media ? media.toFixed(1) : ''}</span></p>
                                <p class="fw-bold text-primary">R$ ${Number(produto.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <button class="btn btn-favorito position-absolute top-0 end-0 m-2" data-produto-id="${produto.id}" title="Favoritar">
                                <i class="bi bi-heart"></i>
                            </button>
                        </div>
                    </a>
                </div>
            `;
        }

        marcarFavoritos();
    } catch (erro) {
        console.error('Erro ao carregar produtos:', erro);
    }
}

async function buscarProdutosPorNome(termo) {
    document.querySelectorAll(
        '.banner, section[aria-label="novidades"], section[aria-label="principais-lojas"], section[aria-label="categorias"], section[aria-label="produtos-destaque"], #lojas, #ultimos-produtos, .category-card, section.container.my-5'
    ).forEach(sec => {
        if (
            sec.id === "produtos" ||
            sec.querySelector && sec.querySelector("#top-produtos")
        ) return;
        sec.style.display = "none";
    });

    const produtosSection = document.getElementById("produtos");
    if (produtosSection) {
        produtosSection.style.display = "block";
        let h2 = produtosSection.querySelector("h2");
        if (h2) h2.textContent = "Resultado da pesquisa";

        if (!document.getElementById('btn-voltar-busca')) {
            const btnVoltar = document.createElement('button');
            btnVoltar.id = 'btn-voltar-busca';
            btnVoltar.className = 'btn btn-secondary mb-4';
            btnVoltar.innerHTML = '<i class="bi bi-arrow-left"></i> Voltar';
            btnVoltar.onclick = () => window.location.reload();
            h2.parentNode.insertBefore(btnVoltar, h2.nextSibling);
        }
    }

    try {
        const respProdutos = await fetch(`http://localhost:3000/products?name_like=${encodeURIComponent(termo)}`);
        if (!respProdutos.ok) throw new Error('Erro ao buscar produtos');
        const produtosPorNome = await respProdutos.json();

        const respLojas = await fetch(`http://localhost:3000/lojas?nome_like=${encodeURIComponent(termo)}`);
        if (!respLojas.ok) throw new Error('Erro ao buscar lojas');
        const lojas = await respLojas.json();

        let produtosPorLoja = [];
        if (lojas.length > 0) {
            const idsLojas = lojas.map(l => `id_loja=${l.id}`).join('&');
            const respProdutosLoja = await fetch(`http://localhost:3000/products?${idsLojas}`);
            if (respProdutosLoja.ok) {
                produtosPorLoja = await respProdutosLoja.json();
            }
        }

        const todosProdutos = [...produtosPorNome, ...produtosPorLoja].filter(
            (prod, idx, arr) => arr.findIndex(p => p.id === prod.id) === idx
        );

        const container = document.getElementById('top-produtos');
        container.innerHTML = '';

        if (lojas.length > 0) {
            container.innerHTML += `
                <div class="mb-4 d-flex align-items-center flex-wrap" id="resultado-lojas">
                    ${lojas.map(loja => `
                        <div class="me-4 mb-2 text-center">
                            <a href="modulos/products/loja.html?id=${loja.id}" style="text-decoration:none;">
                                <img src="${loja.url_logo || 'assets/images/no-image.png'}" alt="${loja.nome}" style="width:110px;height:110px;object-fit:contain;border-radius:50%;background:#fff;border:1px solid #eee;">
                                <div style="font-size:1.1em;font-weight:500;">${loja.nome}</div>
                            </a>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (todosProdutos.length === 0) {
            container.innerHTML += '<div class="text-center text-muted py-5">Nenhum produto encontrado.</div>';
            return;
        }

        const userId = await getUsuarioAutenticadoSeguro();
        for (const produto of todosProdutos) {
            container.innerHTML += await renderizarProduto(produto, userId);
        }

        marcarFavoritos();
    } catch (erro) {
        console.error('Erro ao buscar produtos:', erro);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inputBusca = document.querySelector('.input-group-lg input[type="text"]');
    const botaoBusca = document.querySelector('.input-group-lg button');

    if (botaoBusca && inputBusca) {
        botaoBusca.addEventListener('click', () => {
            const termo = inputBusca.value.trim();
            if (termo) buscarProdutosPorNome(termo);
        });

        inputBusca.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const termo = inputBusca.value.trim();
                if (termo) buscarProdutosPorNome(termo);
            }
        });
    }

    carregarProdutosPorCategoria();
    carregarParaVoce();

    const paraVoceScroll = document.getElementById('para-voce-produtos');
    const btnEsq = document.getElementById('btn-para-voce-esquerda');
    const btnDir = document.getElementById('btn-para-voce-direita');
    if (paraVoceScroll && btnEsq && btnDir) {
        btnEsq.onclick = () => paraVoceScroll.scrollBy({ left: -280, behavior: 'smooth' });
        btnDir.onclick = () => paraVoceScroll.scrollBy({ left: 280, behavior: 'smooth' });
    }
});

document.querySelectorAll('.category-card').forEach((card, idx) => {
    card.addEventListener('click', () => {
        const categorias = [null, 1, 2, 3, 4, 5, 6];
        const categoriaId = categorias[idx];
        carregarProdutosPorCategoria(categoriaId);
    });
});

document.getElementById('mostrar-todos-produtos')?.addEventListener('click', () => {
    carregarProdutosPorCategoria();
});

async function carregarTodasLojas() {
    try {
        const resp = await fetch('http://localhost:3000/lojas');
        if (!resp.ok) throw new Error('Erro ao buscar lojas');
        const lojas = await resp.json();
        
        const container = document.getElementById('top-lojas');
        container.innerHTML = '';
        
        if (lojas.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted py-5">Nenhuma loja disponível.</div>';
            return;
        }
        
        lojas.forEach(loja => {
            container.innerHTML += `
                <div class="col-md-6 col-lg-4 store-card">
                    <a href="modulos/products/loja.html?id=${loja.id}" style="text-decoration:none;">
                        <div class="card h-100 shadow-sm modern-category-card" style="cursor:pointer;">
                            <div class="card-bg-logo" style="background-image: url('${loja.url_logo || 'assets/images/no-image.png'}');"></div>
                            <div class="card-body text-center d-flex flex-column justify-content-center align-items-center h-100">
                                <h5 class="card-title">${loja.nome}</h5>
                                <p class="card-text">${loja.descricao || ''}</p>
                                <p class="mb-1"><i class="bi bi-geo-alt"></i> ${loja.endereco?.cidade || 'Localização não informada'}</p>
                                <p class="mb-1"><i class="bi bi-envelope"></i> ${loja.contato?.email || ''}</p>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        });
    } catch (error) {
        console.error('Erro ao carregar lojas:', error);
        document.getElementById('top-lojas').innerHTML = '<div class="col-12 text-center text-muted py-5">Erro ao carregar lojas.</div>';
    }
}

carregarTodasLojas();

getUltimos5Produtos()
    .then(async produtos => {
        const novidadesContainer = document.getElementById('ultimos-produtos');
        novidadesContainer.innerHTML = '';
        const userId = await getUsuarioAutenticadoSeguro();
        produtos.forEach(produto => {
            novidadesContainer.innerHTML += `
                <div class="col-md-6 col-lg-3 product-card">
                    <a href="modulos/avaliacoes/index.html?id=${produto.id}" style="text-decoration:none;color:inherit;">
                        <div class="card h-100 shadow-sm position-relative">
                            <img src="${produto.images}" class="card-img-top" alt="Produto">
                            <div class="card-body">
                                <h5 class="card-title">${produto.name}</h5>
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
        });
        marcarFavoritos();
    })
    .catch(err => { });

async function adicionarFavorito(produtoId) {
    const userId = await getUsuarioAutenticadoSeguro();
    if (!userId) {
        alert('Você precisa estar logado para favoritar produtos.');
        window.location.href = "modulos/login/login.html";
        return;
    }
    const resp = await fetch('http://localhost:3000/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: userId, produtoId: produtoId })
    });
    if (!resp.ok) throw new Error('Erro ao favoritar produto');
    return await resp.json();
}

async function removerFavorito(produtoId) {
    const userId = await getUsuarioAutenticadoSeguro();
    if (!userId) {
        alert('Você precisa estar logado para desfavoritar produtos.');
        window.location.href = "modulos/login/login.html";
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

document.addEventListener('click', async function (e) {
    if (e.target.closest('.btn-favorito')) {
        e.preventDefault();
        const btn = e.target.closest('.btn-favorito');
        const produtoId = btn.getAttribute('data-produto-id');
        const userId = await getUsuarioAutenticadoSeguro();
        if (!userId) {
            alert('Você precisa estar logado para favoritar produtos.');
            window.location.href = "modulos/login/login.html";
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
document.addEventListener('DOMContentLoaded', marcarFavoritos);

async function carregarFavoritosDoServidor() {
    const userId = await getUsuarioAutenticadoSeguro();
    if (!userId) return;
    const resp = await fetch(`http://localhost:3000/favoritos?clienteId=${userId}`);
    const favoritos = await resp.json();
    localStorage.setItem('favoritos', JSON.stringify(favoritos.map(f => String(f.produtoId))));
}
document.addEventListener('DOMContentLoaded', carregarFavoritosDoServidor);

async function carregarParaVoce() {
    const userId = await getUsuarioAutenticadoSeguro();
    if (!userId) return;

    const resp = await fetch(`http://localhost:3000/usuarios/${userId}`);
    if (!resp.ok) return;
    const usuario = await resp.json();

    const recomendacao = usuario.recomendacao || {};
    const categorias = Object.entries(recomendacao)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .filter(([_, pontos]) => pontos > 0)
        .map(([cat]) => cat);

    if (categorias.length === 0) return;

    const categoriaToId = {
        eletronicos: 1,
        moda: 2,
        casa: 3,
        esportes: 4,
        beleza: 5,
        livros: 6
    };

    let todosProdutos = [];

    for (const categoria of categorias) {
        const catId = categoriaToId[categoria];
        const resp = await fetch(`http://localhost:3000/products?category_id=${catId}`);
        if (!resp.ok) continue;
        let produtos = await resp.json();
        todosProdutos = todosProdutos.concat(produtos);
    }

    todosProdutos = todosProdutos.sort(() => Math.random() - 0.5).slice(0, 8);

    if (todosProdutos.length === 0) return;

    const container = document.getElementById('para-voce-produtos');
    container.innerHTML = '';
    for (const produto of todosProdutos) {
        const media = await getMediaAvaliacoes(produto.id);
        container.innerHTML += `
            <div class="product-card">
                <a href="modulos/avaliacoes/index.html?id=${produto.id}" style="text-decoration:none;color:inherit;">
                    <div class="card h-100 shadow-sm position-relative">
                        <img src="${produto.images || 'assets/images/no-image.png'}" class="card-img-top" alt="Produto">
                        <div class="card-body">
                            <h5 class="card-title">${produto.name}</h5>
                            <p class="card-text">${renderEstrelas(media)} <span class="ms-2">${media ? media.toFixed(1) : ''}</span></p>
                            <p class="fw-bold text-primary">R$ ${Number(produto.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <button class="btn btn-favorito position-absolute top-0 end-0 m-2" data-produto-id="${produto.id}" title="Favoritar">
                            <i class="bi bi-heart"></i>
                        </button>
                    </div>
                </a>
            </div>
        `;
    }

    document.getElementById('para-voce-section').style.display = '';
    marcarFavoritos();
}
