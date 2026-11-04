import { getCurrentUser } from "@/lib/auth";
import MainApp from "@/components/MainApp";

export const dynamic = "force-dynamic";

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  return <MainApp initialView={slug as any} initialUser={user} />;
}
