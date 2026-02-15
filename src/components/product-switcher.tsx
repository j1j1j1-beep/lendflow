"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SidebarMenuButton } from "@/components/ui/sidebar";

const MODULE_LABELS: Record<string, string> = {
  lending: "Lending",
  capital: "Capital",
  deals: "Deals",
  syndication: "Syndication",
  compliance: "Compliance",
};

function useActiveModule(): string {
  const pathname = usePathname();
  // Match /dashboard/{module}/...
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  if (match && MODULE_LABELS[match[1]]) {
    return MODULE_LABELS[match[1]];
  }
  return "Suite";
}

/**
 * Dashboard sidebar header: HOME BUTTON.
 * Shows current module name below "OpenShut".
 */
export function ProductSwitcher() {
  const activeModule = useActiveModule();

  return (
    <SidebarMenuButton size="lg" asChild className="h-auto py-2">
      <Link href="/dashboard" className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="OpenShut"
          width={40}
          height={40}
        />
        <div className="flex flex-col gap-0.5 leading-none">
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent font-bold tracking-tight">
            OpenShut
          </span>
          <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
            {activeModule}
          </span>
        </div>
      </Link>
    </SidebarMenuButton>
  );
}

/**
 * Marketing nav logo: Simple link to homepage.
 */
export function MarketingLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="OpenShut"
        width={36}
        height={36}
      />
      <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent text-lg font-bold tracking-tight">
        OpenShut
      </span>
    </Link>
  );
}
