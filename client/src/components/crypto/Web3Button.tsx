import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SiEthereum } from "react-icons/si";

interface Web3ButtonProps {
  onConnect: (address: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const Web3Button = ({ onConnect, onError, className = "" }: Web3ButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Check if Ethereum provider exists
      if (typeof window !== 'undefined' && 'ethereum' in window) {
        const ethereum = (window as any).ethereum;
        
        try {
          // Request account access
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          
          if (accounts && accounts.length > 0) {
            const address = accounts[0];
            toast({
              title: "Ethereum wallet connected",
              description: `Connected to ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
            });
            onConnect(address);
          } else {
            throw new Error("No accounts found");
          }
        } catch (error) {
          toast({
            title: "Connection failed",
            description: "Failed to connect to Ethereum wallet",
            variant: "destructive",
          });
          if (onError) onError(error as Error);
        }
      } else {
        // Wallet not found, suggest installing MetaMask
        toast({
          title: "Wallet not found",
          description: "Please install MetaMask or another Ethereum wallet to continue",
          variant: "destructive",
        });
        if (onError) onError(new Error("Ethereum provider not found"));
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
      <SiEthereum className="h-5 w-5" />
      <span>{isConnecting ? "Connecting..." : "Ethereum"}</span>
    </Button>
  );
};

export default Web3Button;