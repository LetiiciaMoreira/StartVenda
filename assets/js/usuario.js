function mostrarModal(mensagem, titulo = "Mensagem") {
  document.getElementById('modalMensagemLabel').innerText = titulo;
  document.getElementById('modalMensagemBody').innerText = mensagem;
  const modal = new bootstrap.Modal(document.getElementById('modalMensagem'));
  modal.show();
}

async function carregarDadosUsuario() {
  const id_usuario = await getUsuarioAutenticadoSeguro();
  if (!id_usuario) {
    mostrarModal('Você precisa estar logado para editar seus dados.', 'Atenção');
    setTimeout(() => {
      window.location.href = "../login/login.html";
    }, 2000);
    return;
  }

  const resp = await fetch(`/usuarios/${id_usuario}`);
  if (!resp.ok) {
    mostrarModal('Erro ao carregar dados do usuário.', 'Erro');
    return;
  }
  const usuario = await resp.json();

  document.getElementById('nome').value = usuario.nome || '';
  document.getElementById('email').value = usuario.email || '';
  document.getElementById('login').value = usuario.login || '';
}

async function hashSenha(senha) {
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function atualizarUsuario(e) {
  e.preventDefault();
  const id_usuario = await getUsuarioAutenticadoSeguro();
  if (!id_usuario) return;

  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const login = document.getElementById('login').value;
  const senha = document.getElementById('senha').value;

  const dados = { nome, email, login };
  if (senha) {
    dados.senha = await hashSenha(senha);
  }

  const resp = await fetch(`/usuarios/${id_usuario}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });

  if (resp.ok) {
    mostrarModal('Dados atualizados com sucesso!', 'Sucesso');
    setTimeout(() => window.location.reload(), 1500);
  } else {
    mostrarModal('Erro ao atualizar dados.', 'Erro');
  }
}

document.addEventListener('DOMContentLoaded', carregarDadosUsuario);
document.getElementById('form-editar-usuario').addEventListener('submit', atualizarUsuario);