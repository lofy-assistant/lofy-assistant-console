"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
  TerminalSquareIcon,
  BotIcon,
  BookOpenIcon,
  Settings2Icon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
} from "lucide-react";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Overview",
      url: "/dashboard/overview",
      icon: <TerminalSquareIcon />,
      isActive: true,
      items: [
        {
          title: "Users",
          url: "/dashboard/overview/users",
        },
        {
          title: "Messages",
          url: "/dashboard/overview/messages",
        },
        {
          title: "Calendar Events",
          url: "/dashboard/overview/calendar-events",
        },
        {
          title: "Reminders",
          url: "/dashboard/overview/reminders",
        },
        {
          title: "Memories",
          url: "/dashboard/overview/memories",
        },
      ],
    },
    {
      title: "Logs",
      url: "/dashboard/logs",
      icon: <BotIcon />,
      items: [
        {
          title: "Activity",
          url: "/dashboard/logs/activity",
        },
        {
          title: "Integrations",
          url: "/dashboard/logs/integrations",
        },
      ],
    },
    {
      title: "Finance",
      url: "/dashboard/finance",
      icon: <BookOpenIcon />,
      items: [
        {
          title: "General",
          url: "/dashboard/finance/general",
        },
        {
          title: "Subscriptions",
          url: "/dashboard/finance/subscriptions",
        },
      ],
    },
    {
      title: "Debug Panel",
      url: "/dashboard/debug",
      icon: <Settings2Icon />,
      items: [
        {
          title: "General",
          url: "/dashboard/debug/general",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-3">
          <GalleryVerticalEndIcon />
          <span className="text-sm font-semibold">Lofy</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
