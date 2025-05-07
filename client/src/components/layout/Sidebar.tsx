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
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  isMobile?: boolean;
}

const Sidebar = ({ isMobile = false }: SidebarProps) => {
  const [location] = useLocation();
  const { user } = useAuth();
  
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
    { href: '/settings', label: 'Account', icon: Settings },
  ];
  
  // Get user initials for avatar
  const getUserInitials = (username: string) => {
    return username
      .split(/[\s_-]/)
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };
  
  // Generate avatar background color based on username
  const getAvatarColor = (username: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 
      'bg-yellow-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-cyan-500'
    ];
    
    // Simple hash function for consistent color
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Get a color from the array
    const colorIndex = Math.abs(hash % colors.length);
    return colors[colorIndex];
  };
  
  const { logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <aside className={cn(
      "flex flex-col bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-gray-800",
      isMobile ? "w-full h-full" : "hidden md:flex w-64"
    )}>
      {/* App title and user profile at the top */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Ticket className="h-6 w-6 text-primary" />
            <h1 className="ml-2 text-xl font-bold text-primary">Trailer</h1>
          </div>
          {!isMobile && <ThemeToggle />}
        </div>
        
        {/* User profile section at the top */}
        {user && (
          <Link href="/settings" className="flex items-center py-2 px-1 rounded-lg group hover:bg-primary/5 transition-colors">
            <Avatar className={cn("h-9 w-9 transition-all flex-shrink-0", getAvatarColor(user.username))}>
              <AvatarFallback className="text-white">
                {getUserInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 overflow-hidden flex-1">
              <p className="text-sm font-medium dark:text-white truncate group-hover:underline flex items-center">
                {user.username}
                <User className="ml-1 h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </p>
              {user.walletAddress && (
                <p className="text-xs text-neutral-mid dark:text-neutral-light truncate">
                  {user.walletType && `${user.walletType.charAt(0).toUpperCase()}${user.walletType.slice(1)}: `}
                  {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
                </p>
              )}
            </div>
          </Link>
        )}
      </div>
      
      {/* Navigation links in scrollable area */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
      
      {/* Logout button at the bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        {user && (
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </Button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
