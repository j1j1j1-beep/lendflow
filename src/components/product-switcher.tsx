"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function useActiveProduct() {
  const pathname = usePathname();
  void pathname;
  return "lending" as const;
}

/**
 * Dashboard sidebar header: HOME BUTTON.
 * Links back to the dashboard. No dropdown.
 */
export function ProductSwitcher() {
  return (
    <SidebarMenuButton size="lg" asChild>
      <Link href="/dashboard" className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="OpenShut"
          width={32}
          height={32}
        />
        <div className="flex flex-col gap-0.5 leading-none">
          <span className="font-semibold tracking-tight">OpenShut</span>
          <span className="text-xs text-muted-foreground">Suite</span>
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
        width={32}
        height={32}
      />
      <span className="text-lg font-semibold tracking-tight text-foreground">
        OpenShut
      </span>
    </Link>
  );
}
