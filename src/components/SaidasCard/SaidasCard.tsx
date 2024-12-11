import { useEffect, useState } from "react";
import axios from "axios";
import { MdOutlineMoneyOff } from "react-icons/md";

interface SaidasData {
  valor: string;
  data: string; // Supondo que a data das saídas esteja nesse formato
}

const SaidasContainer: React.FC = () => {
  const [saidas, setSaidas] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Função para obter o mês e ano atuais
  const getMesAnoAtual = () => {
    const hoje = new Date();
    const mes = hoje.getMonth() + 1; // Mês atual (0-indexed, então somamos 1)
    const ano = hoje.getFullYear();
    return { mes, ano };
  };

  useEffect(() => {
    const fetchSaidas = async () => {
      try {
        // Obtém o nome do banco e a chave do localStorage
        const nomeBanco = localStorage.getItem("nome_banco");
        const chave = localStorage.getItem("codigo_verificacao");

        if (!nomeBanco || !chave) {
          throw new Error(
            "Nome do banco ou chave de verificação não encontrados no localStorage.",
          );
        }

        // Obtém o mês e ano atuais
        const { mes, ano } = getMesAnoAtual();

        // Requisição para a API com os parâmetros de mês e ano
        const response = await axios.get<SaidasData[]>("/api/saidas", {
          headers: {
            "x-verificacao-chave": chave,
            "x-nome-banco": nomeBanco,
            "x-mes": mes.toString(), // Mês atual
            "x-ano": ano.toString(), // Ano atual
          },
        });

        if (response.status !== 200) {
          throw new Error(response.data.message || "Erro ao buscar saídas.");
        }

        const data = response.data;
        console.log("Dados de saídas recebidos:", data);

        // Soma os valores das saídas
        const total = data.reduce((acc, saida) => {
          // Converte cada valor para número, removendo qualquer caractere indesejado como "R$"
          const valorNumerico = parseFloat(saida.valor.replace(/[^\d.-]/g, ""));
          return acc + valorNumerico;
        }, 0);

        setSaidas(total);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    };

    fetchSaidas();
  }, []); // O array de dependências vazio faz com que o fetch seja executado apenas uma vez

  return (
    <div className="rounded-lg bg-red-50 p-6 shadow-md">
      <h2 className="mb-4 mt-4 flex items-center justify-start space-x-2 text-lg font-bold">
        <MdOutlineMoneyOff size={45} className="text-red-500" /> {/* Ícone */}
        <span className="text-red-500">Saídas</span> {/* Texto */}
      </h2>
      <div className="flex flex-col items-center justify-center space-y-4">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : saidas !== null ? (
          <p className="flex items-center text-2xl font-semibold text-red-600">
            <span>R$</span>
            <span>
              {saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </p>
        ) : (
          <p className="text-gray-500">Carregando...</p>
        )}
      </div>
    </div>
  );
};

export default SaidasContainer;
