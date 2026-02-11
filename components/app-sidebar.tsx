"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
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
  TerminalSquareIcon,
  BotIcon,
  BookOpenIcon,
  Settings2Icon,
} from "lucide-react";

// Initial/fallback user data.
const initialUser = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
};
const navMain = [
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
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState(initialUser);

  React.useEffect(() => {
    let mounted = true;

    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        const team = data?.team;
        const sessionUser = data?.user;
        if (team) {
          setUser({
            name: team.display_name ?? team.name ?? sessionUser?.name ?? initialUser.name,
            email: team.email ?? sessionUser?.email ?? initialUser.email,
            avatar: initialUser.avatar,
          });
        } else if (sessionUser) {
          setUser({
            name: sessionUser.displayName ?? sessionUser.name ?? initialUser.name,
            email: initialUser.email,
            avatar: initialUser.avatar,
          });
        }
      })
      .catch(() => {
        // keep fallback user on error
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-3">
          <GalleryVerticalEndIcon />
          <span className="text-sm font-semibold">Lofy</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
