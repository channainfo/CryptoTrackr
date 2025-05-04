import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SiSolana } from "react-icons/si";

interface SolanaButtonProps {
  onConnect: (address: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const SolanaButton = ({ onConnect, onError, className = "" }: SolanaButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Check if Solana provider exists (Phantom, Solflare, etc.)
      if (typeof window !== 'undefined' && 'solana' in window) {
        const solana = (window as any).solana;
        
        try {
          // Request connection to the wallet
          const response = await solana.connect();
          const publicKey = response.publicKey.toString();
          
          toast({
            title: "Solana wallet connected",
            description: `Connected to ${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 4)}`,
          });
          onConnect(publicKey);
        } catch (error) {
          toast({
            title: "Connection failed",
            description: "Failed to connect to Solana wallet",
            variant: "destructive",
          });
          if (onError) onError(error as Error);
        }
      } else {
        // Wallet not found, suggest installing Phantom
        toast({
          title: "Wallet not found",
          description: "Please install Phantom or another Solana wallet to continue",
          variant: "destructive",
        });
        if (onError) onError(new Error("Solana provider not found"));
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={connectWallet}
      disabled={isConnecting}
      className={`flex items-center gap-2 ${className}`}
    >
      <SiSolana className="h-5 w-5" />
      <span>{isConnecting ? "Connecting..." : "Solana"}</span>
    </Button>
  );
};

export default SolanaButton;