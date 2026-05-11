import { FinanceApp } from "@/components/finance-app";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <FinanceApp userEmail="configuracao@pendente.local" setupMissing />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <FinanceApp userEmail={user.email ?? "usuario"} />;
}

