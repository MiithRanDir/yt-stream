import { redirect } from "next/navigation";
import { readSessionFromStore } from "@/lib/api";
import { DashboardApp } from "@/components/dashboard-app";

// Session guard reads cookies → route is intentionally dynamic.
export const instant = false;

export default async function DashboardPage() {
  const session = await readSessionFromStore();
  if (!session) redirect("/");
  return (
    <DashboardApp
      initial={{ email: session.email, name: session.name, picture: session.picture }}
    />
  );
}
