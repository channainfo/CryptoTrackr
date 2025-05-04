import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  actions,
  className,
}) => {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 flex items-center justify-center text-muted-foreground">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;