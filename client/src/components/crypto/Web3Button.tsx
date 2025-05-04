import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SiEthereum } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Web3ButtonProps {
  onConnect: (address: string) => void;
  onError: (error: Error) => void;
}

export default function Web3Button({ onConnect, onError }: Web3ButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectWallet = async () => {
    setIsConnecting(true);

    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to connect your Ethereum wallet",
        variant: "destructive",
      });
      setIsConnecting(false);
      onError(new Error("MetaMask not installed"));
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      if (!address) {
        throw new Error("No account selected");
      }

      // Get nonce from server
      const nonceResponse = await apiRequest(`/api/auth/wallet/nonce/${address}`, {
        method: "GET",
      });

      if (!nonceResponse || !nonceResponse.message) {
        throw new Error("Failed to get nonce from server");
      }

      // Request signature from user
      const message = nonceResponse.message;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });

      // Verify signature on server
      const authResponse = await apiRequest('/api/auth/wallet/ethereum', {
        method: "POST",
        body: JSON.stringify({
          address,
          signature
        }),
      });

      if (authResponse && authResponse.id) {
        toast({
          title: "Wallet connected",
          description: "Successfully authenticated with Ethereum wallet",
        });
        onConnect(address);
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error: any) {
      console.error("Ethereum wallet connection error:", error);
      
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
          description: error.message || "Failed to connect your Ethereum wallet",
          variant: "destructive",
        });
      }
      
      onError(new Error(error.message || "Ethereum connection failed"));
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
      <SiEthereum className="h-5 w-5 text-blue-500" />
      <span className="sr-only md:not-sr-only md:text-xs">
        {isConnecting ? "Connecting..." : "Ethereum"}
      </span>
    </Button>
  );
}

// Add TypeScript definitions for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, callback: (...args: any[]) => void) => void;
    };
  }
}