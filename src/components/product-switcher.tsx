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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent shadow-sm overflow-hidden">
          <Image
            src="/logo.png"
            alt="OpenShut"
            width={28}
            height={28}
            className="dark:invert"
          />
        </div>
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
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary overflow-hidden">
        <Image
          src="/logo.png"
          alt="OpenShut"
          width={28}
          height={28}
          className="invert"
        />
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">
        OpenShut
      </span>
    </Link>
  );
}
