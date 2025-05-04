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
import { 
  SiEthereum, 
  SiSolana 
} from "react-icons/si";
import { FaDatabase } from "react-icons/fa";

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
    default:
      return null;
  }
};

// Get the full name of a blockchain
const getChainName = (chainType: string) => {
  switch (chainType) {
    case "ethereum":
      return "Ethereum";
    case "solana":
      return "Solana";
    case "base":
      return "Base";
    default:
      return chainType.charAt(0).toUpperCase() + chainType.slice(1);
  }
};

export const ConnectedWallets = () => {
  const { toast } = useToast();

  // Fetch user wallets
  const { data: wallets = [], isLoading } = useQuery<Wallet[]>({
    queryKey: ["/api/auth/wallets"],
    retry: 1,
  });

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
        description: "The wallet address has been disconnected from your account.",
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
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
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
              <div key={wallet.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getChainIcon(wallet.chainType)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getChainName(wallet.chainType)}</span>
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
                  title={wallet.isDefault ? "Cannot remove default wallet" : "Remove wallet"}
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