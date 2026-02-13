import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syndication | OpenShut",
};

export default function SyndicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
