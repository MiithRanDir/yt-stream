import { redirect } from "next/navigation";
import { googleConfigured } from "@/lib/env";
import { readSessionFromStore } from "@/lib/api";
import { LoginCard } from "@/components/login-card";

// Session check reads cookies → route is intentionally dynamic.
export const instant = false;

export default async function Home({ searchParams }: PageProps<"/">) {
  const session = await readSessionFromStore();
  if (session) redirect("/dashboard");
  const { error } = await searchParams;
  return <LoginCard configured={googleConfigured} errorCode={typeof error === "string" ? error : null} />;
}
