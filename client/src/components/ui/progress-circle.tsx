import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  value: number;
  size?: "sm" | "md" | "lg" | "xl";
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  showText?: boolean;
  textClassName?: string;
}

export const ProgressCircle = React.forwardRef<
  HTMLDivElement,
  ProgressCircleProps
>(
  (
    {
      value,
      size = "md",
      strokeWidth = 3,
      className,
      trackClassName,
      showText = false,
      textClassName,
      ...props
    },
    ref
  ) => {
    const normalizedValue = Math.min(100, Math.max(0, value));
    
    // Dimensions based on size
    const dimensions = {
      sm: { size: 32, center: 16, radius: 12 },
      md: { size: 64, center: 32, radius: 28 },
      lg: { size: 96, center: 48, radius: 42 },
      xl: { size: 128, center: 64, radius: 56 },
    };
    
    const { size: svgSize, center, radius } = dimensions[size];
    
    // Circumference of the circle
    const circumference = 2 * Math.PI * radius;
    
    // Stroke dash offset calculation
    const strokeDashOffset = circumference - (normalizedValue / 100) * circumference;
    
    return (
      <div
        ref={ref}
        className={cn("relative inline-flex", className)}
        {...props}
      >
        <svg
          height={svgSize}
          width={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          {/* Background track */}
          <circle
            className={cn(
              "stroke-muted fill-none transition-all duration-300 ease-in-out",
              trackClassName
            )}
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
          />
          
          {/* Foreground progress */}
          <circle
            className="fill-none stroke-current transition-all duration-300 ease-in-out"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashOffset}
            transform={`rotate(-90 ${center} ${center})`}
            strokeLinecap="round"
          />
        </svg>
        
        {showText && (
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center text-sm font-medium",
              textClassName
            )}
          >
            {Math.round(normalizedValue)}%
          </span>
        )}
      </div>
    );
  }
);

ProgressCircle.displayName = "ProgressCircle";