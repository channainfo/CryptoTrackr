import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  PieChart, 
  ActivitySquare, 
  LineChart,
  FileText,
  Calculator,
  GraduationCap,
  BellRing,
  BarChart,
  LogOut,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/use-auth";

const MobileNav = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/portfolio', label: 'Portfolio', icon: PieChart },
    { href: '/markets', label: 'Markets', icon: LineChart },
    { href: '/learning', label: 'Learn', icon: GraduationCap },
    { href: '/settings', label: 'Account', icon: Settings },
  ];
  
  const { logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <nav className="md:hidden flex items-center justify-around px-4 py-3 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-gray-800 fixed bottom-0 left-0 right-0">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} className="flex flex-col items-center">
          <item.icon className={cn(
            "h-5 w-5",
            location === item.href ? "text-primary" : "text-neutral-mid dark:text-neutral-light"
          )} />
          <span className={cn(
            "text-xs mt-1",
            location === item.href ? "text-primary" : "text-neutral-mid dark:text-neutral-light"
          )}>
            {item.label}
          </span>
        </Link>
      ))}
      
      {/* Only show logout button if user is authenticated */}
      {user && (
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          <span className="text-xs mt-1 text-red-500">
            Logout
          </span>
        </button>
      )}
    </nav>
  );
};

export default MobileNav;
