import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deals & M&A | OpenShut",
};

export default function DealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
