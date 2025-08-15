
# Cadastro e Busca de Clientes

Este projeto foi desenvolvido e configurado para rodar **totalmente em ambiente local**, utilizando **MySQL** como banco de dados, **Node.js/Express** no backend e **Vue.js** no frontend.

## Estrutura Geral
- **Frontend**: Aplicação SPA desenvolvida com Vue.js, responsável pela interface gráfica e interações do usuário.
- **Backend**: API REST construída com Node.js e Express, responsável pelo processamento de requisições, comunicação com o banco de dados e regras de negócio.
- **Banco de Dados**: Servidor MySQL local para armazenamento de dados de clientes.

---

## Configuração do Banco de Dados (MySQL)

1. Instalar o MySQL Server localmente.
2. Criar o banco e a tabela utilizando o script abaixo:

```sql
CREATE DATABASE IF NOT EXISTS cadastro_clientes
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE cadastro_clientes;

CREATE TABLE clientes (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Nome VARCHAR(255) NOT NULL,
    CPF_CNPJ VARCHAR(20),
    CEP CHAR(8),
    Logradouro VARCHAR(255),
    Endereco VARCHAR(255),
    Numero VARCHAR(20),
    Bairro VARCHAR(100),
    Cidade VARCHAR(100),
    UF CHAR(2),
    Complemento VARCHAR(255),
    Fone VARCHAR(20),
    LimiteCredito DECIMAL(15,2) DEFAULT 0,
    Validade DATE,
    DataCadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_nome ON clientes (Nome);
CREATE INDEX idx_cidade ON clientes (Cidade);
CREATE INDEX idx_cep ON clientes (CEP);
CREATE INDEX idx_codigo ON clientes (Codigo);
```

3. No arquivo de configuração do backend (`config/db.js`), informar os dados de conexão do banco:

```javascript
module.exports = {
    host: 'localhost',
    user: 'root',        // usuário local
    password: '',        // senha definida no MySQL local
    database: 'cadastro_clientes'
};
```

---

## Configuração do Backend (Node.js + Express)

1. Instalar as dependências:
```bash
npm install
```
2. O backend contém rotas para:
   - Criar clientes (`POST /clientes`)
   - Listar clientes (`GET /clientes`)
   - Buscar clientes por filtros (`GET /clientes?nome=...`)
   - Editar clientes (`PUT /clientes/:id`)
   - Excluir clientes (`DELETE /clientes/:id`)
3. Rodar o servidor backend:
```bash
npm start
```
   Por padrão, o servidor escuta na porta **3000**.

---

## Configuração do Frontend (Vue.js)

1. Criar o projeto Vue.js (já incluído no repositório).
2. Instalar dependências:
```bash
npm install
```
3. O frontend se comunica com o backend via **axios** e exibe:
   - Formulário de cadastro de clientes
   - Lista de clientes com filtros e paginação
   - Ações de editar e excluir clientes
4. Rodar o servidor de desenvolvimento:
```bash
npm run dev
```
   O frontend roda por padrão na porta **5173**.

---

## Resumo do Fluxo

- O **frontend** envia os dados do formulário para a API via `axios`.
- O **backend** processa a requisição, interage com o **MySQL** e retorna a resposta.
- O **MySQL** armazena os dados de forma persistente.
- Toda a configuração e execução foi feita **localmente**, sem uso de servidores externos.
