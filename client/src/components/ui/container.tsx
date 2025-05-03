import React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Container = ({ children, className, ...props }: ContainerProps) => {
  return (
    <div className={`container mx-auto px-4 max-w-7xl ${className || ""}`} {...props}>
      {children}
    </div>
  );
};