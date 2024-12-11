import { useEffect, useState } from "react";
import axios from "axios";
import { FaUsers } from "react-icons/fa"; // Ícone de usuários

const QuantidadeMembrosCard: React.FC = () => {
  const [quantidadeMembros, setQuantidadeMembros] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuantidadeMembros = async () => {
      try {
        const nomeBanco = localStorage.getItem("nome_banco");
        const chave = localStorage.getItem("codigo_verificacao");

        if (!nomeBanco || !chave) {
          throw new Error(
            "Nome do banco ou chave de verificação não encontrados no localStorage.",
          );
        }

        const response = await axios.get("/api/membros", {
          headers: {
            "x-verificacao-chave": chave,
            "x-nome-banco": nomeBanco,
          },
        });

        if (response.status === 200) {
          // Se a resposta da API for válida, definimos a quantidade de membros
          setQuantidadeMembros(response.data.quantidade || 0);
        } else {
          throw new Error("Erro ao buscar quantidade de membros.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        // Caso haja erro, a quantidade de membros será 0
        setQuantidadeMembros(0);
      }
    };

    fetchQuantidadeMembros();
  }, []); // Executa uma vez na montagem do componente

  return (
    <div className="rounded-lg bg-purple-50 p-6 shadow-md">
      <h2 className="mb-4 mt-4 flex items-center justify-start space-x-2 text-lg font-bold">
        <FaUsers size={40} className="text-purple-500" /> {/* Ícone */}
        <span className="text-purple-500">Membros Cadastrados</span>
      </h2>
      <div className="flex flex-col space-y-4">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-purple-500">{quantidadeMembros}</span>{" "}
            {/* Exibe a quantidade de membros */}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuantidadeMembrosCard;
