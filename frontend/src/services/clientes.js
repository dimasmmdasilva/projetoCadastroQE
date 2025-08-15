import http from "./http";

// CRUD clientes
export const listarClientes = (params) => http.get("/clientes", { params });
export const obterCliente = (id) => http.get(`/clientes/${id}`);
export const criarCliente = (data) => http.post("/clientes", data);
export const atualizarCliente = (id, data) => http.put(`/clientes/${id}`, data);
export const excluirCliente = (id) => http.delete(`/clientes/${id}`);

// ViaCep
export const viaCep = async (cep) => {
  const c = String(cep || "").replace(/\D/g, "");
  if (c.length !== 8) return null;
  const resp = await fetch(`https://viacep.com.br/ws/${c}/json/`);
  const d = await resp.json();
  if (d?.erro) return null;
  return {
    Logradouro: d.logradouro || "",
    Bairro: d.bairro || "",
    Cidade: d.localidade || "",
    UF: d.uf || "",
    Complemento: d.complemento || "",
  };
};
