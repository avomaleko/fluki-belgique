import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/library" });
  },
  head: () => ({
    meta: [
      { title: "Biblioteca Musical — FLAUKI" },
      { name: "description", content: "Partituras, áudios e imagens de cânticos para adoração, louvor e meditação." },
    ],
  }),
  component: () => null,
});
