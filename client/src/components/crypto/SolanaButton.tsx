import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SiSolana } from "react-icons/si";

interface SolanaButtonProps {
  onConnect: () => Promise<void>;
}

export function SolanaButton({ onConnect }: SolanaButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await onConnect();
    } catch (error) {
      console.error("Error connecting to Solana:", error);
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
      <SiSolana className="h-4 w-4" />
      <span className="sr-only md:not-sr-only md:inline-block">
        {isConnecting ? "Connecting..." : "Solana"}
      </span>
    </Button>
  );
}