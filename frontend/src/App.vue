<template>
  <main class="page">
    <h1>Cadastro e Busca de Clientes</h1>

    <!-- Filtros -->
    <section class="card">
      <h2>Filtros</h2>
      <div class="grid">
        <label>
          Código
          <input v-model="filtros.codigo" @keyup.enter="carregar" />
        </label>
        <label>
          Nome
          <input v-model="filtros.nome" @keyup.enter="carregar" />
        </label>
        <label>
          Cidade
          <input v-model="filtros.cidade" @keyup.enter="carregar" />
        </label>
        <label>
          CEP
          <input
            :class="{ invalid: cepFiltroMsg }"
            :value="cepFiltroDisplay"
            @input="onCepFiltroInput"
            @keyup.enter="carregar"
            placeholder="00000-000"
          />
          <small v-if="cepFiltroMsg" class="hint">{{ cepFiltroMsg }}</small>
        </label>
      </div>
      <div class="actions">
        <button @click="carregar">Pesquisar</button>
        <button class="ghost" @click="limparFiltros">Limpar</button>
      </div>
    </section>

    <!-- Formulário -->
    <section class="card">
      <h2>{{ form.ID ? "Editar" : "Novo" }} cliente</h2>

      <div class="grid">
        <label>
          Nome
          <input v-model="form.Nome" />
        </label>

        <label>
          CPF/CNPJ
          <input v-model="form.CPF_CNPJ" />
        </label>

        <label>
          CEP
          <input
            :class="{ invalid: cepMsg }"
            :value="cepDisplay"
            @input="onCepInput"
            @blur="onCepBlur"
            placeholder="00000-000"
          />
          <small v-if="cepMsg" class="hint">{{ cepMsg }}</small>
        </label>

        <label>
          UF
          <input v-model="form.UF" maxlength="2" />
        </label>

        <label>
          Cidade
          <input v-model="form.Cidade" />
        </label>

        <label>
          Bairro
          <input v-model="form.Bairro" />
        </label>

        <label class="col-2">
          Logradouro
          <input v-model="form.Logradouro" />
        </label>

        <label class="col-2">
          Endereço
          <input v-model="form.Endereco" />
        </label>

        <label>
          Número
          <input v-model="form.Numero" />
        </label>

        <label class="col-3">
          Complemento
          <input v-model="form.Complemento" />
        </label>

        <label>
          Fone
          <input v-model="form.Fone" />
        </label>

        <label>
          Limite Crédito
          <input
            v-model.number="form.LimiteCredito"
            type="number"
            step="0.01"
          />
        </label>

        <label>
          Validade
          <input v-model="form.Validade" type="date" />
        </label>
      </div>

      <div class="actions">
        <button @click="salvar" :disabled="salvando">
          {{ salvando ? "Salvando..." : "Salvar" }}
        </button>
        <button class="ghost" @click="cancelar">Cancelar</button>
        <button class="ghost" @click="limparFormulario">Limpar</button>
      </div>
      <p v-if="erro" class="error">{{ erro }}</p>
      <p v-if="ok" class="ok">{{ ok }}</p>
    </section>

    <!-- Lista -->
    <section class="card">
      <div class="header">
        <h2>Clientes</h2>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th style="width: 80px">ID</th>
            <th>Código</th>
            <th>Nome</th>
            <th>Cidade</th>
            <th style="width: 130px">CEP</th>
            <th style="width: 170px">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in clientes" :key="c.ID">
            <td>{{ c.ID }}</td>
            <td>{{ c.Codigo }}</td>
            <td>{{ c.Nome }}</td>
            <td>{{ c.Cidade }}</td>
            <td>{{ formatCepList(c.CEP) }}</td>
            <td>
              <button class="small" @click="editar(c)">Editar</button>
              <button class="small danger" @click="remover(c)">Excluir</button>
            </td>
          </tr>
          <tr v-if="!clientes.length">
            <td colspan="6" class="empty">Nenhum registro</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from "vue";
import {
  listarClientes,
  criarCliente,
  atualizarCliente,
  excluirCliente,
  viaCep,
} from "./services/clientes";

