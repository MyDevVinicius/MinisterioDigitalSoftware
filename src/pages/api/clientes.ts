import { NextApiRequest, NextApiResponse } from "next";
import { getAdminConnection, getClientConnection } from "../../../lib/db"; // Verifique se essas funções estão corretas no seu projeto
import { RowDataPacket } from "mysql2";

interface Cliente extends RowDataPacket {
  nome_banco: string;
  nome_igreja: string;
  status: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ error: `Método ${req.method} não permitido` });
  }

  const { codigo_verificacao } = req.body;

  if (!codigo_verificacao) {
    return res
      .status(400)
      .json({ error: "Código de verificação é necessário" });
  }

  try {
    const connection = await getAdminConnection();

    const sql =
      "SELECT nome_banco, nome_igreja, status FROM clientes WHERE codigo_verificacao = ?";
    const [rows] = await connection.execute<Cliente[]>(sql, [
      codigo_verificacao,
    ]);

    connection.release(); // Liberar a conexão com o banco de dados admin

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    const cliente = rows[0];
    const { nome_banco, nome_igreja, status } = cliente;

    if (status !== "ativo") {
      return res.status(403).json({
        error: "Cliente está Bloqueado! Entrar em contato com suporte",
      });
    }

    if (!nome_banco) {
      return res
        .status(404)
        .json({ error: "Banco de dados não associado ao cliente" });
    }

    const clientConnection = await getClientConnection(nome_banco);

    if (!clientConnection) {
      return res
        .status(500)
        .json({ error: "Erro ao conectar ao banco do cliente" });
    }

    clientConnection.release(); // Liberar a conexão com o banco de dados do cliente

    return res.status(200).json({
      message: "Cliente autenticado com sucesso",
      nome_banco,
      nome_igreja,
      codigo_verificacao,
      status,
    });
  } catch (error: any) {
    console.error("Erro na autenticação do cliente:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
