import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  PieChart, 
  ActivitySquare, 
  LineChart, 
  Settings, 
  Ticket 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isMobile?: boolean;
}

const Sidebar = ({ isMobile = false }: SidebarProps) => {
  const [location] = useLocation();
  
  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/portfolio', label: 'Portfolio', icon: PieChart },
    { href: '/transactions', label: 'Transactions', icon: ActivitySquare },
    { href: '/markets', label: 'Markets', icon: LineChart },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
  
  return (
    <aside className={cn(
      "flex flex-col bg-white border-r border-gray-200",
      isMobile ? "w-full h-full" : "hidden md:flex w-64"
    )}>
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <Ticket className="h-6 w-6 text-primary" />
        <h1 className="ml-2 text-xl font-bold text-primary">CryptoFolio</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={cn(
            "flex items-center px-4 py-3 rounded-lg transition-colors",
            location === item.href 
              ? "bg-primary-light bg-opacity-10 text-primary font-medium" 
              : "text-neutral-dark hover:bg-neutral-light"
          )}>
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
            <span className="text-primary font-medium">AM</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Alex Morgan</p>
            <p className="text-xs text-neutral-mid">alex@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
