import express from "express";
import morgan from "morgan";
import cors from "cors";

import clientesRouter from "./routes/clientes.js";

const app = express();

// middlewares básicos
app.use(cors());
app.use(express.json()); // garante parse de JSON no body
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({ ok: true, name: "API Cadastro QE" });
});

// rotas
app.use("/clientes", clientesRouter);

// 404 em JSON
app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

// handler de erros SEMPRE em JSON
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Erro interno do servidor",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
