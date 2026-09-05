"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Mail,
  CheckSquare,
  MessageCircle,
  Calendar,
  Users,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { SidebarNotification } from "@/components/sidebar-notification"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { usePerfil } from "@/hooks/use-perfil"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({
  onOpenCustomizer,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onOpenCustomizer?: () => void
}) {
  const { perfil, loading } = usePerfil()

  const navGroups = [
    {
      label: "Dashboard",
      items: [
        {
          title: "Oportunidades",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Em Breve",
      items: [
        { title: "E-mail", url: "#", icon: Mail, disabled: true },
        { title: "Tarefas", url: "#", icon: CheckSquare, disabled: true },
        { title: "Chat", url: "#", icon: MessageCircle, disabled: true },
        { title: "Calendário", url: "#", icon: Calendar, disabled: true },
        { title: "Usuários", url: "#", icon: Users, disabled: true },
      ],
    },
  ]

  const userDisplay = {
    name: perfil?.nome ?? perfil?.email?.split("@")[0] ?? "Rank CRM",
    email: perfil?.email ?? "usuario@rankmyapp.com.br",
    avatar: "",
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Rank CRM</span>
                  <span className="truncate text-xs">Gestão de Oportunidades</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarNotification />
        {!loading && <NavUser user={userDisplay} onOpenCustomizer={onOpenCustomizer} />}
      </SidebarFooter>
    </Sidebar>
  )
}