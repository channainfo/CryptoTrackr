import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  PieChart, 
  ActivitySquare, 
  LineChart, 
  Settings, 
  Ticket,
  FileText,
  Calculator,
  GraduationCap,
  BellRing,
  BarChart,
  Trophy,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";

interface SidebarProps {
  isMobile?: boolean;
}

const Sidebar = ({ isMobile = false }: SidebarProps) => {
  const [location] = useLocation();
  
  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/portfolio', label: 'Portfolio', icon: PieChart },
    { href: '/analytics', label: 'Analytics', icon: BarChart },
    { href: '/transactions', label: 'Transactions', icon: ActivitySquare },
    { href: '/markets', label: 'Markets', icon: LineChart },
    { href: '/budget-planner', label: 'Budget Planner', icon: Calculator },
    { href: '/learning', label: 'Learning', icon: GraduationCap },
    { href: '/achievements', label: 'Achievements', icon: Trophy },
    { href: '/alerts', label: 'Alerts', icon: BellRing },
    { href: '/tax-report', label: 'Tax Report', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  return (
    <aside className={cn(
      "flex flex-col bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-gray-800",
      isMobile ? "w-full h-full" : "hidden md:flex w-64"
    )}>
      <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <Ticket className="h-6 w-6 text-primary" />
        <h1 className="ml-2 text-xl font-bold text-primary">Trailer</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={cn(
            "flex items-center px-4 py-3 rounded-lg transition-colors",
            location === item.href 
              ? "bg-primary-light bg-opacity-10 text-primary font-medium dark:bg-primary-dark dark:bg-opacity-20" 
              : "text-neutral-dark hover:bg-neutral-light dark:text-neutral-light dark:hover:bg-zinc-800"
          )}>
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center dark:bg-primary-dark dark:bg-opacity-20">
                <span className="text-primary font-medium">AM</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium dark:text-white">Alex Morgan</p>
                <p className="text-xs text-neutral-mid dark:text-neutral-light">alex@example.com</p>
              </div>
            </div>
            {!isMobile && <ThemeToggle />}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
