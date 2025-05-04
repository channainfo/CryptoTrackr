import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BaseButtonProps {
  onConnect: (address: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const BaseButton = ({ onConnect, onError, className = "" }: BaseButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Base uses the Ethereum provider with a network check
      if (typeof window !== 'undefined' && 'ethereum' in window) {
        const ethereum = (window as any).ethereum;
        
        try {
          // Switch to Base network
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2105' }], // Base mainnet chain ID
            });
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              try {
                await ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: '0x2105',
                      chainName: 'Base',
                      nativeCurrency: {
                        name: 'ETH',
                        symbol: 'ETH',
                        decimals: 18,
                      },
                      rpcUrls: ['https://mainnet.base.org'],
                      blockExplorerUrls: ['https://basescan.org'],
                    },
                  ],
                });
              } catch (addError) {
                toast({
                  title: "Network Error",
                  description: "Could not add the Base network to your wallet",
                  variant: "destructive",
                });
                throw addError;
              }
            } else {
              throw switchError;
            }
          }
          
          // Request accounts
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          
          if (accounts && accounts.length > 0) {
            const address = accounts[0];
            toast({
              title: "Base wallet connected",
              description: `Connected to ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
            });
            onConnect(address);
          } else {
            throw new Error("No accounts found");
          }
        } catch (error) {
          toast({
            title: "Connection failed",
            description: "Failed to connect to Base network",
            variant: "destructive",
          });
          if (onError) onError(error as Error);
        }
      } else {
        // Wallet not found, suggest installing MetaMask
        toast({
          title: "Wallet not found",
          description: "Please install MetaMask or another Ethereum-compatible wallet to connect to Base",
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
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.864 7.931a1.524 1.524 0 0 0-1.524-1.524h-6.116a1.515 1.515 0 0 0-.733.187l-2.255 1.242a1.524 1.524 0 0 0-.792 1.336v.912a1.524 1.524 0 0 0 1.525 1.525h6.115a1.525 1.525 0 0 0 1.525-1.525v-.23a1.524 1.524 0 0 0 2.255-1.923zm-3.55 1.142h-6.35v-1.142h6.35Z" />
        <path d="M9.675 8.355H3.66a1.525 1.525 0 0 0-1.524 1.525v.229a1.525 1.525 0 0 0-2.255 1.923 1.525 1.525 0 0 0 1.524 1.525h6.116c.26 0 .51-.07.732-.187l2.256-1.243a1.524 1.524 0 0 0 .792-1.336v-.912a1.525 1.525 0 0 0-1.525-1.524zm-.23 2.667H3.094v-1.142h6.35Z" />
      </svg>
      <span>{isConnecting ? "Connecting..." : "Base"}</span>
    </Button>
  );
};

export default BaseButton;