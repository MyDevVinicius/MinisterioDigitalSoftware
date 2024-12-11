// pages/dashboard/index.tsx
"use client";

import React from "react";
import ECommerce from "@/components/Dashboard/E-commerce";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

const DashboardPage = () => {
  return (
    <div className="space-y-5 bg-white p-4">
      <DefaultLayout>
        <ECommerce />
      </DefaultLayout>
    </div>
  );
};

export default DashboardPage;
