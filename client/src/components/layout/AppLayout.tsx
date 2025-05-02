import { useState } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { Ticket, MenuIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "wouter";
import ThemeToggle from "@/components/ThemeToggle";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Desktop Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-gray-800">
          <Link href="/">
            <div className="flex items-center">
              <Ticket className="h-6 w-6 text-primary" />
              <h1 className="ml-2 text-xl font-bold text-primary">Trailer</h1>
            </div>
          </Link>
          <div className="flex items-center">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-neutral-light dark:hover:bg-zinc-800">
                  <MenuIcon className="h-6 w-6 dark:text-white" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 dark:bg-zinc-950">
                <Sidebar isMobile />
              </SheetContent>
            </Sheet>
          </div>
        </header>
        
        {/* Page Content */}
        {children}
      
        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </main>
    </div>
  );
};

export default AppLayout;
