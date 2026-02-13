import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance | OpenShut",
};

export default function ComplianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
