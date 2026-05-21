let esgotado = 0;
let critico = 0;
let estavel = 0;

window.onload = () => {
    fetch('http://localhost:3000/products')
        .then(response => response.json())
        .then(produtos => {
            createDoughnutChart(produtos); //criar gráfico
            tabelaGeral(produtos); //carregar tabela
            document.getElementById('padrao-dropdown').innerHTML = 'Situação Geral' + `<i class="bi bi-caret-down-fill"></i>`;
            
            //barra de pesquisa
            const ul = document.getElementById('listaProdutos');
            produtos.forEach((item) =>{
                const li = document.createElement("li");
                li.innerHTML = `<a href="#" id="produto-list" data-nome="${item.name}">
                                <span class="item-name">${item.name}</span>
                            </a>`;
                ul.appendChild(li);
            })

            //caso clique no botão para pesquisar
            document.getElementById('form-pesquisa').addEventListener('submit', function(event) {
                tabelaPorPesquisa(event, produtos);
            });

            //caso a pessoa selecione o produto na sugestão de pesquisa
            ul.querySelectorAll('a').forEach(link =>{
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    const nomeProduto = link.getAttribute('data-nome');
                    mostrarEstoqueElemento(produtos, nomeProduto);
                    ul.style.display = 'none';
                    document.getElementById('barra-pesquisa').value = nomeProduto;
                });
            });
            
            //seleção de filtro ao clicar em cada opção
            let statusEstoque;
            document.getElementById('estavel').onclick = () => {
                statusEstoque = 'estavel';
                document.getElementById('padrao-dropdown').innerHTML = 'Estável' + `<i class="bi bi-caret-down-fill"></i>`;
                filtrarPorSelecao(produtos, statusEstoque);
            }
            document.getElementById('critico').onclick = () => {
                statusEstoque = 'critico';
                document.getElementById('padrao-dropdown').innerHTML = 'Crítico' + `<i class="bi bi-caret-down-fill"></i>`;
                filtrarPorSelecao(produtos, statusEstoque);
            }
            document.getElementById('esgotado').onclick = () => {
                statusEstoque = 'esgotado';
                document.getElementById('padrao-dropdown').innerHTML = 'Esgotado' + `<i class="bi bi-caret-down-fill"></i>`;
                filtrarPorSelecao(produtos, statusEstoque);
            }
            document.getElementById('geral').onclick = () => {
                document.getElementById('padrao-dropdown').innerHTML = 'Situação Geral' + `<i class="bi bi-caret-down-fill"></i>`;
                tabelaGeral(produtos);
            }
        })
        .catch(error => {
            alert('Erro ao carregar os dados do servidor:' + error.message);
        })
}

