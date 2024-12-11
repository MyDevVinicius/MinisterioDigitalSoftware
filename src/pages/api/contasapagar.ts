import { NextApiRequest, NextApiResponse } from "next";
import { getAdminConnection, getClientConnection } from "../../../lib/db";
import { RowDataPacket } from "mysql2";

// Função para buscar as contas a pagar no banco de dados do cliente
const getContasAPagar = async (
  nomeBanco: string,
  status?: string,
): Promise<RowDataPacket[]> => {
  let sql =
    "SELECT id, observacao, valor, valor_pago, status, data_vencimento FROM contas_a_pagar";
  const values: any[] = [];

  if (status && status !== "Todos") {
    sql += " WHERE status = ?";
    values.push(status);
  }

  sql += " ORDER BY data_vencimento ASC";

  try {
    const clientConnection = await getClientConnection(nomeBanco);
    const [rows] = await clientConnection.query<RowDataPacket[]>(sql, values);
    clientConnection.release();
    return rows;
  } catch (error: any) {
    console.error("Erro ao buscar contas a pagar:", error);
    throw new Error("Erro ao buscar contas a pagar");
  }
};

const atualizarStatusContas = (contas: RowDataPacket[]): RowDataPacket[] => {
  const today = new Date();

  return contas.map(
    (conta: RowDataPacket & { data_vencimento: string; status: string }) => {
      const vencimento = new Date(conta.data_vencimento);
      if (
        vencimento < today &&
        conta.status !== "Pago" &&
        conta.status !== "Pago Parcial"
      ) {
        conta.status = "Vencida";
      } else if (
        vencimento >= today &&
        conta.status !== "Pago" &&
        conta.status !== "Pago Parcial"
      ) {
        conta.status = "Pendente";
      }
      return conta;
    },
  );
};

// Handler para a API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { chave, status } = req.query;

    if (!chave || typeof chave !== "string") {
      return res
        .status(400)
        .json({ message: "Chave de verificação inválida." });
    }

    const adminConnection = await getAdminConnection();
    const [result] = await adminConnection.query<RowDataPacket[]>(
      "SELECT nome_banco FROM clientes WHERE codigo_verificacao = ?",
      [chave],
    );
    adminConnection.release();

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "Chave de verificação inválida." });
    }

    const nomeBanco = result[0].nome_banco as string;

    let contas = await getContasAPagar(nomeBanco, status as string);
    contas = atualizarStatusContas(contas);

    res.status(200).json({ message: "Sucesso", data: contas });
  } catch (error: any) {
    console.error("Erro ao processar a API de contas a pagar:", error);
    res.status(500).json({
      message: "Erro ao processar contas a pagar",
      error: error.message || "Erro desconhecido",
    });
  }
}
