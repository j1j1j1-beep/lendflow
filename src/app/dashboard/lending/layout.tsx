import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loan Origination | OpenShut",
};

export default function LendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
