import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { getClientConnection } from "../../../lib/db"; // Função para conectar ao banco de dados do cliente
import { RowDataPacket } from "mysql2";

interface Usuario extends RowDataPacket {
  email: string;
  nome: string;
  senha: string; // A senha deve ser retornada para comparação
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Verifica se o método da requisição é POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: `Método ${req.method} não permitido` });
  }

  // Extrai os dados do corpo da requisição
  const { email, senha, nome_banco } = req.body;

  // Verifica se todos os campos obrigatórios estão presentes
  if (!email || !senha || !nome_banco) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  try {
    // Conectar ao banco de dados do cliente usando o nome_banco
    const clientConnection = await getClientConnection(nome_banco);

    if (!clientConnection) {
      return res
        .status(500)
        .json({ error: "Erro ao conectar ao banco de dados do cliente" });
    }

    // Consulta SQL para verificar o usuário no banco de dados
    const userSql = "SELECT email, nome, senha FROM usuarios WHERE email = ?";
    const [userRows] = await clientConnection.execute<Usuario[]>(userSql, [
      email,
    ]);

    // Verifica se o usuário foi encontrado
    if (userRows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const user = userRows[0];

    // Verifica se a senha fornecida é válida comparando com a senha hashada no banco
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Se as credenciais forem válidas, retorna o usuário autenticado
    return res.status(200).json({
      message: "Login realizado com sucesso!",
      usuario: {
        email: user.email,
        nome: user.nome,
      },
    });
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
