import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getClientConnection } from "../../../lib/db";
import { RowDataPacket } from "mysql2";
import { isEmail } from "validator";

// Definindo a tipagem do usuário
interface Usuario extends RowDataPacket {
  email: string;
  nome: string;
  senha: string;
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

  // Desestrutura os campos necessários da requisição
  const { email, senha, nome_banco } = req.body;

  // Verifica se os campos obrigatórios foram fornecidos
  if (!email || !senha || !nome_banco) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  // Valida o formato do email
  if (!isEmail(email)) {
    return res.status(400).json({ error: "Email inválido." });
  }

  let clientConnection;

  try {
    // Estabelece a conexão com o banco de dados do cliente
    clientConnection = await getClientConnection(nome_banco);

    if (!clientConnection) {
      return res
        .status(500)
        .json({ error: "Erro ao conectar ao banco de dados do cliente" });
    }

    // Consulta o banco de dados para encontrar o usuário com o email fornecido
    const userSql = "SELECT email, nome, senha FROM usuarios WHERE email = ?";
    const [userRows] = await clientConnection.execute<Usuario[]>(userSql, [
      email,
    ]);

    // Verifica se o usuário foi encontrado
    if (userRows.length === 0) {
      return res.status(401).json({ error: "Email ou senha inválidos." });
    }

    const user = userRows[0];

    // Verifica se a senha fornecida é válida
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: "Email ou senha inválidos." });
    }

    // Gera o token JWT com as informações do usuário
    const token = jwt.sign(
      { email: user.email, nome: user.nome },
      process.env.JWT_SECRET!, // A chave secreta deve ser armazenada de forma segura
      { expiresIn: "1h" }, // O token expira em 1 hora
    );

    // Retorna o token e as informações do usuário autenticado
    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token,
      usuario: {
        email: user.email,
        nome: user.nome,
      },
    });
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    // Libera a conexão com o banco, se houver
    if (clientConnection) clientConnection.release();
  }
}
