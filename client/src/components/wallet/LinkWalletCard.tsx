import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SiEthereum, SiSolana } from "react-icons/si";
import { FaDatabase } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Web3Button from "@/components/crypto/Web3Button";
import SolanaButton from "@/components/crypto/SolanaButton";
import BaseButton from "@/components/crypto/BaseButton";

// Type for API wallet response
type ApiWallet = {
  id: string;
  user_id: string;
  address: string;
  chain_type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

// Add TypeScript definitions for Solana wallet
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
    };
  }
}

export const LinkWalletCard = () => {
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);

  // Fetch user wallets
  const {
    data: wallets = [],
    isLoading,
  } = useQuery<ApiWallet[]>({
    queryKey: ["/api/auth/wallets"],
    retry: 1,
  });

  // Check which blockchain wallets are already connected
  const connectedChainTypes = wallets.map(wallet => wallet.chain_type);
  
  // Create a list of available wallet types
  const availableWalletTypes = [
    { type: "ethereum", name: "Ethereum", icon: <SiEthereum className="h-5 w-5 text-[#627EEA]" /> },
    { type: "solana", name: "Solana", icon: <SiSolana className="h-5 w-5 text-[#9945FF]" /> },
    { type: "base", name: "Base", icon: <FaDatabase className="h-5 w-5 text-[#0052FF]" /> },
    { 
      type: "sui", 
      name: "Sui", 
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z"
            fill="#6FBCF0"
          />
          <path
            d="M16.5 9C18.8217 9 21.0483 9.92179 22.6709 11.5695C24.2935 13.2172 25.2 15.4939 25.2 17.8889C25.2 20.2839 24.2935 22.5606 22.6709 24.2083C21.0483 25.856 18.8217 26.7778 16.5 26.7778"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M14.7 23C12.3783 23 10.1517 22.0782 8.52909 20.4305C6.9065 18.7828 6 16.5061 6 14.1111C6 11.7161 6.9065 9.43944 8.52909 7.7917C10.1517 6.14397 12.3783 5.22222 14.7 5.22222"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )
    }
  ];

  // Filter out connected wallet types
  const unconnectedWalletTypes = availableWalletTypes.filter(
    wallet => !connectedChainTypes.includes(wallet.type)
  );

  const handleWalletConnect = async (address: string, walletType: string) => {
    try {
      console.log(`Linking ${walletType} wallet:`, address);
      
      // Get nonce from server for this address
      const nonceResponse = await apiRequest(`/api/auth/wallet/nonce/${address}`, {
        method: "GET",
      });
      
      if (!nonceResponse || !nonceResponse.message) {
        throw new Error("Failed to get nonce from server");
      }
      
      let signature;
      
      // Request signature based on wallet type
      if (walletType.toLowerCase() === "ethereum" || walletType.toLowerCase() === "base") {
        // For Ethereum and Base wallets
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [nonceResponse.message, address]
        });
      } else if (walletType.toLowerCase() === "solana") {
        // For Solana wallets - simplified for demo
        // In a real app, implement proper Solana signature process
        signature = "demo_solana_signature";
      } else {
        throw new Error(`Unsupported wallet type: ${walletType}`);
      }
      
      // Link wallet using our new endpoint
      const linkResponse = await apiRequest('/api/auth/link-wallet', {
        method: "POST",
        data: {
          address,
          signature,
          walletType: walletType.toLowerCase() // Send the type of wallet
        }
      });
      
      console.log("Link wallet response:", linkResponse);
      
      if (linkResponse && linkResponse.message) {
        setIsLinking(false);
        
        toast({
          title: "Wallet Linked",
          description: `Successfully linked your ${walletType} wallet to your account.`,
        });
        
        // Refresh wallet list
        queryClient.invalidateQueries({ queryKey: ["/api/auth/wallets"] });
      } else {
        throw new Error("Failed to link wallet");
      }
    } catch (error: any) {
      console.error("Error linking wallet:", error);
      
      // Check if user rejected request
      if (error.code === 4001) {
        toast({
          title: "Connection Rejected",
          description: "You rejected the wallet connection request",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Link Failed",
          description: error.message || `Failed to link your ${walletType} wallet`,
          variant: "destructive",
        });
      }
      
      handleWalletError(new Error(error.message || "Failed to link wallet"));
    }
  };

  const handleWalletError = (error: Error) => {
    console.error("Wallet connection error:", error);
    setIsLinking(false);
    
    toast({
      title: "Connection Failed",
      description: error.message || "Failed to link wallet. Please try again.",
      variant: "destructive",
    });
  };

  // Connect to Ethereum wallet
  const connectEthereumWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask to connect your Ethereum wallet",
          variant: "destructive",
        });
        return;
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      if (!address) {
        throw new Error("No account selected");
      }
      
      // Link wallet
      await handleWalletConnect(address, "ethereum");
    } catch (error: any) {
      handleWalletError(error);
    }
  };
  
  // Connect to Solana wallet
  const connectSolanaWallet = async () => {
    try {
      // Check if Phantom is installed
      if (!window.solana || !window.solana.isPhantom) {
        toast({
          title: "Phantom not found",
          description: "Please install Phantom to connect your Solana wallet",
          variant: "destructive",
        });
        return;
      }
      
      // Connect to wallet
      const response = await window.solana.connect();
      const address = response.publicKey.toString();
      
      // Link wallet
      await handleWalletConnect(address, "solana");
    } catch (error: any) {
      handleWalletError(error);
    }
  };
  
  // Connect to Base wallet (similar to Ethereum)
  const connectBaseWallet = async () => {
    try {
      // Base uses the same interface as Ethereum
      if (typeof window.ethereum === 'undefined') {
        toast({
          title: "Compatible wallet not found",
          description: "Please install a wallet that supports Base",
          variant: "destructive",
        });
        return;
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      if (!address) {
        throw new Error("No account selected");
      }
      
      // Link wallet
      await handleWalletConnect(address, "base");
    } catch (error: any) {
      handleWalletError(error);
    }
  };
  
  const renderWalletButton = (type: string) => {
    switch (type) {
      case "ethereum":
        return (
          <Button
            variant="outline"
            size="lg"
            className="flex items-center justify-center gap-2"
            onClick={connectEthereumWallet}
          >
            <SiEthereum className="h-5 w-5 text-blue-500" />
            <span className="sr-only md:not-sr-only md:text-xs">Ethereum</span>
          </Button>
        );
      case "solana":
        return (
          <Button
            variant="outline"
            size="lg"
            className="flex items-center justify-center gap-2"
            onClick={connectSolanaWallet}
          >
            <SiSolana className="h-5 w-5 text-purple-500" />
            <span className="sr-only md:not-sr-only md:text-xs">Solana</span>
          </Button>
        );
      case "base":
        return (
          <Button
            variant="outline"
            size="lg"
            className="flex items-center justify-center gap-2"
            onClick={connectBaseWallet}
          >
            <FaDatabase className="h-5 w-5 text-blue-500" />
            <span className="sr-only md:not-sr-only md:text-xs">Base</span>
          </Button>
        );
      // Additional wallet types can be added here
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link New Wallet</CardTitle>
        <CardDescription>
          Connect additional blockchain wallets to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-4 text-neutral-mid">Loading wallet information...</p>
        ) : unconnectedWalletTypes.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-mid mb-4">
              You can link additional wallet types to your account. Select from the available options below:
            </p>
            
            {isLinking ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {unconnectedWalletTypes.map((wallet) => (
                  <div key={wallet.type}>
                    {renderWalletButton(wallet.type)}
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={() => setIsLinking(false)}
                  className="col-span-1 sm:col-span-3 mt-2"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setIsLinking(true)}
                className="w-full"
              >
                Link New Wallet
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-neutral-mid">
              You have already connected all supported wallet types.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};