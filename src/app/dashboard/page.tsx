import { FinanceApp } from "@/components/finance-app";
import { getAppProfile } from "@/lib/app-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const profile = await getAppProfile();

  if (!profile) {
    redirect("/login");
  }

  return <FinanceApp userEmail={profile.email} userName={profile.name} />;
}
