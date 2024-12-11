import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import UsuarioComponet from "@/components/UsuarioComponent/UsuarioComponent";

export const metadata: Metadata = {
  title: "Next.js Profile | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Profile page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const Profile = () => {
  return (
    <DefaultLayout>
      <UsuarioComponet />
    </DefaultLayout>
  );
};

export default Profile;
