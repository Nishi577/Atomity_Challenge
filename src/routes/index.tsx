import { createFileRoute } from "@tanstack/react-router";
import { Stage } from "@/components/atomity/Stage";
import { Hero } from "@/components/atomity/Hero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atomity — One plane of visibility across every cloud" },
      {
        name: "description",
        content:
          "All infrastructure intelligence converges into a single source of truth. A cinematic look at Atomity's unified visibility engine.",
      },
      { property: "og:title", content: "Atomity — One plane of visibility" },
      {
        property: "og:description",
        content: "Many cloud systems. One plane of visibility.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen">
      <Hero />
      <Stage />
    </main>
  );
}
