import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bio - IND Submissions | OpenShut",
  description:
    "AI-powered IND submission generation for biopharma. Upload source data, generate 11 CTD documents, independently verify every data point.",
};

export default function BioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
