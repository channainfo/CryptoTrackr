import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SiCoinbase } from "react-icons/si";

interface BaseButtonProps {
  onConnect: () => Promise<void>;
}

export function BaseButton({ onConnect }: BaseButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await onConnect();
    } catch (error) {
      console.error("Error connecting to Base:", error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      onClick={handleConnect} 
      disabled={isConnecting}
      className="flex items-center justify-center gap-2"
    >
      <SiCoinbase className="h-4 w-4" />
      <span className="sr-only md:not-sr-only md:inline-block">
        {isConnecting ? "Connecting..." : "Base"}
      </span>
    </Button>
  );
}