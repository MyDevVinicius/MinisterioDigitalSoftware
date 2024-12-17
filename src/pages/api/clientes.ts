import { NextApiRequest, NextApiResponse } from "next";
import { getAdminConnection, getClientConnection } from "../../../lib/db";
import { RowDataPacket } from "mysql2";

// Definindo a tipagem para o cliente
interface Cliente extends RowDataPacket {
  nome_banco: string;
  nome_igreja: string;
  status: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Verifica se o método da requisição é POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      error: `Método ${req.method} não permitido. Apenas POST é aceito.`,
    });
  }

  // Desestrutura o código de verificação da requisição
  const { codigo_verificacao } = req.body;

  // Valida se o código de verificação foi fornecido
  if (!codigo_verificacao) {
    return res
      .status(400)
      .json({ error: "Código de verificação é necessário." });
  }

  // Sanitiza o código de verificação
  const sanitizedCodigo = String(codigo_verificacao).trim();

  let adminConnection;
  let clientConnection;

  try {
    console.log("Iniciando autenticação do cliente...");

    // Conectar ao banco administrativo
    adminConnection = await getAdminConnection();
    console.log("Conexão com o banco administrativo estabelecida.");

    // Buscar cliente no banco administrativo com o código de verificação
    const sql =
      "SELECT nome_banco, nome_igreja, status FROM clientes WHERE codigo_verificacao = ?";
    const [rows] = await adminConnection.execute<Cliente[]>(sql, [
      sanitizedCodigo,
    ]);

    // Verifica se o cliente foi encontrado
    if (rows.length === 0) {
      console.warn("Cliente não encontrado no banco administrativo.");
      return res.status(404).json({ error: "Cliente não encontrado." });
    }

    const cliente = rows[0];
    const { nome_banco, nome_igreja, status } = cliente;

    // Verifica se o cliente está ativo
    if (status !== "ativo") {
      console.warn(`Cliente bloqueado. Status: ${status}`);
      return res.status(403).json({
        error: "Cliente está bloqueado. Entre em contato com o suporte.",
      });
    }

    // Verifica se o banco de dados está associado ao cliente
    if (!nome_banco) {
      console.warn("Banco de dados não associado ao cliente.");
      return res
        .status(404)
        .json({ error: "Banco de dados não associado ao cliente." });
    }

    console.log(`Tentando conexão com o banco do cliente: ${nome_banco}`);

    // Conectar ao banco do cliente
    clientConnection = await getClientConnection(nome_banco);

    // Verifica se a conexão foi estabelecida
    if (!clientConnection) {
      console.error("Erro ao conectar ao banco do cliente.");
      return res
        .status(500)
        .json({ error: "Erro ao conectar ao banco do cliente." });
    }

    console.log("Conexão com o banco do cliente estabelecida.");

    // Retorna sucesso com informações do cliente
    return res.status(200).json({
      message: "Cliente autenticado com sucesso!",
      cliente: {
        nome_banco,
        nome_igreja,
        codigo_verificacao: sanitizedCodigo,
        status,
      },
    });
  } catch (error: any) {
    console.error("Erro na autenticação do cliente:", error.message);
    return res.status(500).json({ error: "Erro interno do servidor." });
  } finally {
    // Libera as conexões com os bancos
    if (adminConnection) {
      console.log("Liberando conexão com o banco administrativo.");
      await adminConnection.end();
    }
    if (clientConnection) {
      console.log("Liberando conexão com o banco do cliente.");
      await clientConnection.end();
    }
  }
}
