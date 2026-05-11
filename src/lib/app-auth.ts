import { cookies } from "next/headers";

export type AppProfile = {
  id: "samuel" | "stephanie";
  email: string;
  name: string;
};

export const appProfiles: AppProfile[] = [
  { id: "samuel", email: "samuel.morais@rarecouple.com", name: "Samuel" },
  { id: "stephanie", email: "stephanie.carvalho@rarecouple.com", name: "Stephanie" },
];

export const appPassword = "#7117#";
export const appSessionCookie = "rarecouple_session";

export async function getAppProfile() {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(appSessionCookie)?.value;

  return appProfiles.find((profile) => profile.id === profileId) ?? null;
}

