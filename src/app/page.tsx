import { getCurrentUser } from "@/lib/auth";
import MainApp from "@/components/MainApp";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  return <MainApp initialUser={user} />;
}
