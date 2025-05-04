import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SiSolana } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SolanaButtonProps {
  onConnect: (address: string) => void;
  onError: (error: Error) => void;
}

export default function SolanaButton({ onConnect, onError }: SolanaButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectWallet = async () => {
    setIsConnecting(true);

    // Check if Phantom wallet is installed
    const isPhantomInstalled = window.phantom?.solana?.isPhantom;
    
    if (!isPhantomInstalled) {
      toast({
        title: "Phantom wallet not found",
        description: "Please install the Phantom wallet extension to connect your Solana wallet",
        variant: "destructive",
      });
      setIsConnecting(false);
      onError(new Error("Phantom wallet not installed"));
      return;
    }

    try {
      // Connect to Phantom
      const provider = window.phantom?.solana;
      
      if (!provider) {
        throw new Error("Phantom provider not found");
      }
      
      // Request connection to wallet
      const { publicKey } = await provider.connect();
      const address = publicKey.toString();

      if (!address) {
        throw new Error("No account selected");
      }

      // For Solana, we'll just authenticate with the address for demo
      // In a real implementation, we would get a message to sign
      const authResponse = await apiRequest('/api/auth/wallet/solana', {
        method: "POST",
        data: {
          address,
          signature: "demo_signature" // In real app, would be actual signature
        }
      });

      if (authResponse && authResponse.id) {
        toast({
          title: "Wallet connected",
          description: "Successfully authenticated with Solana wallet",
        });
        onConnect(address);
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error: any) {
      console.error("Solana wallet connection error:", error);
      
      // Check if user rejected request
      if (error.code === 4001) {
        toast({
          title: "Connection rejected",
          description: "You rejected the connection request",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection failed",
          description: error.message || "Failed to connect your Solana wallet",
          variant: "destructive",
        });
      }
      
      onError(new Error(error.message || "Solana connection failed"));
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="lg"
      className="flex items-center justify-center gap-2"
      onClick={connectWallet}
      disabled={isConnecting}
    >
      <SiSolana className="h-5 w-5 text-purple-500" />
      <span className="sr-only md:not-sr-only md:text-xs">
        {isConnecting ? "Connecting..." : "Solana"}
      </span>
    </Button>
  );
}

// Add TypeScript definitions for Phantom wallet
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom: boolean;
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
      };
    };
  }
}