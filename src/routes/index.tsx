import { createFileRoute } from "@tanstack/react-router";
import { Firebreak } from "@/components/firebreak-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Firebreak />;
}
