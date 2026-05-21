function formatarData(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('T')[0].split('-');
  // Se quiser mostrar hora e minuto:
  let horaMin = '';
  if (dataISO.includes('T')) {
    const [h, m] = dataISO.split('T')[1].split(':');
    horaMin = ` ${h}:${m}`;
  }
  return `${dia}/${mes}/${ano}${horaMin}`;
}

function getIdLoja() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function buscarLoja(id) {
  const res = await fetch(`http://localhost:3000/lojas`);
  const lojas = await res.json();
  return lojas.find(l => String(l.id) === String(id));
}

async function buscarPedidosPorLoja(idLoja) {
  const res = await fetch(`http://localhost:3000/pedidos?lojaId=${idLoja}`);
  const pedidos = await res.json();
  return pedidos;
}

async function buscarUsuario(id) {
  const res = await fetch(`http://localhost:3000/usuarios?id=${id}`);
  const usuarios = await res.json();
  return usuarios;
}

async function renderPedidos() {
  const idLoja = getIdLoja();
  if (!idLoja) {
    document.getElementById('empty-msg').innerText = 'ID da loja não informado na URL.';
    document.getElementById('empty-msg').style.display = 'block';
    return;
  }

  const loja = await buscarLoja(idLoja);
  if (!loja) {
    document.getElementById('empty-msg').innerText = 'Loja não encontrada.';
    document.getElementById('empty-msg').style.display = 'block';
    return;
  }

  document.getElementById('loja-info').innerHTML = `<strong>Loja:</strong> ${loja.nome}`;

  const pedidos = await buscarPedidosPorLoja(idLoja);

  if (!pedidos.length) {
    document.getElementById('pedidos-table').style.display = 'none';
    document.getElementById('empty-msg').style.display = 'block';
    return;
  }

  document.getElementById('pedidos-table').style.display = '';
  document.getElementById('empty-msg').style.display = 'none';

  const tbody = document.getElementById('pedidos-body');
  tbody.innerHTML = '';

  for (const pedido of pedidos) {
    const status = pedido.status || 'pendente';
    let statusClass = 'pendente';
    if (status === 'concluido') statusClass = 'concluido';
    else if (status === 'em_andamento') statusClass = 'em_andamento';
    else if (status === 'entregue') statusClass = 'concluido';
    else if (status === 'cancelado') statusClass = 'cancelado';

    tbody.innerHTML += `
      <tr>
        <td>${pedido.id}</td>
        <td>Nome Protegido</td>
        <td>${formatarData(pedido.data_venda)}</td>
        <td><span class="status ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</span></td>
        <td>R$ ${Number(pedido.valor_total || 0).toFixed(2)}</td>
        <td>
          <a href="/modulos/chat/vendedor/index.html?id=${pedido.id}" class="chat-btn" title="Abrir chat">
            💬 Chat
          </a>
        </td>
      </tr>
    `;
  }
}

window.addEventListener('DOMContentLoaded', renderPedidos);