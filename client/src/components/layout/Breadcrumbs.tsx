import React from 'react';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav className={cn("flex text-sm mb-4", className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
              )}
              {isLast ? (
                <span 
                  className="text-foreground font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link 
                  href={item.href} 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;