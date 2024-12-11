import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { banco, clienteId } = req.query;

  // Validação dos parâmetros
  if (!banco || typeof banco !== "string") {
    return res.status(400).json({ message: "Banco de dados não fornecido." });
  }

  if (!clienteId || typeof clienteId !== "string") {
    return res.status(400).json({ message: "ID do cliente não fornecido." });
  }

  try {
    // Obtendo a conexão com o banco de dados do cliente
    const clientConnection = await getClientConnection(banco);

    if (req.method === "GET") {
      // Consultar o status do cliente
      const [rows] = await clientConnection.query(
        "SELECT status FROM clientes WHERE id = ?",
        [clienteId]
      );
      clientConnection.release();

      if (rows.length === 0) {
        return res.status(404).json({ message: "Cliente não encontrado." });
      }

      const status = rows[0].status;

      // Retornar o status do cliente
      return res.status(200).json({ status });
    }

    clientConnection.release();
    return res.status(405).json({ message: "Método não permitido." });
  } catch (error) {
    console.error("Erro ao buscar status do cliente:", error);
    return res
      .status(500)
      .json({ message: "Erro ao buscar status do cliente." });
  }
}
