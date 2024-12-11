import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Ajuste o caminho do db.ts
import { RowDataPacket } from "mysql2";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ message: `Método ${req.method} não permitido.` });
  }

  // Verificar a chave de verificação e nome do banco nos cabeçalhos da requisição
  const chave = req.headers["x-verificacao-chave"];
  const nomeBanco = req.headers["x-nome-banco"]; // Alterando para buscar o nome do banco nos cabeçalhos

  // Verifique se ambos estão presentes
  if (
    !chave ||
    typeof chave !== "string" ||
    !nomeBanco ||
    typeof nomeBanco !== "string"
  ) {
    return res.status(400).json({
      message: "Chave de verificação ou nome do banco não fornecidos.",
    });
  }

  try {
    // Conectar ao banco admin_db para verificar a chave
    const adminConnection = await getClientConnection("admin_db");

    // Verificar nome do banco associado à chave
    const [result] = await adminConnection.query<RowDataPacket[]>(
      "SELECT nome_banco FROM clientes WHERE codigo_verificacao = ?",
      [chave],
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Chave inválida." });
    }

    const databaseName = result[0].nome_banco as string;

    // Verifique se o nome do banco na requisição corresponde ao banco verificado
    if (databaseName !== nomeBanco) {
      return res.status(400).json({ message: "Nome do banco inválido." });
    }

    // Conectar ao banco do cliente
    const clientConnection = await getClientConnection(databaseName);

    // Recuperar os dados do corpo da requisição
    const {
      observacao,
      tipoTransacao,
      tipo,
      formaPagamento,
      valor,
      dataTransacao,
      membroId,
    } = req.body;

    if (
      !observacao ||
      !tipoTransacao ||
      !tipo ||
      !formaPagamento ||
      !valor ||
      !dataTransacao
    ) {
      return res
        .status(400)
        .json({ message: "Dados faltando no corpo da requisição." });
    }

    // Validação para transações de tipo 'Dízimo'
    if (tipoTransacao === "Entrada" && tipo === "Dizimo") {
      if (!membroId) {
        return res.status(400).json({
          message:
            "O ID do membro deve ser fornecido para transações de Dízimo.",
        });
      }

      // Verificar se o membro está ativo
      const membroQuery =
        "SELECT * FROM membros WHERE id = ? AND status = 'ativo'";
      const [membroResult] = await clientConnection.query<RowDataPacket[]>(
        membroQuery,
        [membroId],
      );

      if (membroResult.length === 0) {
        return res
          .status(400)
          .json({ message: "O membro fornecido não está ativo." });
      }
    }

    // Inserir na tabela de entrada ou saída com base no tipo de transação
    let query = "";
    let queryParams: any[] = [];

    if (tipoTransacao === "Entrada") {
      query =
        "INSERT INTO entrada (observacao, tipo, forma_pagamento, valor, data, membro_id) VALUES (?, ?, ?, ?, ?, ?)";
      queryParams = [
        observacao,
        tipo,
        formaPagamento,
        valor,
        dataTransacao,
        membroId || null,
      ]; // Se não for Dízimo, membroId pode ser null
    } else if (tipoTransacao === "Saida") {
      query =
        "INSERT INTO saida (observacao, tipo, forma_pagamento, valor, data) VALUES (?, ?, ?, ?, ?)";
      queryParams = [observacao, tipo, formaPagamento, valor, dataTransacao];
    } else {
      return res.status(400).json({ message: "Tipo de transação inválido." });
    }

    // Executar a inserção no banco
    await clientConnection.query(query, queryParams);

    // Libera as conexões
    adminConnection.release();
    clientConnection.release();

    return res
      .status(201)
      .json({ message: "Entrada/Saída registrada com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao registrar entrada/saída:", error);
    return res.status(500).json({
      message: "Erro interno no servidor.",
    });
  }
}
