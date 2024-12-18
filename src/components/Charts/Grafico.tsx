import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js"; // Importando os módulos necessários
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { pt } from "date-fns/locale";

// Registrar os módulos necessários
ChartJS.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  BarElement,
);

const GraficoEntradasSaidas = ({ altura }: { altura: string | number }) => {
  const [dataInicial, setDataInicial] = useState<Date | null>(null);
  const [dataFinal, setDataFinal] = useState<Date | null>(null);
  const [entradas, setEntradas] = useState<{
    categorias: string[];
    valores: number[];
  } | null>(null);
  const [saidas, setSaidas] = useState<{
    categorias: string[];
    valores: number[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recuperar nome do banco e chave de verificação do localStorage
  const nomeBanco = localStorage.getItem("nome_banco");
  const chave = localStorage.getItem("codigo_verificacao");

  // Recupera as últimas datas do localStorage, se existirem
  useEffect(() => {
    const savedDataInicial = localStorage.getItem("data_inicial");
    const savedDataFinal = localStorage.getItem("data_final");

    if (savedDataInicial && savedDataFinal) {
      setDataInicial(new Date(savedDataInicial));
      setDataFinal(new Date(savedDataFinal));
    }
  }, []);

  const fetchData = async () => {
    if (!dataInicial || !dataFinal) {
      setError("Selecione as datas de início e fim.");
      return;
    }

    if (!nomeBanco || !chave) {
      setError("Nome do banco ou chave de verificação não encontrados.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dataFormatadaInicial = dataInicial.toISOString().split("T")[0];
      const dataFormatadaFinal = dataFinal.toISOString().split("T")[0];

      const [entradasRes, saidasRes] = await Promise.all([
        fetch(
          `/api/entradasgrafico?dataInicial=${dataFormatadaInicial}&dataFinal=${dataFormatadaFinal}`,
          {
            headers: {
              "x-verificacao-chave": chave,
              "x-nome-banco": nomeBanco,
            },
          },
        ),
        fetch(
          `/api/saidasgrafico?dataInicial=${dataFormatadaInicial}&dataFinal=${dataFormatadaFinal}`,
          {
            headers: {
              "x-verificacao-chave": chave,
              "x-nome-banco": nomeBanco,
            },
          },
        ),
      ]);

      if (!entradasRes.ok || !saidasRes.ok) {
        throw new Error("Erro ao buscar dados.");
      }

      const entradasData = await entradasRes.json();
      const saidasData = await saidasRes.json();

      setEntradas(entradasData);
      setSaidas(saidasData);
    } catch (error) {
      setError("Erro ao buscar dados do gráfico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataInicial && dataFinal) {
      fetchData();
    }
  }, [dataInicial, dataFinal]);

  // Salvar as datas no localStorage sempre que elas forem alteradas
  useEffect(() => {
    if (dataInicial && dataFinal) {
      localStorage.setItem("data_inicial", dataInicial.toISOString());
      localStorage.setItem("data_final", dataFinal.toISOString());
    }
  }, [dataInicial, dataFinal]);

  // Formatar as datas para exibição no eixo X
  const formatarDatas = (data: string) => {
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const data = {
    labels:
      entradas?.categorias?.map(formatarDatas) ||
      saidas?.categorias?.map(formatarDatas) ||
      [],
    datasets: [
      {
        label: "Entradas",
        data: entradas?.valores || [],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "Saídas",
        data: saidas?.valores || [],
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Permite ao gráfico preencher toda a largura disponível
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12, // Tamanho menor da caixa de legenda
          padding: 15, // Distância entre o texto da legenda e o ícone
        },
      },
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Datas",
        },
        type: "category",
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10, // Limitar o número de ticks no eixo X
        },
        grid: {
          display: false, // Esconde as linhas de grade do eixo X
        },
        // Garantir que o gráfico ocupe toda a largura, mesmo se não houver dados para todas as datas
        offset: true,
      },
      y: {
        title: {
          display: true,
          text: "Valores (R$)",
        },
        grid: {
          display: true, // Exibe as linhas de grade do eixo Y
        },
        ticks: {
          beginAtZero: true,
        },
      },
    },
  };

  return (
    <div className="overflow-x-auto rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">
          Gráfico de Entradas e Saídas
        </h2>
        <div className="flex items-center space-x-4">
          <div>
            <label className="mb-1 block text-sm text-gray-500">
              Data Inicial:
            </label>
            <DatePicker
              selected={dataInicial}
              onChange={(date) => setDataInicial(date)}
              className="rounded-lg border p-2"
              dateFormat="yyyy-MM-dd"
              locale={pt} // Localização em português
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-500">
              Data Final:
            </label>
            <DatePicker
              selected={dataFinal}
              onChange={(date) => setDataFinal(date)}
              className="rounded-lg border p-2"
              dateFormat="yyyy-MM-dd"
              locale={pt} // Localização em português
            />
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {entradas && saidas && (
        <div style={{ width: "100%", height: altura }}>
          <Bar data={data} options={options} />
        </div>
      )}
    </div>
  );
};

export default GraficoEntradasSaidas;
