"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Moon,
  Sun,
  Settings,
  Landmark,
  Building2,
  Handshake,
  Building,
  ShieldCheck,
  Users,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { ProductSwitcher } from "@/components/product-switcher";
import { useGate } from "@/hooks/use-gate";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, gated: true },
  { label: "Lending", href: "/dashboard/lending", icon: Landmark, gated: true },
  { label: "Capital", href: "/dashboard/capital", icon: Building2, gated: true },
  { label: "Deals", href: "/dashboard/deals", icon: Handshake, gated: true },
  { label: "Syndication", href: "/dashboard/syndication", icon: Building, gated: true },
  { label: "Compliance", href: "/dashboard/compliance", icon: ShieldCheck, gated: true },
  { label: "Contacts", href: "/dashboard/contacts", icon: Users, gated: true },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, gated: false },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isGated } = useGate();

  // Close mobile nav on route change
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <ProductSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const resolvedHref =
                  isGated && item.gated ? "/dashboard/upgrade" : item.href;
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={resolvedHref}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {isGated && !isCollapsed && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Upgrade">
                <Link
                  href="/dashboard/upgrade"
                  className="flex items-center gap-2 text-sm font-medium text-primary"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Upgrade</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {isGated && isCollapsed && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Upgrade">
                <Link href="/dashboard/upgrade">
                  <Sparkles className="h-4 w-4 text-primary" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {!isCollapsed && (
            <SidebarMenuItem>
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <span>Dark mode</span>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                  aria-label="Toggle dark mode"
                />
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-1.5">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7",
                  },
                }}
              />
              {!isCollapsed && (
                <span className="text-sm text-muted-foreground">Account</span>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
