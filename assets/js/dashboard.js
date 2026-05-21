async function carregarLojas() {
    const id_usuario = await getUsuarioAutenticadoSeguro();
    if (!id_usuario) {
        alert('Você precisa estar logado para acessar suas lojas.');
        window.location.href = "../login/login.html";
        return;
    }
    const resp = await fetch('http://localhost:3000/lojas?id_usuario=' + id_usuario);
    const lojas = await resp.json();
    const container = document.getElementById('minhas-lojas-lista');
    container.innerHTML = '';
    if (lojas.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-5">Você ainda não cadastrou nenhuma loja.</div>';
        return;
    }
    lojas.forEach(loja => {
        container.innerHTML += `
          <div class="col-md-6 col-lg-4 store-card">
            <a href="configuracoes/index.html?id=${loja.id}" style="text-decoration:none;">
              <div class="card h-100 shadow-sm modern-category-card" style="cursor:pointer;">
                <div class="card-bg-logo" style="background-image: url('${loja.url_logo || '../../assets/images/no-image.png'}');"></div>
                <div class="card-body text-center d-flex flex-column justify-content-center align-items-center h-100">
                  <h5 class="card-title">${loja.nome}</h5>
                  <p class="card-text">${loja.descricao || ''}</p>
                  <p class="mb-1"><i class="bi bi-geo-alt"></i> ${loja.endereco?.rua ? (loja.endereco.rua + " " + (loja.endereco.numero || "") + ", " + (loja.endereco.bairro || "")) : 'Endereço não informado'}</p>
                  <p class="mb-1"><i class="bi bi-envelope"></i> ${loja.contato?.email || ''}</p>
                  <p class="mb-1"><i class="bi bi-telephone"></i> ${loja.contato?.telefone || ''}</p>
                </div>
              </div>
            </a>
          </div>
        `;
    });
}
document.addEventListener('DOMContentLoaded', carregarLojas);