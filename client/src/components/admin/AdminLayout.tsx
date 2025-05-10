import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Redirect, Link } from "wouter";
import AdminSidebar from "../admin/AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAdmin, isLoading } = useAdminAuth();
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not admin, redirect to login
  if (!isAdmin && !isLoading) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 pb-24">
          {/* Back to dashboard button on small screens */}
          <div className="block sm:hidden mb-4">
            <Link href="/admin" className="inline-flex">
              <Button variant="outline" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}