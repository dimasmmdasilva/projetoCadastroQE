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
            :class="{ invalid: !!cepFiltroMsg }"
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
            :class="{ invalid: !!cepMsg }"
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

        <!-- Validade com 3 inputs (DD/MM/AAAA) -->
        <label class="col-2">
          Validade
          <div class="date-3">
            <input
              v-model="valDia"
              inputmode="numeric"
              pattern="\d*"
              maxlength="2"
              placeholder="DD"
              @input="valDia = num2(valDia, 31)"
            />
            <span>/</span>
            <input
              v-model="valMes"
              inputmode="numeric"
              pattern="\d*"
              maxlength="2"
              placeholder="MM"
              @input="valMes = num2(valMes, 12)"
            />
            <span>/</span>
            <input
              v-model="valAno"
              inputmode="numeric"
              pattern="\d*"
              maxlength="4"
              placeholder="AAAA"
              @input="valAno = num4(valAno)"
            />
          </div>
          <small v-if="valMsg" class="hint">{{ valMsg }}</small>
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
  Codigo: "",
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
  Validade: "",
};
const form = reactive({ ...formVazio });

/* data Validade em 3 inputs */
const valDia = ref("");
const valMes = ref("");
const valAno = ref("");
const valMsg = ref("");

/* CEP formulário */
const cepDisplay = ref("");
const cepMsg = ref("");

/* utils */
function onlyDigits(v) {
  return (v ?? "").toString().replace(/\D/g, "");
}
function maskCep(v) {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 5) return d;
  return d.slice(0, 5) + "-" + d.slice(5);
}
function pad2(n) {
  return n.toString().padStart(2, "0");
}
function num2(v, limit) {
  const d = onlyDigits(v).slice(0, 2);
  if (!d) return "";
  const n = Math.min(parseInt(d, 10) || 0, limit);
  return n ? String(n) : "";
}
function num4(v) {
  return onlyDigits(v).slice(0, 4);
}

/* normaliza para extrair YYYY-MM-DD de Date ou ISO completo */
function normalizeToYMD(v) {
  if (!v) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

/* monta e divide Validade */
function joinValidadeDMY() {
  const d = onlyDigits(valDia.value);
  const m = onlyDigits(valMes.value);
  const y = onlyDigits(valAno.value);
  if (!d && !m && !y) return ""; // opcional
  if (d.length === 0 || m.length === 0 || y.length < 4) return null;
  const dd = pad2(d),
    mm = pad2(m),
    yyyy = y.padStart(4, "0");
  const nd = parseInt(dd, 10),
    nm = parseInt(mm, 10);
  if (nm < 1 || nm > 12 || nd < 1 || nd > 31) return null;
  return `${dd}/${mm}/${yyyy}`;
}
function splitValidadeToDMY(v) {
  valDia.value = "";
  valMes.value = "";
  valAno.value = "";
  if (!v) return;
  const ymd = normalizeToYMD(v); // aceita Date, ISO, YYYY-MM-DD
  if (ymd) {
    const [yyyy, mm, dd] = ymd.split("-");
    valDia.value = dd;
    valMes.value = mm;
    valAno.value = yyyy;
    return;
  }
  const s = String(v);
  const mBr = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (mBr) {
    const [, dd, mm, yyyy] = mBr;
    valDia.value = dd;
    valMes.value = mm;
    valAno.value = yyyy;
  }
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
  const digits = onlyDigits(masked);
  form.CEP = digits; // mantém só dígitos no form
  cepMsg.value = digits && digits.length !== 8 ? "CEP deve ter 8 dígitos" : "";
}
async function onCepBlur() {
  const digits = onlyDigits(cepDisplay.value || form.CEP);
  if (!digits) return;
  if (digits.length !== 8) {
    cepMsg.value = "CEP deve ter 8 dígitos";
    return;
  }
  cepMsg.value = "";
  form.CEP = digits;
  const dados = await viaCep(digits);
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

  const cepDigits = onlyDigits(cepDisplay.value || form.CEP);
  if (cepDigits.length !== 8) problemas.push("CEP (8 dígitos)");
  else {
    form.CEP = cepDigits;
    cepMsg.value = "";
  }

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
  valDia.value = "";
  valMes.value = "";
  valAno.value = "";
  valMsg.value = "";
}
function cancelar() {
  limparFormulario();
}
function editar(c) {
  Object.assign(form, { ...formVazio, ...c });

  // CEP: sincroniza dígitos + máscara e recalcula mensagem
  form.CEP = onlyDigits(c.CEP);
  cepDisplay.value = maskCep(form.CEP);
  cepMsg.value =
    form.CEP && form.CEP.length !== 8 ? "CEP deve ter 8 dígitos" : "";

  // Validade: popula DD/MM/AAAA
  splitValidadeToDMY(c.Validade);
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

  valMsg.value = "";
  const validadeDMY = joinValidadeDMY();
  if (validadeDMY === null) {
    valMsg.value = "Informe dia, mês e ano válidos (DD/MM/AAAA).";
    return;
  }

  salvando.value = true;
  try {
    const payload = { ...form };

    payload.CEP = onlyDigits(cepDisplay.value || payload.CEP);
    payload.UF = (payload.UF ?? "").toString().trim().toUpperCase().slice(0, 2);

    if (payload.LimiteCredito !== "" && payload.LimiteCredito != null) {
      payload.LimiteCredito = Number(
        payload.LimiteCredito.toString().replace(".", "").replace(",", ".")
      );
    } else {
      payload.LimiteCredito = "";
    }

    payload.Validade = validadeDMY ?? "";

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

/* inputs da data (3 campos) */
.date-3 {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1.4fr;
  gap: 6px;
  align-items: center;
}
.date-3 span {
  color: var(--muted);
  text-align: center;
  font-weight: 600;
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
