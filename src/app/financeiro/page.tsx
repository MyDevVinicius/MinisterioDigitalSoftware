"use client";

import React from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import EntradaSaidaForm from "@/components/EntradaSaidaForm/EntradaSaidaForm";

const FinanceiroPage = () => {
  return (
    <div className="space-y-5 bg-white p-4">
      <DefaultLayout>
        <EntradaSaidaForm />
      </DefaultLayout>
    </div>
  );
};

export default FinanceiroPage;
