import { redirect } from "next/navigation";
import { getAppProfile } from "@/lib/app-auth";

export default async function Home() {
  const profile = await getAppProfile();

  redirect(profile ? "/dashboard" : "/login");
}
