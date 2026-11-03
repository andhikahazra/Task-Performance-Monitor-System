import MainApp from "@/components/MainApp";

export function generateStaticParams() {
  return [
    { slug: "tasks" },
    { slug: "calendar" },
    { slug: "actions" },
    { slug: "evaluation" },
    { slug: "reports" },
    { slug: "users" },
    { slug: "settings" },
    { slug: "notifications" },
    { slug: "registration" },
    { slug: "password" },
  ];
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MainApp initialView={slug as any} />;
}
