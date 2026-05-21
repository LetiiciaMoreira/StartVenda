const API_URL = 'http://localhost:3000/lojas';
let editId = null;
let lojaEditando = null;

const form = document.getElementById('lojaForm');
const tabela = document.getElementById('tabelaLojas');

const urlParams = new URLSearchParams(window.location.search);
const lojaId = urlParams.get('id');
const btnExcluir = document.getElementById('btnExcluir');
const alertaPermissao = document.getElementById('alertaPermissao');
const tituloFormulario = document.getElementById('tituloFormulario');

async function preencherFormularioEdicao(id) {
  const id_usuario = await getUsuarioAutenticadoSeguro();
  if (!id_usuario) {
    alert('Você precisa estar logado para editar uma loja.');
    window.location.href = "../login/login.html";
    return;
  }
  const resposta = await fetch(`${API_URL}/${id}`);
  const loja = await resposta.json();

  if (!loja || loja.deleted_at) {
    alertaPermissao.textContent = "Loja não encontrada ou já excluída.";
    alertaPermissao.classList.remove('d-none');
    form.classList.add('d-none');
    return;
  }

  if (String(loja.id_usuario) !== String(id_usuario)) {
    alertaPermissao.textContent = "Você não tem permissão para editar esta loja.";
    alertaPermissao.classList.remove('d-none');
    form.classList.add('d-none');
    return;
  }

  // Preenche campos
  form.nome.value = loja.nome;
  // form.url.value = loja.url;
  form.cnpj.value = loja.cnpj;
  form.id_categoria.value = loja.id_categoria;
  form.descricao.value = loja.descricao;
  form.rua.value = loja.endereco.rua;
  form.numero.value = loja.endereco.numero;
  form.complemento.value = loja.endereco.complemento;
  form.bairro.value = loja.endereco.bairro;
  form.cidade.value = loja.endereco.cidade;
  form.estado.value = loja.endereco.estado;
  form.cep.value = loja.endereco.cep;
  form.pais.value = loja.endereco.pais;
  form.email.value = loja.contato.email;
  form.telefone.value = loja.contato.telefone;
  form.whatsapp.value = loja.contato.whatsapp;
  // form.moeda.value = loja.configuracoes.moeda;
  // form.idioma.value = loja.configuracoes.idioma;
  // form.fuso_horario.value = loja.configuracoes.fuso_horario;
  // form.metodo_envio_padrao.value = loja.configuracoes.metodo_envio_padrao;
  // form.pag_boleto.checked = loja.configuracoes.formas_pagamento.includes('boleto');
  // form.pag_pix.checked = loja.configuracoes.formas_pagamento.includes('pix');
  // form.pag_cartao_credito.checked = loja.configuracoes.formas_pagamento.includes('cartao_credito');

  document.getElementById('previewLogo').src = loja.url_logo || '../../assets/images/plus.png';
  document.getElementById('previewBanner').src = loja.url_banner || '';

  editId = id;
  lojaEditando = loja;
  btnExcluir.classList.remove('d-none');
  tituloFormulario.textContent = "Editar Loja";
}

