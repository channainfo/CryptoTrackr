import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SiEthereum } from "react-icons/si";

interface Web3ButtonProps {
  provider: "ethereum" | "polygon" | "avalanche";
  onConnect: () => Promise<void>;
}

export function Web3Button({ provider, onConnect }: Web3ButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await onConnect();
    } catch (error) {
      console.error(`Error connecting to ${provider}:`, error);
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
      <SiEthereum className="h-4 w-4" />
      <span className="sr-only md:not-sr-only md:inline-block">
        {isConnecting ? "Connecting..." : "Ethereum"}
      </span>
    </Button>
  );
}