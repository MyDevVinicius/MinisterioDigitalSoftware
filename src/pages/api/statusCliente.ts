import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection, getAdminConnection } from "../../../lib/db";
import { RowDataPacket, FieldPacket } from "mysql2";

// Interface para tipar a resposta do banco de dados
interface ClienteStatus extends RowDataPacket {
  status: string;
}

const fetchClientStatus = async (connection: any, clienteId: string) => {
  const [rows]: [ClienteStatus[], FieldPacket[]] = await connection.query(
    "SELECT status FROM clientes WHERE id = ?",
    [clienteId],
  );

  if (rows.length === 0) {
    console.log(`Cliente não encontrado no banco com ID: ${clienteId}`);
    return null; // Se não encontrar, retornar null
  }

  return rows[0]?.status || "não definido";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { banco, clienteId } = req.query as {
    banco: string;
    clienteId: string;
  };

  // Validação dos parâmetros da requisição
  if (!banco || typeof banco !== "string") {
    return res
      .status(400)
      .json({ message: "Banco de dados não fornecido ou inválido." });
  }

  if (!clienteId || typeof clienteId !== "string") {
    return res
      .status(400)
      .json({ message: "ID do cliente não fornecido ou inválido." });
  }

  let adminConnection = null;
  let clientConnection = null;

  try {
    // Conectar ao banco administrativo
    adminConnection = await getAdminConnection();
    console.log("Conectado ao banco administrativo.");

    // Buscar status do cliente no banco administrativo
    const adminStatus = await fetchClientStatus(adminConnection, clienteId);

    console.log("Status do cliente no banco administrativo:", adminStatus);

    // Verifica se o cliente está ativo
    if (adminStatus === null) {
      return res.status(404).json({
        message: "Cliente não encontrado no banco administrativo.",
      });
    }

    if (adminStatus !== "ativo") {
      console.log(
        `Status do cliente inativo. Status retornado: ${adminStatus}`,
      );
      return res.status(403).json({
        message: `O cliente está inativo. Acesso bloqueado. Status do cliente: ${adminStatus}`,
      });
    }

    // Conectar ao banco do cliente
    clientConnection = await getClientConnection(banco);
    if (!clientConnection) {
      console.error("Falha na conexão com o banco do cliente:", banco);
      return res.status(500).json({
        message: "Erro ao conectar ao banco de dados do cliente.",
      });
    }

    console.log("Conectado ao banco do cliente:", banco);

    // Se a requisição for GET, validar o status do cliente no banco
    if (req.method === "GET") {
      // Buscar o status do cliente no banco do cliente
      const clientStatus = await fetchClientStatus(clientConnection, clienteId);
      console.log("Status no banco do cliente:", clientStatus);

      if (clientStatus === "não definido") {
        return res.status(404).json({
          message: "Cliente não encontrado no banco do cliente.",
        });
      }

      // Retorna o status do cliente, indicando que o cliente foi autenticado corretamente
      return res.status(200).json({
        message: "Cliente autenticado com sucesso!",
        status: clientStatus, // Informando que o status está ativo
      });
    }

    // Método não permitido
    return res
      .status(405)
      .json({ message: `Método ${req.method} não permitido.` });
  } catch (error: any) {
    console.error("Erro ao buscar status do cliente:", error.message);
    return res
      .status(500)
      .json({ message: "Erro interno ao buscar status do cliente." });
  } finally {
    // Liberar as conexões de banco
    if (adminConnection) await adminConnection.end();
    if (clientConnection) await clientConnection.end();
  }
}
