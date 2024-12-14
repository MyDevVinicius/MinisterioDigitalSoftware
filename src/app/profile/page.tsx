"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import UsuarioComponet from "@/components/UsuarioComponent/UsuarioComponent";

const Profile = () => {
  const router = useRouter();

  useEffect(() => {
    const clienteAtivo = localStorage.getItem("cliente_ativo");

    // Redireciona para o login se o cliente não estiver ativo
    if (clienteAtivo !== "true") {
      router.push("/login");
    }
  }, [router]);

  return (
    <DefaultLayout>
      <UsuarioComponet />
    </DefaultLayout>
  );
};

export default Profile;
