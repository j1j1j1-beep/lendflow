import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capital Markets | OpenShut",
};

export default function CapitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
