"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import EntradaSaidaForm from "@/components/EntradaSaidaForm/EntradaSaidaForm";

const FinanceiroPage = () => {
  const router = useRouter();

  useEffect(() => {
    const clienteAtivo = localStorage.getItem("cliente_ativo");

    // Redireciona para o login se o cliente não estiver ativo
    if (clienteAtivo !== "true") {
      router.push("/login"); // Ajuste para a rota de login
    }
  }, [router]);

  return (
    <div className="space-y-5 bg-white p-4">
      <DefaultLayout>
        <EntradaSaidaForm />
      </DefaultLayout>
    </div>
  );
};

export default FinanceiroPage;
