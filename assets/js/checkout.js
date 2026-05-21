document.addEventListener('DOMContentLoaded', async () => {
  const usuarioId = await getUsuarioAutenticadoSeguro();
    if (!usuarioId) {
        alert('Você precisa estar logado para acessar essa página.');
        window.location.href = "../../modulos/login/login.html";
        return;
    }

  const tabela = document.querySelector('#tabela-carrinho tbody');
  const valorTotal = document.getElementById('valor-total');
  const mensagemFinalizacao = document.getElementById('mensagem-finalizacao');
  let total = 0;

  const [carrinho, produtos] = await Promise.all([
    fetch(`http://localhost:3000/carrinho?usuarioId=${usuarioId}`).then(r => r.json()),
    fetch(`http://localhost:3000/products`).then(r => r.json())
  ]);

  const produtosPorLoja = {};
  for (const item of carrinho) {
    const produto = produtos.find(p => p.id === item.produtoId);
    if (produto) {
      const lojaId = produto.lojaId || produto.id_loja;
      if (!produtosPorLoja[lojaId]) produtosPorLoja[lojaId] = [];
      produtosPorLoja[lojaId].push({
        ...produto,
        quantidade: item.quantidade,
        subtotal: (produto.price * item.quantidade),
        carrinhoId: item.id
      });
    }
  }

  const produtosCarrinho = [];
  for (const item of carrinho) {
    const produto = produtos.find(p => p.id === item.produtoId);
    if (produto) {
      produtosCarrinho.push({
        ...produto,
        quantidade: item.quantidade,
        subtotal: (produto.price * item.quantidade)
      });
      total += produto.price * item.quantidade;
    }
  }

  tabela.innerHTML = produtosCarrinho.map(prod => `
    <tr>
      <td>
        <div class="d-flex align-items-center">
          <img src="${prod.images || '../../assets/images/no-image.png'}" alt="${prod.name}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-right:12px;">
          <span>${prod.name}</span>
        </div>
      </td>
      <td>R$ ${Number(prod.price).toFixed(2)}</td>
      <td>${prod.quantidade}</td>
      <td>R$ ${(Number(prod.price)*prod.quantidade).toFixed(2)}</td>
    </tr>
  `).join('');
  valorTotal.textContent = 'R$ ' + total.toFixed(2);

  document.getElementById('btn-finalizar-checkout').onclick = async () => {
    for (const lojaId in produtosPorLoja) {
      const produtosCarrinho = produtosPorLoja[lojaId];
      if (!produtosCarrinho.length) continue;

      const produtosIds = [];
      let total = 0;
      produtosCarrinho.forEach(p => {
        for (let i = 0; i < p.quantidade; i++) produtosIds.push(p.id);
        total += p.price * p.quantidade;
      });

      const dadosDoPedido = {
        usuarioId,
        produtosId: produtosIds,
        valor_total: total,
        metodo_pagamento: 'Dinheiro',
        status: 'pendente',
        data_venda: new Date().toISOString().slice(0, 10),
        lojaId: lojaId
      };

      const resPedido = await fetch('http://localhost:3000/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosDoPedido)
      });
      const novoPedido = await resPedido.json();
      console.log('Pedido criado:', novoPedido);

      const idsUnicos = [...new Set(novoPedido.produtosId)];
      const produtosRes = await fetch(`http://localhost:3000/products?${idsUnicos.map(id => `id=${id}`).join('&')}`);
      const produtosInfo = await produtosRes.json();

      const quantidades = {};
      novoPedido.produtosId.forEach(id => {
        quantidades[id] = (quantidades[id] || 0) + 1;
      });

      const produtosTexto = produtosInfo.map(prod => 
        `• ${prod.name || prod.nome || 'Produto'} x${quantidades[prod.id] || 1}`
      ).join('\n');

      const mensagemVendedor = {
          remetente: "vendedor",
          texto: `[MENSAGEM AUTOMÁTICA] Olá! Recebemos seu pedido com os seguintes produtos:\n${produtosTexto}`,
          data: new Date().toISOString()
      };

      await fetch('http://localhost:3000/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              pedidoId: novoPedido.id,
              mensagens: [mensagemVendedor]
          })
      });

      for (const item of produtosCarrinho) {
        await fetch(`http://localhost:3000/carrinho/${item.carrinhoId}`, { method: 'DELETE' });
      }
    }

    document.getElementById('success-overlay').classList.remove('d-none');
    setTimeout(() => {
      window.location.href = "../minhas_compras/minhas_compras.html";
    }, 2200);
  };
});