btnExcluir?.addEventListener('click', async () => {
  if (confirm('Tem certeza que deseja excluir esta loja?')) {
    await fetch(`${API_URL}/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleted_at: new Date().toISOString() })
    });
    window.location.href = "../../index.html";
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id_usuario = await getUsuarioAutenticadoSeguro();
  if (!id_usuario) {
    alert('Você precisa estar logado para cadastrar uma loja.');
    window.location.href = "../login/login.html";
    return;
  }

  async function fileToBase64(input) {
    return new Promise((resolve) => {
      const file = input.files[0];
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  const [logoBase64, bannerBase64] = await Promise.all([
    fileToBase64(form.url_logo),
    fileToBase64(form.url_banner)
  ]);

  let url_logo_final = logoBase64;
  let url_banner_final = bannerBase64;
  if (editId && lojaEditando) {
    if (!logoBase64) url_logo_final = lojaEditando.url_logo;
    if (!bannerBase64) url_banner_final = lojaEditando.url_banner;
  }

  const loja = {
    nome: form.nome.value,
    url: null,
    cnpj: form.cnpj.value,
    id_usuario: id_usuario,
    id_categoria: Number(form.id_categoria.value) || null,
    descricao: form.descricao.value,
    url_logo: url_logo_final,
    url_banner: url_banner_final,
    endereco: {
      rua: form.rua.value,
      numero: form.numero.value,
      complemento: form.complemento.value,
      bairro: form.bairro.value,
      cidade: form.cidade.value,
      estado: form.estado.value,
      cep: form.cep.value,
      pais: form.pais.value,
    },
    contato: {
      email: form.email.value,
      telefone: form.telefone.value,
      whatsapp: form.whatsapp.value,
    },
    configuracoes: {
      moeda: null,
      idioma: null,
      fuso_horario: null,
      metodo_envio_padrao: null,
      formas_pagamento: null
    },
    deleted_at: null
  };

  if (editId) {
    delete loja.deleted_at;
    await fetch(`${API_URL}/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loja)
    });
    editId = null;
    lojaEditando = null;

    const modalHtml = `
      <div class="modal fade" id="modalSucessoEdicao" tabindex="-1" aria-labelledby="modalSucessoEdicaoLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title" id="modalSucessoEdicaoLabel">Sucesso</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
              Dados da loja atualizados com sucesso!
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('modalSucessoEdicao'));
    modal.show();
    document.getElementById('modalSucessoEdicao').addEventListener('hidden.bs.modal', function() {
      document.getElementById('modalSucessoEdicao').remove();
      window.location.href = "../../index.html";
    });
  } else {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loja)
    });
  }

  form.reset();
  document.getElementById('previewLogo').src = '';
  document.getElementById('previewBanner').src = '';
  carregarLojas();
});

async function carregarLojas() {
  const id_usuario = await getUsuarioAutenticadoSeguro();
  if (!id_usuario) {
    alert('Você precisa estar logado para visualizar suas lojas.');
    window.location.href = "../login/login.html";
    return;
  }

  const resposta = await fetch(`${API_URL}?id_usuario=${id_usuario}`);
  let lojas = await resposta.json();

  lojas = lojas.filter(loja => loja.deleted_at == null);

  tabela.innerHTML = '';
  lojas.forEach(loja => {
    tabela.innerHTML += `
      <tr>
        <td>
          <img src="${loja.url_logo || ''}" alt="Logo" style="width:40px;height:40px;object-fit:cover;border-radius:50%;margin-right:8px;vertical-align:middle;">
          <span>${loja.nome}</span>
        </td>
        <td>${loja.cnpj}</td>
        <td>${CATEGORIAS[loja.id_categoria] || ''}</td>
        <td>
          <button class="btn btn-warning btn-sm me-2" onclick="editarLoja('${loja.id}')">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="excluirLoja('${loja.id}')">Excluir</button>
        </td>
      </tr>
    `;
  });
}

async function editarLoja(id) {
  const resposta = await fetch(`${API_URL}/${id}`);
  const loja = await resposta.json();

  form.nome.value = loja.nome;
  // form.url.value = loja.url;
  form.cnpj.value = loja.cnpj;
  form.id_categoria.value = loja.id_categoria;
  form.descricao.value = loja.descricao;

  form.rua.value = loja.endereco.rua;
  form.numero.value = loja.endereco.numero;
  form.complemento.value = loja.endereco.complemento;
  form.bairro.value = loja.endereco.bairro;
  form.cidade.value = loja.endereco.cidade;
  form.estado.value = loja.endereco.estado;
  form.cep.value = loja.endereco.cep;
  form.pais.value = loja.endereco.pais;

  form.email.value = loja.contato.email;
  form.telefone.value = loja.contato.telefone;
  form.whatsapp.value = loja.contato.whatsapp;

  // form.moeda.value = loja.configuracoes.moeda;
  // form.idioma.value = loja.configuracoes.idioma;
  // form.fuso_horario.value = loja.configuracoes.fuso_horario;
  // form.metodo_envio_padrao.value = loja.configuracoes.metodo_envio_padrao;

  // form.pag_boleto.checked = loja.configuracoes.formas_pagamento.includes('boleto');
  // form.pag_pix.checked = loja.configuracoes.formas_pagamento.includes('pix');
  // form.pag_cartao_credito.checked = loja.configuracoes.formas_pagamento.includes('cartao_credito');

  editId = id;
  lojaEditando = loja;

  document.getElementById('previewLogo').src = loja.url_logo || '../../assets/images/plus.png';
  document.getElementById('previewBanner').src = loja.url_banner || '';
}

async function excluirLoja(id) {
  await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleted_at: new Date().toISOString() })
  });
  carregarLojas();
}

window.editarLoja = editarLoja;
window.excluirLoja = excluirLoja;

const CATEGORIAS = {
  1: 'Roupas',
  2: 'Eletrônicos',
  3: 'Alimentos',
  4: 'Livros',
  5: 'Outros'
};

document.getElementById('btnLimpar').addEventListener('click', () => {
  form.reset();
  document.getElementById('previewLogo').src = '../../assets/images/plus.png';
  document.getElementById('previewBanner').src = '';
  editId = null;
  lojaEditando = null;
});

document.addEventListener('DOMContentLoaded', async () => {
  if (lojaId) {
    // Modo edição
    document.getElementById('btnLimpar').classList.add('d-none');
    await preencherFormularioEdicao(lojaId);
    // Oculta tabela de lojas se existir
    const tabelaLojas = document.getElementById('tabelaLojas');
    if (tabelaLojas) tabelaLojas.closest('.bg-white').style.display = 'none';
  } else {
    // Modo cadastro
    btnExcluir?.classList.add('d-none');
    tituloFormulario.textContent = "Cadastro de Loja";
    // Oculta tabela de lojas se existir
    const tabelaLojas = document.getElementById('tabelaLojas');
    if (tabelaLojas) tabelaLojas.closest('.bg-white').style.display = 'none';
  }
});
