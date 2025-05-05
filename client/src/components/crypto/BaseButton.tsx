import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaBitcoin } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BaseButtonProps {
  onConnect: (address: string) => void;
  onError: (error: Error) => void;
}

export default function BaseButton({ onConnect, onError }: BaseButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectWallet = async () => {
    setIsConnecting(true);

    // Base uses Ethereum's wallet interface, so we check for window.ethereum
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to connect to Base",
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

      // Verify signature on server for Base
      const authResponse = await apiRequest('/api/auth/wallet/base', {
        method: "POST",
        data: {
          address,
          signature
        }
      });

      if (authResponse && authResponse.id) {
        // Force refresh the user data in React Query cache
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        
        toast({
          title: "Wallet connected",
          description: "Successfully authenticated with Base",
        });
        
        // Wait a small amount of time for the queryClient to refetch the user data
        setTimeout(() => {
          onConnect(address);
        }, 300);
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error: any) {
      console.error("Base wallet connection error:", error);
      
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
          description: error.message || "Failed to connect your Base wallet",
          variant: "destructive",
        });
      }
      
      onError(new Error(error.message || "Base connection failed"));
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
      <FaBitcoin className="h-5 w-5 text-cyan-500" />
      <span className="sr-only md:not-sr-only md:text-xs">
        {isConnecting ? "Connecting..." : "Base"}
      </span>
    </Button>
  );
}