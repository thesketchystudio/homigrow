// components/shared/Sidebar.tsx
// Shared portal navigation sidebar (Broker + Admin). Composes the shadcn
// sidebar primitives; each portal passes its own nav item set and renders
// this inside a SidebarProvider + SidebarInset pair in its route-group layout.

"use client";

import type { ComponentType, ReactNode } from "react";

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

export type AppSidebarProps = {
  groups: SidebarNavGroup[];
  activeRoute: string;
  header?: ReactNode;
  footer?: ReactNode;
  onNavigate?: (href: string) => void;
};

export default function AppSidebar({ groups, activeRoute, header, footer, onNavigate }: AppSidebarProps) {
  return (
    <SidebarPrimitive collapsible="icon">
      {header && <SidebarHeader>{header}</SidebarHeader>}
      <SidebarContent>
        {groups.map((group, groupIndex) => (
          <SidebarGroup key={group.label ?? groupIndex}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeRoute === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
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
      {footer && <SidebarFooter>{footer}</SidebarFooter>}
      <SidebarRail />
    </SidebarPrimitive>
  );
}