/* estado */
const clientes = ref([]);
const carregando = ref(false);
const salvando = ref(false);
const erro = ref("");
const ok = ref("");

/* filtros */
const filtros = reactive({ codigo: "", nome: "", cidade: "", cep: "" });
const cepFiltroDisplay = ref("");
const cepFiltroMsg = ref("");

/* formulário */
const formVazio = {
  ID: null,
  Codigo: "", // gerado no backend
  Nome: "",
  CPF_CNPJ: "",
  CEP: "",
  Logradouro: "",
  Endereco: "",
  Numero: "",
  Bairro: "",
  Cidade: "",
  UF: "",
  Complemento: "",
  Fone: "",
  LimiteCredito: 0,
  Validade: "", // pode ser vazio; backend aceita
};
const form = reactive({ ...formVazio });

/* CEP formulário */
const cepDisplay = ref("");
const cepMsg = ref("");

/* utils */
function maskCep(v) {
  const d = (v ?? "").toString().replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return d.slice(0, 5) + "-" + d.slice(5);
}
function onlyDigits(v) {
  return (v ?? "").toString().replace(/\D/g, "");
}
function toYYYYMMDD(v) {
  if (!v) return "";
  const s = v.toString();
  if (s.includes("/")) {
    const [dd, mm, yyyy] = s.split("/");
    if (dd && mm && yyyy)
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return s;
}
function toast(msg, tipo = "ok") {
  erro.value = tipo === "erro" ? msg : "";
  ok.value = tipo === "ok" ? msg : "";
  setTimeout(() => {
    erro.value = "";
    ok.value = "";
  }, 2500);
}

/* CEP filtros */
function onCepFiltroInput(e) {
  const masked = maskCep(e.target.value);
  cepFiltroDisplay.value = masked;
  filtros.cep = onlyDigits(masked);
  cepFiltroMsg.value =
    filtros.cep && filtros.cep.length !== 8 ? "CEP deve ter 8 dígitos" : "";
}

/* CEP formulário */
function onCepInput(e) {
  const masked = maskCep(e.target.value);
  cepDisplay.value = masked;
  form.CEP = onlyDigits(masked); // mantém string de 8 dígitos
  cepMsg.value =
    form.CEP && form.CEP.length !== 8 ? "CEP deve ter 8 dígitos" : "";
}
async function onCepBlur() {
  if (!form.CEP) return;
  if (form.CEP.length !== 8) {
    cepMsg.value = "CEP deve ter 8 dígitos";
    return;
  }
  const dados = await viaCep(form.CEP);
  if (!dados) return;
  form.Logradouro = dados.Logradouro;
  form.Bairro = dados.Bairro;
  form.Cidade = dados.Cidade;
  form.UF = dados.UF;
}

/* carregar lista */
async function carregar() {
  carregando.value = true;
  try {
    const { data } = await listarClientes({
      codigo: filtros.codigo || undefined,
      nome: filtros.nome || undefined,
      cidade: filtros.cidade || undefined,
      cep: filtros.cep || undefined,
    });
    clientes.value = data;
  } catch {
    toast("Falha ao carregar", "erro");
  } finally {
    carregando.value = false;
  }
}
function limparFiltros() {
  filtros.codigo = "";
  filtros.nome = "";
  filtros.cidade = "";
  filtros.cep = "";
  cepFiltroDisplay.value = "";
  cepFiltroMsg.value = "";
  carregar();
}

/* validações amigáveis */
function validarFormulario() {
  const problemas = [];
  if (!form.Nome?.trim()) problemas.push("Nome");
  if (!form.CEP || form.CEP.length !== 8) problemas.push("CEP (8 dígitos)");
  if (!form.Cidade?.trim()) problemas.push("Cidade");
  if (!form.UF || form.UF.toString().trim().length !== 2)
    problemas.push("UF (2 letras)");

  if (problemas.length) {
    toast(`Preencha corretamente: ${problemas.join(", ")}.`, "erro");
    return false;
  }
  return true;
}

/* ações formulário */
function limparFormulario() {
  Object.assign(form, { ...formVazio });
  cepDisplay.value = "";
  cepMsg.value = "";
}
function cancelar() {
  limparFormulario();
}
function editar(c) {
  Object.assign(form, { ...formVazio, ...c });
  cepDisplay.value = maskCep(c.CEP);
  if (form.Validade && String(form.Validade).length > 10) {
    form.Validade = String(form.Validade).slice(0, 10);
  }
}
async function remover(c) {
  if (!confirm(`Excluir cliente ${c.Nome}?`)) return;
  try {
    await excluirCliente(c.ID);
    toast("Excluído");
    carregar();
    if (form.ID === c.ID) limparFormulario();
  } catch {
    toast("Falha ao excluir", "erro");
  }
}

async function salvar() {
  if (!validarFormulario()) return;

  salvando.value = true;
  try {
    const payload = { ...form };

    // CEP como string de 8 dígitos (sem converter para número)
    payload.CEP = onlyDigits(cepDisplay.value || payload.CEP);

    // UF duas letras, maiúsculas
    payload.UF = (payload.UF ?? "").toString().trim().toUpperCase().slice(0, 2);

    // LimiteCredito: número quando preenchido; vazio vira ""
    if (payload.LimiteCredito !== "" && payload.LimiteCredito != null) {
      payload.LimiteCredito = Number(
        payload.LimiteCredito.toString().replace(".", "").replace(",", ".")
      );
    } else {
      payload.LimiteCredito = "";
    }

    // Validade: mantém string vazia ou YYYY-MM-DD
    payload.Validade = toYYYYMMDD(payload.Validade);

    if (form.ID) {
      await atualizarCliente(form.ID, payload);
      toast("Atualizado");
    } else {
      await criarCliente(payload);
      toast("Criado");
    }
    await carregar();
    limparFormulario();
  } catch (e) {
    const msg =
      e?.response?.data?.message ||
      (Array.isArray(e?.response?.data?.errors)
        ? e.response.data.errors.map((x) => x.msg).join(" | ")
        : "") ||
      "Falha ao salvar";
    toast(msg, "erro");
    console.error(e);
  } finally {
    salvando.value = false;
  }
}

/* helpers */
function formatCepList(v) {
  const d = onlyDigits(v);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/* UF sempre maiúscula */
watch(
  () => form.UF,
  (v) => {
    if (!v) return;
    const up = v.toString().toUpperCase().slice(0, 2);
    if (up !== v) form.UF = up;
  }
);

onMounted(carregar);
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");

:root {
  --bg: #f4f6fb;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #6b7280;
  --accent: #3b82f6;
  --danger: #ef4444;
  --ok: #16a34a;
  --border: #e5e7eb;
  --input: #f8fafc;
}

* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: "Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial,
    sans-serif;
  font-size: 16px;
  line-height: 1.35;
}
.page {
  max-width: 1100px;
  margin: 28px auto;
  padding: 0 16px;
}
h1 {
  margin: 0 0 18px 0;
  font-size: 28px;
  font-weight: 600;
}
h2 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: var(--muted);
  font-weight: 600;
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.grid .col-2 {
  grid-column: span 2;
}
.grid .col-3 {
  grid-column: span 3;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}
input {
  background: var(--input);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 11px 12px;
  border-radius: 10px;
  outline: none;
  font-size: 15px;
}
input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
}
input.invalid {
  border-color: var(--danger);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
}

.hint {
  color: var(--danger);
  margin-top: 4px;
  font-size: 12px;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}
button {
  background: var(--accent);
  border: none;
  color: white;
  padding: 10px 15px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
}
button.ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}
button.small {
  padding: 6px 10px;
  font-size: 13px;
}
button.danger {
  background: var(--danger);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  border-bottom: 1px solid var(--border);
  padding: 11px 10px;
  text-align: left;
  font-size: 15px;
}
.table th {
  color: var(--muted);
  font-weight: 600;
}
.table .empty {
  color: var(--muted);
  text-align: center;
  padding: 18px;
}

.error {
  color: var(--danger);
  margin-top: 10px;
  font-weight: 500;
}
.ok {
  color: var(--ok);
  margin-top: 10px;
  font-weight: 500;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
  .grid .col-2,
  .grid .col-3 {
    grid-column: span 2;
  }
}
</style>
