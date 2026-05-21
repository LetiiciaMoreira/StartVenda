function gerarNavbar(navUlSelector = '.navbar-nav') {
    const navUl = document.querySelector(navUlSelector);
    if (!navUl) return;

    let pathPrefix = '';
    const path = window.location.pathname.replace(/\\/g, '/').replace(/\/$/, '');
    const depth = path.split('/').length - 2;
    for (let i = 0; i < depth; i++) pathPrefix += '../';

    ['nav-login-dados', 'nav-favoritos', 'nav-vendedor'].forEach(id => {
        const old = document.getElementById(id);
        if (old) old.remove();
    });

    let usuario = null;
    try {
        usuario = JSON.parse(localStorage.getItem('usuario'));
    } catch { }

    if (usuario) {
        const liFav = document.createElement('li');
        liFav.className = 'nav-item';
        liFav.id = 'nav-favoritos';
        liFav.innerHTML = `<a class="nav-link" href="${pathPrefix}modulos/favoritos/index.html"><i class="bi bi-heart"></i> Favoritos</a>`;
        navUl.appendChild(liFav);

        const liVend = document.createElement('li');
        liVend.className = 'nav-item';
        liVend.id = 'nav-vendedor';
        liVend.innerHTML = `<a class="nav-link" href="${pathPrefix}modulos/dashboard/index.html"><i class="bi bi-bar-chart"></i> Página do Vendedor</a>`;
        navUl.appendChild(liVend);
    }

    const li = document.createElement('li');
    li.id = 'nav-login-dados';

    if (!usuario) {
        li.className = 'nav-item';
        li.innerHTML = `<a class="nav-link" href="${pathPrefix}modulos/login/login.html"><i class="bi bi-person"></i> Login</a>`;
    } else {
        li.className = 'nav-item dropdown';
        li.innerHTML = `
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownUser" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle"></i> ${usuario.nome?.split(' ')[0] || 'Minha Conta'}
            </a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdownUser">
            <li><a class="dropdown-item" href="${pathPrefix}modulos/usuario/index.html"><i class="bi bi-person"></i> Minha Conta</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><button class="dropdown-item" id="btn-carrinho" href="#"><i class="bi bi-cart"></i> Carrinho</button></li>
            <li><a class="dropdown-item" id="btn-carrinho" href="${pathPrefix}modulos/minhas_compras/minhas_compras.html"><i class="bi bi-bag"></i> Minhas Compras</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="btn-logout"><i class="bi bi-box-arrow-right"></i> Sair</a></li>
            </ul>
        `;
    }
    navUl.appendChild(li);

    document.getElementById('btn-logout')?.addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('usuario');
        window.location.reload();
    });
}

document.addEventListener('DOMContentLoaded', () => gerarNavbar());