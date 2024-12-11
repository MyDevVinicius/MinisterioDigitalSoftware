"use client";

import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ContaAPagar {
  id: number;
  observacao: string;
  valor: string;
  valor_pago: string;
  data_vencimento: string;
  status: string;
}

const ContasAPagarList: React.FC = () => {
  const [contas, setContas] = useState<ContaAPagar[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  const fetchContas = async () => {
    try {
      const chave = localStorage.getItem("codigo_verificacao");
      const nomeBanco = localStorage.getItem("nome_banco");

      if (!chave || !nomeBanco) {
        toast.error("Chave de verificação ou nome do banco não encontrados.");
        return;
      }

      const response = await fetch(
        `/api/contasapagar?chave=${chave}&banco=${nomeBanco}`,
      );
      const data = await response.json();

      if (response.ok) {
        setContas(data.data);
        toast.success("Contas carregadas com sucesso!");
      } else {
        toast.error(data.message || "Erro ao carregar contas.");
      }
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
      toast.error("Erro ao buscar contas");
    }
  };

  useEffect(() => {
    fetchContas();
  }, []);

  const formatarValor = (valor: string) =>
    `R$ ${parseFloat(valor).toFixed(2).replace(".", ",")}`;

  const formatarData = (data: string) => {
    const date = new Date(data);
    return date.toLocaleDateString("pt-BR");
  };

  const getStatusClasses = (status: string) => {
    const statusClasses: Record<string, string> = {
      Pago: "bg-green-100 text-green-900 font-bold",
      Pendente: "bg-orange-100 text-orange-900 font-bold",
      "Pago Parcial": "bg-purple-100 text-purple-900 font-bold",
      Vencida: "bg-red-100 text-red-900 font-bold",
    };
    return statusClasses[status] || "bg-gray-200 text-gray-900 font-bold";
  };

  const contasFiltradas = contas.filter((conta) => {
    const dataVencimento = new Date(conta.data_vencimento);
    const startDate = startDateFilter ? new Date(startDateFilter) : null;
    const endDate = endDateFilter ? new Date(endDateFilter) : null;
    const today = new Date();

    const matchesStatus =
      statusFilter === "Todos" ||
      (statusFilter === "Vencida" &&
        conta.status === "Pendente" &&
        dataVencimento < today) ||
      statusFilter === conta.status;

    const matchesStartDate = !startDate || dataVencimento >= startDate;
    const matchesEndDate = !endDate || dataVencimento <= endDate;

    return matchesStatus && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="mx-auto w-full max-w-full space-y-4 p-4">
      <ToastContainer />
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-md border p-2 sm:w-auto"
        >
          <option value="Todos">Todos</option>
          <option value="Vencida">Vencida</option>
          <option value="Pago">Pago</option>
          <option value="Pago Parcial">Pago Parcial</option>
          <option value="Pendente">Pendente</option>
        </select>

        <input
          type="date"
          value={startDateFilter}
          onChange={(e) => setStartDateFilter(e.target.value)}
          className="w-full rounded-md border p-2 sm:w-auto"
        />
        <input
          type="date"
          value={endDateFilter}
          onChange={(e) => setEndDateFilter(e.target.value)}
          className="w-full rounded-md border p-2 sm:w-auto"
        />
      </div>

      <table className="mt-4 w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">Observação</th>
            <th className="border p-2 text-center">Valor</th>
            <th className="border p-2 text-center">Valor Pago</th>
            <th className="border p-2 text-center">Vencimento</th>
            <th className="border p-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {contasFiltradas.map((conta) => (
            <tr
              key={conta.id}
              className={`border ${getStatusClasses(conta.status)}`}
            >
              <td className="p-2">{conta.observacao}</td>
              <td className="p-2 text-center">{formatarValor(conta.valor)}</td>
              <td className="p-2 text-center">
                {formatarValor(conta.valor_pago)}
              </td>
              <td className="p-2 text-center">
                {formatarData(conta.data_vencimento)}
              </td>
              <td className="p-2 text-center">{conta.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContasAPagarList;
