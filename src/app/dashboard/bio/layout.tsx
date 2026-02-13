import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bio Programs | OpenShut",
};

export default function BioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
