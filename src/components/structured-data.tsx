export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OpenShut",
    url: "https://openshut.me",
    logo: "https://openshut.me/og-image.png",
    description:
      "Legal automation and deal tools for PE firms and family offices. Generate deal terms, loan packages, PPMs, and compliance reports. 59 document types across 5 modules.",
    foundingDate: "2026",
    contactPoint: {
      "@type": "ContactPoint",
      email: "sales@openshut.me",
      contactType: "sales",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OpenShut",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Legal automation and PE deal tools. Generate deal terms, loan packages, PPMs, closing checklists, and compliance reports. 59 document types across 5 modules.",
    offers: {
      "@type": "Offer",
      price: "250000",
      priceCurrency: "USD",
      description: "Per-module license. $250,000 license + $20,000/month unlimited usage.",
    },
    featureList: [
      "Deal terms generation for lending, M&A, fund formation, and syndication",
      "36 lending document types across 14 loan programs",
      "Fund formation deal tools for 6 fund types",
      "M&A deal tools for 8 transaction types",
      "Real estate syndication with IRR calculations",
      "ILPA-compliant fund compliance and LP reporting automation",
      "50-state regulatory coverage",
      "PE workflow automation with full audit trail",
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebPageSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "OpenShut",
      url: "https://openshut.me",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
