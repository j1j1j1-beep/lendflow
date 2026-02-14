"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Landmark,
  Building2,
  Handshake,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGate } from "@/hooks/use-gate";

const DIRECTORIES = [
  {
    key: "borrowers",
    label: "Borrowers",
    description: "Lending contacts and borrower profiles",
    href: "/dashboard/contacts/borrowers",
    apiPath: "/api/contacts/borrowers",
    icon: Landmark,
  },
  {
    key: "investors",
    label: "Investors",
    description: "Capital and syndication investor contacts",
    href: "/dashboard/contacts/investors",
    apiPath: "/api/contacts/investors",
    icon: Building2,
  },
  {
    key: "buyer-sellers",
    label: "Buyers & Sellers",
    description: "Deals and M&A counterparties",
    href: "/dashboard/contacts/buyer-sellers",
    apiPath: "/api/contacts/buyer-sellers",
    icon: Handshake,
  },
  {
    key: "lp-contacts",
    label: "LPs",
    description: "Limited partner and compliance contacts",
    href: "/dashboard/contacts/lp-contacts",
    apiPath: "/api/contacts/lp-contacts",
    icon: ShieldCheck,
  },
] as const;

type Counts = Record<string, number | null>;

export default function ContactsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { isGated, isLoading: gateLoading } = useGate();
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(true);

  // Redirect gated users
  useEffect(() => {
    if (!gateLoading && isGated) {
      router.replace("/dashboard/upgrade");
    }
  }, [gateLoading, isGated, router]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      const results: Counts = {};

      await Promise.allSettled(
        DIRECTORIES.map(async (dir) => {
          try {
            const res = await fetch(dir.apiPath);
            if (!res.ok) {
              results[dir.key] = null;
              return;
            }
            const data = await res.json();
            results[dir.key] = data.count ?? data.length ?? 0;
          } catch {
            results[dir.key] = null;
          }
        })
      );

      if (!cancelled) {
        setCounts(results);
        setLoading(false);
      }
    }

    fetchCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage contacts across all modules
        </p>
      </div>

      {/* Module Tabs */}
      <div className="flex gap-1 mb-6 rounded-lg bg-muted p-1 w-fit overflow-x-auto">
        {DIRECTORIES.map((dir) => {
          const isActive = pathname === dir.href;
          return (
            <Link
              key={dir.key}
              href={dir.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-out whitespace-nowrap ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {dir.label}
            </Link>
          );
        })}
      </div>

      {/* Directory Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DIRECTORIES.map((dir, i) => {
          const Icon = dir.icon;
          const count = counts[dir.key];
          const isCountLoading = loading;

          return (
            <Link key={dir.key} href={dir.href} className="group">
              <Card
                className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/15 animate-fade-up h-full"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                  </div>
                  <CardTitle className="text-base font-semibold mt-3">
                    {dir.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    {dir.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {isCountLoading ? (
                      <Skeleton className="h-7 w-12" />
                    ) : count === null ? (
                      <span className="text-sm text-muted-foreground">--</span>
                    ) : (
                      <span className="text-2xl font-semibold tracking-tight tabular-nums">
                        {count}
                      </span>
                    )}
                    <span className="text-xs font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      View All
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
