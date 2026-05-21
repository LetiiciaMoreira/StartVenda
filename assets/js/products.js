const API_URL = "http://localhost:3000/products";
let editId = null;
let lojaEditando = null;
let estoqueChart = null;

const form = document.getElementById("productForm");
const tabela = document.getElementById("productTable");
const inputImage = document.getElementById("url_image");

let base64Image = "";

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof getUsuarioAutenticadoSeguro !== "function") {
    alert("Função de autenticação não encontrada. Verifique se autenticar.js está incluído.");
    return;
  }
  const usuarioId = await getUsuarioAutenticadoSeguro();
  if (!usuarioId) {
    document.body.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger" role="alert">
          Erro: Usuário não autenticado.<br>
          Faça login para acessar esta página.
        </div>
      </div>
    `;
    return;
  }

  const lojaId = getQueryParam("id_loja");
  if (!lojaId) {
    document.body.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger" role="alert">
          Erro: Nenhum <strong>id_loja</strong> informado na URL.<br>
          Exemplo de uso: <code>?id_loja=1</code>
        </div>
      </div>
    `;
    throw new Error("id_loja não informado na URL");
  }

  const lojaResp = await fetch(`http://localhost:3000/lojas/${lojaId}`);
  if (!lojaResp.ok) {
    document.body.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger" role="alert">
          Erro: Loja não encontrada.
        </div>
      </div>
    `;
    return;
  }
  const loja = await lojaResp.json();
  if (loja.id_usuario != usuarioId) {
    document.body.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger" role="alert">
          Erro: Você não tem permissão para acessar esta loja.
        </div>
      </div>
    `;
    return;
  }

  window.lojaId = lojaId;
  loadProducts();
});

