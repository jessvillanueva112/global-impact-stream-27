import { useState } from "react";
import { Home, FileText, Settings, Users, BarChart3, HelpCircle, Shield } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { User } from "@/types";

interface AppSidebarProps {
  user?: User;
}

// Role-based navigation items
const getNavigationItems = (userRole?: string) => {
  const baseItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Submit Update", url: "/submit", icon: FileText },
    { title: "Reports", url: "/reports", icon: BarChart3 },
  ];

  const roleItems = {
    admin: [
      { title: "User Management", url: "/admin/users", icon: Users },
      { title: "System Settings", url: "/admin/settings", icon: Shield },
    ],
    partner: [
      { title: "My Submissions", url: "/partner/submissions", icon: FileText },
    ],
    donor: [
      { title: "Impact Reports", url: "/donor/impact", icon: BarChart3 },
    ],
  };

  const settingsItems = [
    { title: "Settings", url: "/settings", icon: Settings },
    { title: "Help", url: "/help", icon: HelpCircle },
  ];

  return {
    main: baseItems,
    role: roleItems[userRole as keyof typeof roleItems] || [],
    settings: settingsItems,
  };
};

export function AppSidebar({ user }: AppSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const navigationItems = getNavigationItems(user?.role);
  
  const isActive = (path: string) => currentPath === path;
  const isExpanded = navigationItems.main.some((i) => isActive(i.url));
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar
      className="transition-all duration-300"
      collapsible="icon"
    >
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Role-based Navigation */}
        {navigationItems.role.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {user?.role === 'admin' ? 'Administration' : 
               user?.role === 'partner' ? 'Partner Tools' : 
               user?.role === 'donor' ? 'Donor Tools' : 'Tools'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.role.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavCls}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.settings.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}