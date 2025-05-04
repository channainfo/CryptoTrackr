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
import { logout } from "@/lib/auth";
import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  isMobile?: boolean;
}

const Sidebar = ({ isMobile = false }: SidebarProps) => {
  const [location] = useLocation();
  const { user } = useUser();
  
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
            <Link href="/profile" className="flex items-center group">
              <Avatar className={cn("h-10 w-10 transition-all flex-shrink-0", 
                user ? getAvatarColor(user.username) : "bg-primary bg-opacity-10 dark:bg-primary-dark dark:bg-opacity-20")}>
                <AvatarFallback className="text-white">
                  {user ? getUserInitials(user.username) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium dark:text-white truncate group-hover:underline">
                  {user ? user.username : 'Loading...'}
                </p>
                {user?.walletAddress && (
                  <p className="text-xs text-neutral-mid dark:text-neutral-light truncate">
                    {user.walletType && `${user.walletType.charAt(0).toUpperCase()}${user.walletType.slice(1)}: `}
                    {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
                  </p>
                )}
              </div>
              <User className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            {!isMobile && <ThemeToggle />}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Link href="/profile" className="flex items-center justify-center gap-2 text-sm font-medium rounded-md border border-input px-3 py-2 shadow-sm hover:bg-accent">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>
            
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
      </div>
    </aside>
  );
};

export default Sidebar;
