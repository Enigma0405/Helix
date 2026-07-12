import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/site/landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Helix — Enterprise EvidenceOps Platform" },
      {
        name: "description",
        content:
          "Helix transforms organizational knowledge into evidence-backed investigation intelligence for regulated industries.",
      },
      { property: "og:title", content: "Helix — Enterprise EvidenceOps Platform" },
      {
        property: "og:description",
        content:
          "Evidence before AI. Always. An Enterprise Intelligence Operating System for regulated industries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
