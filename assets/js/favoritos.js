document.addEventListener('DOMContentLoaded', async () => {
    const lista = document.getElementById('favoritos-list');
    const semFavoritos = document.getElementById('sem-favoritos');

    const userId = await getUsuarioAutenticadoSeguro();
    if (!userId) {
        alert('Você precisa estar logado para acessar seus favoritos.');
        window.location.href = "../../modulos/login/login.html";
        return;
    }

    const respFav = await fetch(`http://localhost:3000/favoritos?clienteId=${userId}`);
    const favoritos = await respFav.json();
    if (!favoritos.length) {
        semFavoritos.style.display = 'block';
        return;
    }

    //modificado
    const ids = favoritos.map(f => f.produtoId);
    if (!ids.length) {
        semFavoritos.style.display = 'block';
        return;
    }

    const promises = ids.map(id =>
        fetch(`http://localhost:3000/products/${id}`).then(res => res.json())
    );

    const produto = await Promise.all(promises);

    if (!produto.length || produto.some(p => !p)) {
        semFavoritos.style.display = 'block';
        return;
    }


    produto.forEach(produto => {

        const produtoData = Array.isArray(produto) ? produto[0] : produto;


        if (produtoData && produtoData.id) {
            lista.innerHTML +=
                `
            <div class="col-md-6 col-lg-3 product-card">
                <a href="../../modulos/avaliacoes/index.html?id=${produto.id}" style="text-decoration:none;color:inherit;">
                    <div class="card h-100 shadow-sm position-relative">
                        <img src="${produto.images || '../../assets/images/no-image.png'}" class="card-img-top" alt="Produto">
                        <div class="card-body">
                            <h5 class="card-title">${produto.name}</h5>
                            <p class="fw-bold text-primary">R$ ${Number(produto.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <button class="btn btn-favorito position-absolute top-0 end-0 m-2" data-produto-id="${produto.id}" title="Desfavoritar">
                            <i class="bi bi-heart-fill"></i>
                        </button>
                    </div>
                </a>
            </div>
        `;
        }
    });

    //modificado end

    lista.addEventListener('click', async function (e) {
        if (e.target.closest('.btn-favorito')) {
            e.preventDefault();
            const btn = e.target.closest('.btn-favorito');
            const produtoId = btn.getAttribute('data-produto-id');
            await fetch(`http://localhost:3000/favoritos?clienteId=${userId}&produtoId=${produtoId}`)
                .then(r => r.json())
                .then(async favoritos => {
                    for (const fav of favoritos) {
                        await fetch(`http://localhost:3000/favoritos/${fav.id}`, { method: 'DELETE' });
                    }
                });

            let favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
            favs = favs.filter(id => id !== String(produtoId));
            localStorage.setItem('favoritos', JSON.stringify(favs));

            btn.closest('.product-card').remove();
            if (!lista.querySelector('.product-card')) {
                semFavoritos.style.display = 'block';
            }
        }
    });
});