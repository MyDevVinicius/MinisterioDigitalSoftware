import { NextApiRequest, NextApiResponse } from "next";
import { getAdminConnection, getClientConnection } from "../../../lib/db"; // Verifique se essas funções estão corretas no seu projeto
import { RowDataPacket } from "mysql2";

interface Cliente extends RowDataPacket {
  nome_banco: string;
  nome_igreja: string; // Adicionando nome_igreja
  status: string; // Adicionado para capturar o status
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Garantir que a requisição seja do tipo POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ error: `Método ${req.method} não permitido` });
  }

  const { codigo_verificacao } = req.body;

  // Verificar se o código de verificação foi enviado
  if (!codigo_verificacao) {
    return res
      .status(400)
      .json({ error: "Código de verificação é necessário" });
  }

  try {
    // Conexão com o banco de dados admin para verificar o código de verificação
    const connection = await getAdminConnection();

    // Consultar o banco de dados de administração para verificar o código e o status
    const sql =
      "SELECT nome_banco, nome_igreja, status FROM clientes WHERE codigo_verificacao = ?";
    const [rows] = await connection.execute<Cliente[]>(sql, [
      codigo_verificacao,
    ]);

    // Verificar se o código de verificação é válido
    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    const cliente = rows[0];
    const nome_banco = cliente.nome_banco;
    const nome_igreja = cliente.nome_igreja; // Recuperando o nome_igreja
    const status = cliente.status;

    // Verificar o status do cliente (se está ativo, bloqueado, etc.)
    if (status !== "ativo") {
      return res.status(403).json({
        error: "Cliente está Bloqueado ! Entrar em contato com suporte",
      });
    }

    // Verificar se o banco de dados do cliente está associado corretamente
    if (!nome_banco) {
      return res
        .status(404)
        .json({ error: "Banco de dados não associado ao cliente" });
    }

    // Conectar ao banco de dados específico do cliente usando a função getClientConnection
    const clientConnection = await getClientConnection(nome_banco);

    // Verificar se a conexão com o banco do cliente foi bem-sucedida
    if (!clientConnection) {
      return res
        .status(500)
        .json({ error: "Erro ao conectar ao banco do cliente" });
    }

    // Retornar a resposta de sucesso com informações do cliente
    return res.status(200).json({
      message: "Cliente autenticado com sucesso",
      nome_banco,
      nome_igreja, // Incluindo nome_igreja na resposta
      codigo_verificacao,
      status, // Inclui o status na resposta
    });
  } catch (error: any) {
    console.error("Erro na autenticação do cliente:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
