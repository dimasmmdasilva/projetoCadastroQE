import express from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";
import clientesRouter from "./routes/clientes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Rota de teste
app.get("/health", (req, res) => {
  res.json({ status: "API funcionando" });
});

app.use("/clientes", clientesRouter);

// Porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
