import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Coins,
  BookOpen,
  Bell,
  Trophy,
  LayoutDashboard,
  LogOut,
  BarChart3
} from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { Ticket } from "lucide-react";

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

function AdminSidebar({ collapsed = false, onToggle }: AdminSidebarProps) {
  const [location] = useLocation();
  const { adminLogoutMutation } = useAdminAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await adminLogoutMutation.mutateAsync();
      toast({
        title: "Logged out from admin",
        description: "You have been logged out from admin mode successfully",
      });
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "There was a problem logging out",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/admin/dashboard",
    },
    {
      title: "Users",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/users-management",
    },
    {
      title: "Tokens",
      icon: <Coins className="h-5 w-5" />,
      href: "/admin/tokens",
    },
    {
      title: "Learning Modules",
      icon: <BookOpen className="h-5 w-5" />,
      href: "/admin/learning-modules",
    },
    {
      title: "Alerts",
      icon: <Bell className="h-5 w-5" />,
      href: "/admin/alerts",
    },
    {
      title: "Achievements",
      icon: <Trophy className="h-5 w-5" />,
      href: "/admin/achievements",
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/admin/analytics",
    },
  ];

  return (
    <div
      className={cn(
        "relative h-full bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300",
        collapsed ? "w-[80px]" : "w-[250px]"
      )}
    >
      {/* Logo and collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <Link href="/admin/dashboard">
            <div className="flex items-center gap-2">
              <Ticket className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Admin</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin/dashboard">
            <div className="flex justify-center w-full">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
          </Link>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location === item.href || location.startsWith(`${item.href}/`)
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  )}
                >
                  {item.icon}
                  {!collapsed && <span>{item.title}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User account section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800",
            collapsed && "justify-center px-0"
          )}
          onClick={handleLogout}
          disabled={adminLogoutMutation.isPending}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Exit Admin Mode</span>}
        </Button>
      </div>
    </div>
  );
}

export default AdminSidebar;