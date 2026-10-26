import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";

export const instant = false;

export default async function AdminCarsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return children;
}
