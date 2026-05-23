"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default function AdminShell() {
  const { isLoggedIn } = useAdmin();
  return isLoggedIn ? <AdminDashboard /> : <AdminLogin />;
}