//gráfico
function createDoughnutChart(produtos) {

    produtos.forEach(produto => {
        const estoque = parseInt(produto.stock);
        if (estoque === 0) {
            esgotado++;
        }
        else if (estoque <= 10) {
            critico++;
        } else {
            estavel++;
        }
    });

    const ctx = document.getElementById('graficoEstoque');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Esgotado', 'Crítico', 'Estável'],
            datasets: [{
                data: [esgotado, critico, estavel],
                backgroundColor: [
                    'rgba(255, 41, 41, 0.6)',
                    'rgba(241, 238, 3, 0.6)',
                    'rgba(2, 235, 2, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 41, 41, 0.6)',
                    'rgba(241, 238, 3, 0.6)',
                    'rgba(2, 235, 2, 0.6)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

//filtro por clique
function filtrarPorSelecao(produtos, statusEstoque) {
        let txtHTMLTabela = `<table class="tabela-estoque border border-dark rounded">
                    <tr class="border border-dark">
                        <th>Quantidade</th>
                        <th>Produto</th>
                        <th>Status</th>
                    </tr>`;
        //para estoque estável, monta a tabela
        if (statusEstoque == 'estavel') {
            for (let i = 0; i < produtos.length; i++) {
                if (produtos[i].stock > 10) {
                    let statusGeral = 'Estável';
                    txtHTMLTabela += `<tr>
                        <td>${produtos[i].stock}</td>
                        <td>${produtos[i].name}</td>
                        <td class="texto-estavel">${statusGeral}</td>
                    </tr>`
                }
            }

        //para o estoque critico, monta a tabela    
        } else if (statusEstoque == 'critico') {
            for (let i = 0; i < produtos.length; i++) {
                if (produtos[i].stock > 0 && produtos[i].stock <= 10) {
                    let statusGeral = 'Renovar Estoque';
                    txtHTMLTabela += `<tr>
                        <td>${produtos[i].stock}</td>
                        <td>${produtos[i].name}</td>
                        <td class="texto-critico">${statusGeral}</td>
                    </tr>`
                }
            }

        //para o estoque esgotado, monta a tabela    
        } else if (statusEstoque == 'esgotado') {
            for (let i = 0; i < produtos.length; i++) {
                if (produtos[i].stock == 0) {
                    let statusGeral = 'Esgotado';
                    txtHTMLTabela += `<tr>
                        <td>${produtos[i].stock}</td>
                        <td>${produtos[i].name}</td>
                        <td class="texto-esgotado">${statusGeral}</td>
                    </tr>`
                }
            }
        }

        txtHTMLTabela += `</table>`
        document.getElementById('tabela').innerHTML = txtHTMLTabela;
}

//tabela geral
function tabelaGeral(produtos) {
    let txtHTMLTabela = `<table class="tabela-estoque border border-dark rounded">
                    <tr class="border border-dark">
                        <th>Quantidade</th>
                        <th>Produto</th>
                        <th>Status</th>
                    </tr>`;
    //monta primeiro os esgotados
    for (let i = 0; i < produtos.length; i++) {
        if (produtos[i].stock == 0) {
            let statusGeral = 'Esgotado'
            txtHTMLTabela += `<tr>
                        <td>${produtos[i].stock}</td>
                        <td>${produtos[i].name}</td>
                        <td class="texto-esgotado">${statusGeral}</td>
                    </tr>`
        }
    }

    //monta depois os criticos
    for (let i = 0; i < produtos.length; i++) {
        if (produtos[i].stock <= 10 && produtos[i].stock > 0) {
            let statusGeral = 'Renovar Estoque';
            txtHTMLTabela += `<tr>
                <td>${produtos[i].stock}</td>
                <td>${produtos[i].name}</td>
                <td class="texto-critico">${statusGeral}</td>
            </tr>`
        }
    }

    //monta final com estáveis
    for (let i = 0; i < produtos.length; i++) {
        if (produtos[i].stock > 10) {
            let statusGeral = 'Estável';
            txtHTMLTabela += `<tr>
                <td>${produtos[i].stock}</td>
                <td>${produtos[i].name}</td>
                <td class="texto-estavel">${statusGeral}</td>
            </tr>`
        }
    }

    //finaliza a tabela
    txtHTMLTabela += `</table>`
    //tabela é montada dentro da div de id tabela
    document.getElementById('tabela').innerHTML = txtHTMLTabela;
}

//filtrar na pesquisa
function filtrarPesquisa(){
    var input, filter, ul, li, a, i, txtValue, count = 0, span;

    //elementos html
    input = document.getElementById('barra-pesquisa');
    ul = document.getElementById('listaProdutos');

    //filtro
    filter = input.value.toUpperCase();

    if (filter === "") {
        ul.style.display = "none";
        return;
    }

    //pegar li's da lista
    li = ul.getElementsByTagName("li");

    //percorrer todos os li's
    for(i = 0; i < li.length; i++){
        a = li[i].getElementsByTagName("a")[0];
        txtValue = a.textContent || a.innerText;
        //verifica se o que foi digitado combina com o conteúdo de a
        if(txtValue.toUpperCase().indexOf(filter) > -1){
            li[i].style.display = "";
            count++;
            span = li[i].querySelector('.item-name');
            //se tiver item na lista
            if(span){
                span.innerHTML = txtValue.replace(new RegExp(filter, "gi"),(match) =>{
                    return "<strong>" + match + "</strong>";
                })
            //se não tiver
            }else{
                li[i].style.display = "none";
            }    
        }else {
            li[i].style.display = "none";
        }
    }
    //verificar se tem itens na lista
    if(count === 0){
        ul.style.display = "none";
    }else{
        ul.style.display = "block";
    }
}

//mostra na tabela a informação do produto que for selecionado
function mostrarEstoqueElemento(produtos, nomeProduto){
    let txtHTMLTabela = `<table class="tabela-estoque border border-dark rounded">
                            <tr class="border border-dark">
                                <th>Quantidade</th>
                                <th>Produto</th>
                                <th>Status</th>
                            </tr>`;
    const produto = produtos.find(p => p.name === nomeProduto);

    if(produto){
        let statusGeral = '';
        let classe = '';
        let estoque = parseInt(produto.stock);

        if (estoque === 0) {
            statusGeral = 'Esgotado';
            classe = 'texto-esgotado';
        } else if (estoque <= 10 && estoque > 0) {
            statusGeral = 'Renovar Estoque';
            classe = 'texto-critico';
        } else{
            statusGeral = 'Estável';
            classe = 'texto-estavel';
        }

        txtHTMLTabela += `<tr>
        <td>${estoque}</td>
        <td>${produto.name}</td>
        <td class="${classe}">${statusGeral}</td>
    </tr>`;
    }

    txtHTMLTabela += `</table>`;
    document.getElementById('tabela').innerHTML = txtHTMLTabela;
}

//montar tabela a partir de palavra digitada no input
function tabelaPorPesquisa(event, produtos) {
    event.preventDefault();

    const chave = document.getElementById('barra-pesquisa').value.toUpperCase();

    let txtHTMLTabela = `<table class="tabela-estoque border border-dark rounded">
                            <tr class="border border-dark">
                                <th>Quantidade</th>
                                <th>Produto</th>
                                <th>Status</th>
                            </tr>`;

    let encontrou = false;

    produtos.forEach(produto => {
        if (produto.name.toUpperCase().includes(chave)) {
            encontrou = true;
            let statusGeral = '';
            let classe = '';
            const estoque = parseInt(produto.stock);

            if (estoque === 0) {
                statusGeral = 'Esgotado';
                classe = 'texto-esgotado';
            } else if (estoque <= 10) {
                statusGeral = 'Renovar Estoque';
                classe = 'texto-critico';
            } else {
                statusGeral = 'Estável';
                classe = 'texto-estavel';
            }

            txtHTMLTabela += `<tr>
                                <td>${estoque}</td>
                                <td>${produto.name}</td>
                                <td class="${classe}">${statusGeral}</td>
                              </tr>`;
        }
    });

    txtHTMLTabela += `</table>`;

    if (!encontrou) {
        txtHTMLTabela = "<p>Nenhum produto encontrado.</p>";
    }

    document.getElementById('tabela').innerHTML = txtHTMLTabela;
}