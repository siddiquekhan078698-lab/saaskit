"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SquaresFourIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, GearIcon, QuestionIcon, MagnifyingGlassIcon, DatabaseIcon, ChartLineIcon, FileIcon, CommandIcon } from "@phosphor-icons/react"

const data = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: (
        <SquaresFourIcon />
      ),
    },
    {
      title: "Download Video",
      url: "/dashboard/download",
      icon: (
        <CameraIcon />
      ),
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: (
        <GearIcon />
      ),
    },
  ],
  documents: [
    {
      name: "Privacy Policy",
      url: "#",
      icon: <FileTextIcon />,
    },
    {
      name: "Terms of Service",
      url: "#",
      icon: <FileTextIcon />,
    },
  ],
}
export function AppSidebar({ userProp, ...props }: React.ComponentProps<typeof Sidebar> & { userProp?: any }) {
  const [user, setUser] = React.useState(data.user)

  React.useEffect(() => {
    if (userProp) {
      setUser({
        name: userProp.user_metadata?.full_name || userProp.user_metadata?.first_name || "User",
        email: userProp.email || "",
        avatar: userProp.user_metadata?.avatar_url || "/avatars/shadcn.jpg",
      })
    }
  }, [userProp])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">Acme Inc.</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
