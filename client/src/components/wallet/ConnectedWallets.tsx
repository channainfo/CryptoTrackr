import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Chain icons
import { SiEthereum, SiSolana } from "react-icons/si";
import { FaDatabase } from "react-icons/fa";

// Define the type for the wallet as it comes from the API (snake_case)
type ApiWallet = {
  id: string;
  user_id: string;
  address: string;
  chain_type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

// Define the Wallet type for use in the application (camelCase)
type Wallet = {
  id: string;
  userId: string;
  address: string;
  chainType: "ethereum" | "solana" | "base" | "sui";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

// Helper to truncate wallet addresses
const truncateAddress = (address: string): string => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Get the appropriate icon for a blockchain
const getChainIcon = (chainType: string) => {
  switch (chainType) {
    case "ethereum":
      return <SiEthereum className="h-5 w-5 text-[#627EEA]" />;
    case "solana":
      return <SiSolana className="h-5 w-5 text-[#9945FF]" />;
    case "base":
      return <FaDatabase className="h-5 w-5 text-[#0052FF]" />;
    case "sui":
      return (
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
      );
    default:
      return null;
  }
};

// Get the full name of a blockchain
const getChainName = (chainType: string) => {
  console.log("Chain type:===========", chainType);
  switch (chainType) {
    case "ethereum":
      return "Ethereum";
    case "solana":
      return "Solana";
    case "base":
      return "Base";
    case "sui":
      return "Sui";
    default:
      return chainType.charAt(0).toUpperCase() + chainType.slice(1);
  }
};

export const ConnectedWallets = () => {
  const { toast } = useToast();

  // Fetch user wallets
  const {
    data: apiWallets = [],
    isLoading,
    isError,
    error,
  } = useQuery<ApiWallet[]>({
    queryKey: ["/api/auth/wallets"],
    retry: 1,
  });
  
  // Convert snake_case API response to camelCase for our component
  const wallets: Wallet[] = apiWallets.map(apiWallet => ({
    id: apiWallet.id,
    userId: apiWallet.user_id,
    address: apiWallet.address,
    chainType: apiWallet.chain_type as "ethereum" | "solana" | "base" | "sui", // Type assertion
    isDefault: apiWallet.is_default,
    createdAt: apiWallet.created_at,
    updatedAt: apiWallet.updated_at
  }));
  
  // Debug logging
  console.log("API Wallet data:", apiWallets);
  console.log("Converted wallet data:", wallets);
  console.log("Wallet loading:", isLoading);
  console.log("Wallet error:", isError, error);

  // Function to remove a wallet
  const removeWallet = async (walletId: string) => {
    try {
      const response = await fetch(`/api/auth/wallets/${walletId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove wallet");
      }

      // Show success message
      toast({
        title: "Wallet Removed",
        description:
          "The wallet address has been disconnected from your account.",
      });

      // Invalidate the wallets query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wallets"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Wallets</CardTitle>
        <CardDescription>
          Manage your connected blockchain wallets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : wallets.length > 0 ? (
          // Display wallets
          <div className="space-y-4">
            {wallets.map((wallet: Wallet) => (
              <div
                key={wallet.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getChainIcon(wallet.chainType)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {getChainName(wallet.chainType)}
                      </span>
                      {wallet.isDefault && <Badge>Default</Badge>}
                    </div>
                    <span className="text-sm text-neutral-mid">
                      {truncateAddress(wallet.address)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWallet(wallet.id)}
                  disabled={wallet.isDefault}
                  title={
                    wallet.isDefault
                      ? "Cannot remove default wallet"
                      : "Remove wallet"
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          // No wallets connected
          <div className="text-center py-8">
            <p className="text-neutral-mid">
              You don't have any wallets connected to your account.
            </p>
            <p className="text-sm mt-2">
              Connect a wallet on the login page to add it to your account.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
