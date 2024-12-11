import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";
import { RowDataPacket } from "mysql2";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido." });
  }

  const { "x-verificacao-chave": chave, "x-nome-banco": nomeBanco } =
    req.headers;
  const { dataInicial, dataFinal } = req.query;

  if (!chave || !nomeBanco || !dataInicial || !dataFinal) {
    return res.status(400).json({ message: "Dados incompletos." });
  }

  try {
    const adminConnection = await getClientConnection("admin_db");
    const [result] = await adminConnection.query<RowDataPacket[]>(
      `SELECT nome_banco FROM clientes WHERE codigo_verificacao = ?`,
      [chave],
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Chave inválida." });
    }

    if (result[0].nome_banco !== nomeBanco) {
      return res.status(400).json({ message: "Nome do banco inválido." });
    }

    const clientConnection = await getClientConnection(nomeBanco);

    const [rows] = await clientConnection.query<RowDataPacket[]>(
      `
      SELECT DATE(data) as dia, SUM(valor) as total
      FROM saida
      WHERE DATE(data) BETWEEN ? AND ?
      GROUP BY DATE(data)
      ORDER BY dia ASC;
      `,
      [dataInicial, dataFinal],
    );

    adminConnection.release();
    clientConnection.release();

    const categorias = rows.map((row) => row.dia); // Pode-se formatar a data se necessário
    const valores = rows.map((row) => row.total);

    return res.status(200).json({ categorias, valores });
  } catch (error) {
    console.error("Erro ao buscar dados de saídas para o gráfico:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
}
