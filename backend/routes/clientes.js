// backend/routes/clientes.js
import { Router } from "express";
import { pool } from "../db.js";
import { body, validationResult } from "express-validator";

const router = Router();

/* utils */
const onlyDigits = (s) => (s == null ? "" : String(s).replace(/\D/g, ""));

function buildUpdateSet(bodyObj) {
  const campos = [
    "idUsuario",
    "Codigo",
    "Nome",
    "CPF_CNPJ",
    "CEP",
    "Logradouro",
    "Endereco",
    "Numero",
    "Bairro",
    "Cidade",
    "UF",
    "Complemento",
    "Fone",
    "LimiteCredito",
    "Validade",
  ];
  const sets = [];
  const params = [];
  for (const c of campos) {
    if (bodyObj[c] !== undefined) {
      sets.push(`${c} = ?`);
      params.push(bodyObj[c]);
    }
  }
  return { sets, params };
}

async function gerarCodigo() {
  const [r] = await pool.query(
    "SELECT LPAD(IFNULL(MAX(ID)+1,1),4,'0') AS seq FROM clientes"
  );
  const seq = r[0]?.seq || "0001";
  const hoje = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `C${hoje}-${seq}`;
}

/* validações comuns */
const postValidations = [
  body("Nome").trim().notEmpty().withMessage("Nome é obrigatório"),
  body("UF")
    .optional()
    .isLength({ max: 2 })
    .withMessage("UF deve ter no máximo 2 letras"),
  body("CEP")
    .optional({ checkFalsy: true })
    .customSanitizer(onlyDigits)
    .isLength({ min: 8, max: 8 })
    .withMessage("CEP deve ter 8 dígitos"),
  body("LimiteCredito")
    .optional({ checkFalsy: true })
    .isFloat()
    .withMessage("Limite de crédito inválido"),
  body("Validade")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Data inválida"),
  // não exigimos Codigo: será gerado se não vier
];

const putValidations = [
  body("UF").optional().isLength({ max: 2 }),
  body("CEP")
    .optional({ checkFalsy: true })
    .customSanitizer(onlyDigits)
    .isLength({ min: 8, max: 8 }),
  body("LimiteCredito").optional({ checkFalsy: true }).isFloat(),
  body("Validade").optional({ checkFalsy: true }).isISO8601(),
];

/* GET /clientes (com filtros opcionais) */
router.get("/", async (req, res, next) => {
  try {
    const { codigo, nome, cidade, cep } = req.query;

    let sql = "SELECT * FROM clientes WHERE 1=1";
    const params = [];

    if (codigo) {
      sql += " AND Codigo = ?";
      params.push(codigo);
    }
    if (nome) {
      sql += " AND Nome LIKE ?";
      params.push(`%${nome}%`);
    }
    if (cidade) {
      sql += " AND Cidade LIKE ?";
      params.push(`%${cidade}%`);
    }
    if (cep) {
      sql += " AND CEP = ?";
      params.push(onlyDigits(cep)); // aceita com ou sem traço
    }

    sql += " ORDER BY ID DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/* GET /clientes/:id */
router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM clientes WHERE ID = ?", [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ message: "Não encontrado" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/* POST /clientes */
router.post("/", postValidations, async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty())
      return res
        .status(400)
        .json({ message: "Dados inválidos", errors: result.array() });

    const payload = { ...req.body };

    // normalizações
    payload.CEP = payload.CEP ? onlyDigits(payload.CEP) : null; // mantém string de 8 dígitos
    if (payload.LimiteCredito !== undefined && payload.LimiteCredito !== "")
      payload.LimiteCredito = Number(payload.LimiteCredito);
    else payload.LimiteCredito = null;

    if (payload.UF != null)
      payload.UF = String(payload.UF).trim().toUpperCase().slice(0, 2);

    // idUsuario padrão para teste, se não vier
    if (payload.idUsuario == null) payload.idUsuario = 1;

    // gerar Codigo se não vier
    if (!payload.Codigo) payload.Codigo = await gerarCodigo();

    const campos = [
      "idUsuario",
      "Codigo",
      "Nome",
      "CPF_CNPJ",
      "CEP",
      "Logradouro",
      "Endereco",
      "Numero",
      "Bairro",
      "Cidade",
      "UF",
      "Complemento",
      "Fone",
      "LimiteCredito",
      "Validade",
    ];
    const valores = campos.map((c) => payload[c] ?? null);

    const sql = `
      INSERT INTO clientes
      (idUsuario, Codigo, Nome, CPF_CNPJ, CEP, Logradouro, Endereco, Numero,
       Bairro, Cidade, UF, Complemento, Fone, LimiteCredito, Validade)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;
    const [ins] = await pool.query(sql, valores);

    const [novo] = await pool.query("SELECT * FROM clientes WHERE ID = ?", [
      ins.insertId,
    ]);
    res.status(201).json(novo[0]);
  } catch (err) {
    next(err);
  }
});

/* PUT /clientes/:id */
router.put("/:id", putValidations, async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty())
      return res
        .status(400)
        .json({ message: "Dados inválidos", errors: result.array() });

    const data = { ...req.body };

    if (data.CEP !== undefined)
      data.CEP = data.CEP ? onlyDigits(data.CEP) : null;
    if (data.LimiteCredito !== undefined && data.LimiteCredito !== "")
      data.LimiteCredito = Number(data.LimiteCredito);

    if (data.UF !== undefined && data.UF != null)
      data.UF = String(data.UF).trim().toUpperCase().slice(0, 2);

    const { sets, params } = buildUpdateSet(data);
    if (!sets.length)
      return res.status(400).json({ message: "Nada para atualizar" });

    params.push(req.params.id);
    await pool.query(
      `UPDATE clientes SET ${sets.join(", ")} WHERE ID = ?`,
      params
    );

    const [atual] = await pool.query("SELECT * FROM clientes WHERE ID = ?", [
      req.params.id,
    ]);
    if (!atual.length)
      return res.status(404).json({ message: "Não encontrado" });
    res.json(atual[0]);
  } catch (err) {
    next(err);
  }
});

/* DELETE /clientes/:id */
router.delete("/:id", async (req, res, next) => {
  try {
    const [r] = await pool.query("DELETE FROM clientes WHERE ID = ?", [
      req.params.id,
    ]);
    if (r.affectedRows === 0)
      return res.status(404).json({ message: "Não encontrado" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
