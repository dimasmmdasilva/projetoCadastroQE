-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS cadastro_clientes
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- Usar o banco criado
USE cadastro_clientes;

-- Criar a tabela de clientes
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

-- Criar índices para melhorar busca
CREATE INDEX idx_nome ON clientes (Nome);
CREATE INDEX idx_cidade ON clientes (Cidade);
CREATE INDEX idx_cep ON clientes (CEP);
CREATE INDEX idx_codigo ON clientes (Codigo);