inputImage.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) {
    base64Image = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = function (event) {
    base64Image = event.target.result;
  };
  reader.readAsDataURL(file);
});

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const product = {
    name: form.name.value,
    price: form.price.value,
    stock: form.stock.value,
    category_id: form.category_id.value,
    id_loja: window.lojaId,
    description: form.description.value || "",
    images: base64Image || "",
    updated_at: new Date().toISOString(),
  };

  if (!editId) {
    product.created_at = new Date().toISOString();
  }

  if (editId) {
    await fetch(`${API_URL}/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    editId = null;
    lojaEditando = null;
  } else {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
  }

  form.reset();
  base64Image = "";
  loadProducts();
});

async function loadProducts() {
  const resposta = await fetch(API_URL);
  let products = await resposta.json();
  products = products.filter(
    (product) => product.deleted_at == null && product.id_loja == window.lojaId
  );
  const tabela = document.getElementById("productTable");
  const productView = document.getElementById("productView");
  tabela.innerHTML = "";

  if (window.viewMode === "table") {
    productView.innerHTML = `
      <div class="table-responsive rounded-4 shadow-sm bg-white">
        <table class="table align-middle table-hover table-bordered mb-0" style="border-radius:18px; overflow:hidden;">
          <colgroup>
            <col style="width: 80px;">
            <col style="width: 18%;">
            <col style="width: 12%;">
            <col style="width: 13%;">
            <col style="width: 10%;">
            <col style="width: 27%;">
            <col style="width: 10%;">
          </colgroup>
          <thead style="background: linear-gradient(135deg, #7F4E9D, #FF6B6B); color: #fff;">
            <tr>
              <th scope="col" class="text-center">Imagem</th>
              <th scope="col">Nome</th>
              <th scope="col">Preço</th>
              <th scope="col">Categoria</th>
              <th scope="col">Estoque</th>
              <th scope="col">Descrição</th>
              <th scope="col" class="text-center">Ações</th>
            </tr>
          </thead>
          <tbody id="productTable"></tbody>
        </table>
      </div>
    `;
    const tbody = document.getElementById("productTable");
    products.forEach((product) => {
      tbody.innerHTML += `
        <tr>
          <td class="text-center align-middle">
            ${product.images ? `<img src="${product.images}" alt="${product.name}" style="width:48px; height:48px; object-fit:cover; border-radius:10px; border:2px solid #eee;">` : `<span class="text-muted">-</span>`}
          </td>
          <td class="fw-semibold align-middle" style="color:#7F4E9D; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.name}</td>
          <td class="fw-bold text-primary align-middle">R$ ${Number(product.price).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</td>
          <td class="align-middle"><span class="badge" style="background:linear-gradient(135deg, #7F4E9D 60%, #FF6B6B 100%); color:#fff;">${CATEGORY[product.category_id] || ""}</span></td>
          <td class="align-middle">${product.stock}</td>
          <td class="text-muted align-middle" style="max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.description || ""}</td>
          <td class="text-center align-middle">
            <button class="btn btn-warning btn-sm me-1" onclick="editProduct('${product.id}')" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product.id}')" title="Excluir">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
  } else {
    productView.innerHTML = `<div class="row" id="productTable"></div>`;
    const tabela = document.getElementById("productTable");
    products.forEach((product) => {
      tabela.innerHTML += `
        <div class="col-md-4 mb-4 product-card">
          <div class="card h-100 shadow-sm">
            ${product.images ? `<img src="${product.images}" class="card-img-top" alt="${product.name}">` : ''}
            <div class="card-body">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text fw-bold text-primary">
                R$ ${Number(product.price).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p class="card-text"><span class="badge bg-secondary">${CATEGORY[product.category_id] || ""}</span></p>
              <p class="card-text text-muted mb-2">${product.description || ""}</p>
              <p class="card-text"><small>Estoque: ${product.stock}</small></p>
              <div class="d-flex gap-2 mt-2">
                <button class="btn btn-warning btn-sm flex-fill" onclick="editProduct('${product.id}')">
                  <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-danger btn-sm flex-fill" onclick="deleteProduct('${product.id}')">
                  <i class="bi bi-trash"></i> Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }
}

async function editProduct(id) {
  const resposta = await fetch(`${API_URL}/${id}`);
  const loja = await resposta.json();

  form.name.value = loja.name;
  form.price.value = loja.price;
  form.stock.value = loja.stock;
  form.category_id.value = loja.category_id;
  form.description.value = loja.description;

  editId = id;
  lojaEditando = loja;
  base64Image = loja.images || "";

  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteProduct(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });
  loadProducts();
}

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

const CATEGORY = {
  1: "Eletrônicos",
  2: "Moda",
  3: "Casa",
  4: "Esportes",
  5: "Beleza",
  6: "Livros",
};

document.getElementById("btnLimpar").addEventListener("click", () => {
  form.reset();
  base64Image = "";
  editId = null;
  lojaEditando = null;
});

document.getElementById("btnGerarDescricao").addEventListener("click", async () => {
  const nome = form.name.value;
  const categoria = CATEGORY[form.category_id.value] || "";
  const preco = form.price.value;
  const estoque = form.stock.value;

  if (!nome) {
    alert("Preencha o nome do produto para gerar a descrição.");
    return;
  }

  const prompt = `Crie uma descrição detalhada, envolvente e persuasiva para um produto chamado "${nome}" da categoria "${categoria}".`;

  document.getElementById("btnGerarDescricao").disabled = true;
  document.getElementById("btnGerarDescricao").innerHTML = '<span class="spinner-border spinner-border-sm"></span> Gerando...';

  try {
    const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer SUA_API_KEY"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Você é um especialista em marketing de produtos." },
          { role: "user", content: prompt }
        ],
        max_tokens: 120,
        temperature: 0.7
      })
    });

    if (!resposta.ok) {
      throw new Error("Erro ao gerar descrição com IA.");
    }

    const data = await resposta.json();
    const descricao = data.choices?.[0]?.message?.content?.trim() || "";
    form.description.value = descricao;
  } catch (err) {
    alert("Erro ao gerar descrição: " + err.message);
  } finally {
    document.getElementById("btnGerarDescricao").disabled = false;
    document.getElementById("btnGerarDescricao").innerHTML = '<i class="bi bi-magic"></i> Gerar com IA';
  }
});
