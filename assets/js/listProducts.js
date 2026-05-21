document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURAÇÕES ---
  const API_BASE_URL = "http://localhost:3000";
  const ID_LOJA_ATUAL = "1"; // Quando for feito a integraçao
  // das telas isso sera responsivo com a loja visulizada no moemnto

  // --- VARIÁVEIS DE ESTADO ---
  let allProducts = [];
  let store = "";

  // --- ELEMENTOS DO DOM ---
  const productGrid = document.getElementById("product-grid");
  const productCount = document.getElementById("product-count");
  const categoryFilter = document.getElementById("category-filter");
  const sortFilter = document.getElementById("sort-order");
  const priceFilter = document.getElementById("price-filter");
  const applyFiltersBtn = document.getElementById("apply-filters-btn");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");

  const CATEGORY_MAP = {
    1: "Eletrônicos",
    2: "Moda",
    3: "Casa",
    4: "Esportes",
    5: "Beleza",
    6: "Livros",
  };

  // --- FUNÇÕES ---

  async function fetchProducts(idLoja) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products?id_loja=${idLoja}`
      );
      if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error("Falha ao buscar produtos:", error);
      productCount.textContent = "Erro ao carregar produtos.";
      return [];
    }
  }

  function populateCategoryFilter(products) {
    const categories = [...new Set(products.map((p) => p.category_id))];

    categories.forEach((categoryId) => {
      const option = document.createElement("option");
      option.value = categoryId;

      option.textContent =
        CATEGORY_MAP[categoryId] || `Categoria ${categoryId}`;
      categoryFilter.appendChild(option);
    });
  }

  function renderProducts(products) {
    productGrid.innerHTML = "";
    productCount.textContent = `Foi encontrado ${products.length} pedido(s)`;

    if (products.length === 0) {
      productGrid.innerHTML =
        "<p>Nenhum produto encontrado com os filtros selecionados.</p>";
      return;
    }

    products.forEach((product) => {
      const card = document.createElement("div");
      card.className = "product-card";
      const shortDescription =
        product.description.length > 80
          ? product.description.substring(0, 80) + "..."
          : product.description;
      const formattedPrice = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(product.price);

      card.innerHTML = `
                <img src="${product.images}" alt="${product.name}" class="product-image">
                <h4 class="product-name">${product.name}</h4>
                <p class="product-price">${formattedPrice}</p>
                <p class="product-description">${shortDescription}</p>
            `;
      productGrid.appendChild(card);
    });
  }

  function applyFilters() {
    const selectedCategory = categoryFilter.value;
    const maxPrice = parseFloat(priceFilter.value);
    const order = sortFilter.value;

    let filteredProducts = [...allProducts];

    if (selectedCategory !== "all") {
      filteredProducts = filteredProducts.filter(
        (product) => product.category_id === selectedCategory
      );
    }

    if (!isNaN(maxPrice) && maxPrice > 0) {
      filteredProducts = filteredProducts.filter(
        (product) => parseFloat(product.price) <= maxPrice
      );
    }

    switch (order) {
      case "price-asc":
        filteredProducts.sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price)
        );
        break;
      case "price-desc":
        filteredProducts.sort(
          (a, b) => parseFloat(b.price) - parseFloat(a.price)
        );
        break;
      case "name-asc":
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    renderProducts(filteredProducts);
  }

  function clearFilters() {
    categoryFilter.value = "all";
    priceFilter.value = "";
    renderProducts(allProducts);
  }

  // --- EXECUÇÃO INICIAL ---
  async function initialize() {
    allProducts = await fetchProducts(ID_LOJA_ATUAL);
    populateCategoryFilter(allProducts);
    renderProducts(allProducts);

    applyFiltersBtn.addEventListener("click", applyFilters);
    clearFiltersBtn.addEventListener("click", clearFilters);
  }

  initialize();
});
