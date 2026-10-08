// components/shared/Sidebar.tsx
// Shared portal navigation sidebar (Broker + Admin). Composes the shadcn
// sidebar primitives; each portal passes its own nav item set and renders
// this inside a SidebarProvider + SidebarInset pair in its route-group layout.

"use client";

import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  badge?: string | number;
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

// Per-portal overrides for the spacing/typography of each sidebar region, so a
// portal can match its own design without changing the shared defaults.
export type AppSidebarClassNames = {
  header?: string;
  content?: string;
  group?: string;
  menu?: string;
  item?: string;
  footer?: string;
};

export type AppSidebarProps = {
  groups: SidebarNavGroup[];
  activeRoute: string;
  header?: ReactNode;
  footer?: ReactNode;
  classNames?: AppSidebarClassNames;
  onNavigate?: (href: string) => void;
};

export default function AppSidebar({ groups, activeRoute, header, footer, classNames, onNavigate }: AppSidebarProps) {
  return (
    <SidebarPrimitive collapsible="icon">
      {header && <SidebarHeader className={classNames?.header}>{header}</SidebarHeader>}
      <SidebarContent className={classNames?.content}>
        {groups.map((group, groupIndex) => (
          <SidebarGroup key={group.label ?? groupIndex} className={classNames?.group}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className={classNames?.menu}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeRoute === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        // A portal can set --sidebar-active to give the selected item a fill
                        // distinct from hover; it falls back to the accent colour otherwise.
                        className={cn(
                          "data-[active=true]:bg-[var(--sidebar-active,var(--sidebar-accent))] data-[active=true]:text-[var(--sidebar-active-foreground,var(--sidebar-accent-foreground))]",
                          classNames?.item,
                        )}
                      >
                        <a
                          href={item.href}
                          onClick={(event) => {
                            if (onNavigate) {
                              event.preventDefault();
                              onNavigate(item.href);
                            }
                          }}
                        >
                          {Icon && <Icon />}
                          <span className="font-heading text-[16px] font-medium">{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                      {item.badge !== undefined && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {footer && <SidebarFooter className={classNames?.footer}>{footer}</SidebarFooter>}
      <SidebarRail />
    </SidebarPrimitive>
  );
}
