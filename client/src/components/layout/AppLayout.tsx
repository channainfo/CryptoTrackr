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
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <Link href="/">
            <div className="flex items-center">
              <Ticket className="h-6 w-6 text-primary" />
              <h1 className="ml-2 text-xl font-bold text-primary">CryptoFolio</h1>
            </div>
          </Link>
          <div className="flex items-center">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-neutral-light">
                  <MenuIcon className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
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
