import { Router } from "express";
import { pool } from "../db.js";
import { body, validationResult } from "express-validator";

const router = Router();

// util: monta SET dinâmico para UPDATE
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

/* GET /clientes  (filtros: codigo, nome, cidade, cep; ordenado por ID desc) */
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
      params.push(Number(cep));
    }

    sql += " ORDER BY ID DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/* GET /clientes/:id  (detalhe) */
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

/* POST /clientes  (inclusão) */
router.post(
  "/",
  [
    body("Codigo").notEmpty().isLength({ max: 15 }),
    body("Nome").notEmpty().isLength({ max: 150 }),
    body("UF").optional().isLength({ max: 2 }),
    body("CEP").optional().isInt(),
    body("LimiteCredito").optional().isFloat(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
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
      const valores = campos.map((c) => req.body[c] ?? null);

      const sql = `
        INSERT INTO clientes
        (idUsuario, Codigo, Nome, CPF_CNPJ, CEP, Logradouro, Endereco, Numero,
         Bairro, Cidade, UF, Complemento, Fone, LimiteCredito, Validade)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      const [result] = await pool.query(sql, valores);

      const [novo] = await pool.query("SELECT * FROM clientes WHERE ID = ?", [
        result.insertId,
      ]);
      res.status(201).json(novo[0]);
    } catch (err) {
      next(err);
    }
  }
);

/* PUT /clientes/:id  (atualização parcial) */
router.put(
  "/:id",
  [
    body("Codigo").optional().isLength({ max: 15 }),
    body("Nome").optional().isLength({ max: 150 }),
    body("UF").optional().isLength({ max: 2 }),
    body("CEP").optional().isInt(),
    body("LimiteCredito").optional().isFloat(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { sets, params } = buildUpdateSet(req.body);
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
  }
);

/* DELETE /clientes/:id  (deleção) */
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
