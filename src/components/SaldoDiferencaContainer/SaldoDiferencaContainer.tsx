import { useEffect, useState } from "react";
import axios from "axios";
import { GrMoney } from "react-icons/gr";

interface EntradasSaidasData {
  valor: string;
}

const SaldoDiferencaContainer: React.FC = () => {
  const [entradas, setEntradas] = useState<number | null>(null);
  const [saidas, setSaidas] = useState<number | null>(null);
  const [diferenca, setDiferenca] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const nomeBanco = localStorage.getItem("nome_banco");
        const chave = localStorage.getItem("codigo_verificacao");

        if (!nomeBanco || !chave) {
          throw new Error(
            "Nome do banco ou chave de verificação não encontrados no localStorage.",
          );
        }

        // Buscar entradas e saídas simultaneamente
        const [entradasResponse, saidasResponse] = await Promise.all([
          axios.get<EntradasSaidasData[]>("/api/entradas", {
            headers: {
              "x-verificacao-chave": chave,
              "x-nome-banco": nomeBanco,
            },
          }),
          axios.get<EntradasSaidasData[]>("/api/saidas", {
            headers: {
              "x-verificacao-chave": chave,
              "x-nome-banco": nomeBanco,
            },
          }),
        ]);

        if (entradasResponse.status !== 200 || saidasResponse.status !== 200) {
          throw new Error("Erro ao buscar entradas ou saídas.");
        }

        const entradasData = entradasResponse.data;
        const saidasData = saidasResponse.data;

        // Soma as entradas
        const totalEntradas = entradasData.reduce((acc, entrada) => {
          const valorNumerico = parseFloat(
            entrada.valor.replace(/[^\d.-]/g, ""),
          );
          return acc + valorNumerico;
        }, 0);

        // Soma as saídas
        const totalSaidas = saidasData.reduce((acc, saida) => {
          const valorNumerico = parseFloat(saida.valor.replace(/[^\d.-]/g, ""));
          return acc + valorNumerico;
        }, 0);

        // Calcula a diferença entre entradas e saídas
        const diferencaCalculada = totalEntradas - totalSaidas;

        setEntradas(totalEntradas);
        setSaidas(totalSaidas);
        setDiferenca(diferencaCalculada);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    };

    fetchDados();
  }, []);

  return (
    <div className="rounded-lg bg-blue-50 p-6 shadow-md">
      <h2 className="mb-4 mt-4 flex items-center justify-start space-x-2 text-lg font-bold">
        <GrMoney size={45} className="text-blue-500" /> {/* Ícone */}
        <span className="text-blue-500">Saldo Atual</span>
      </h2>
      <div className="flex flex-col items-center justify-center space-y-4">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : diferenca !== null ? (
          <p className="flex items-center text-2xl font-semibold text-blue-600">
            <span>R$</span>
            <span>
              {diferenca.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </p>
        ) : (
          <p className="text-gray-500">Carregando...</p>
        )}
      </div>
      <div className="mt-6 flex justify-between text-sm text-gray-700">
        <span className="text-green-500">
          Entradas: R${" "}
          {entradas?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
        <span className="text-red-500">
          Saídas: R${" "}
          {saidas?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};

export default SaldoDiferencaContainer;
