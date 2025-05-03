import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioAsset } from "@/types/crypto";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface SellCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: PortfolioAsset;
  portfolioId?: string;
}

const SellCryptoModal = ({ isOpen, onClose, asset, portfolioId }: SellCryptoModalProps) => {
  const { removeAssetFromPortfolio, sellPartialAsset } = usePortfolio(portfolioId);
  const { toast } = useToast();
  const [quantity, setQuantity] = useState("");
  
  // Function to determine background color based on symbol
  const getBgColor = (symbol: string) => {
    const colors: Record<string, string> = {
      'BTC': 'bg-yellow-100 text-yellow-600',
      'ETH': 'bg-blue-100 text-blue-600',
      'SOL': 'bg-green-100 text-green-600',
      'DOT': 'bg-purple-100 text-purple-600',
      'ADA': 'bg-indigo-100 text-indigo-600',
      'XRP': 'bg-red-100 text-red-600',
      'BNB': 'bg-amber-100 text-amber-600'
    };
    
    return colors[symbol] || 'bg-gray-100 text-gray-600';
  };

  const handleSellCrypto = () => {
    if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid quantity",
        description: "Please enter a valid quantity greater than 0",
      });
      return;
    }
    
    const sellQuantity = parseFloat(quantity);
    
    if (sellQuantity > asset.quantity) {
      toast({
        variant: "destructive", 
        title: "Insufficient balance",
        description: `You only have ${asset.quantity} ${asset.symbol} available to sell`,
      });
      return;
    }
    
    // If selling entire amount, remove the asset
    if (sellQuantity === asset.quantity) {
      removeAssetFromPortfolio(asset.id, portfolioId);
    } else {
      // For partial sells, use the new sellPartialAsset function
      sellPartialAsset(asset.id, sellQuantity, portfolioId);
    }
    
    toast({
      title: "Cryptocurrency sold",
      description: `Sold ${quantity} ${asset.symbol} from your portfolio`,
    });
    
    // Reset form and close modal
    setQuantity("");
    onClose();
  };

  const handleModalClose = () => {
    setQuantity("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sell Cryptocurrency</DialogTitle>
          <DialogDescription>
            Sell {asset.name} from your portfolio
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full ${getBgColor(asset.symbol)}`}>
              <span className="text-sm font-mono">{asset.symbol}</span>
            </div>
            <div className="ml-3">
              <p className="font-medium">{asset.name}</p>
              <p className="text-sm text-neutral-mid">{asset.symbol}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleModalClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="currentHoldings">Current Holdings</Label>
          <Input
            id="currentHoldings"
            value={`${asset.quantity} ${asset.symbol}`}
            readOnly
            disabled
          />
        </div>
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="currentValue">Current Value</Label>
          <Input
            id="currentValue"
            value={`$${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            readOnly
            disabled
          />
        </div>
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="quantity">Quantity to Sell</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0"
            max={asset.quantity.toString()}
            step="any"
            placeholder={`Enter quantity (max: ${asset.quantity})`}
          />
        </div>
        
        {quantity && !isNaN(parseFloat(quantity)) && parseFloat(quantity) > 0 && (
          <div className="rounded-md bg-neutral-lighter p-3 mb-4">
            <p className="text-sm">
              Sell Value: <span className="font-medium">${(parseFloat(quantity) * asset.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
          </div>
        )}

        <DialogFooter>
          <Button 
            className="w-full" 
            onClick={handleSellCrypto}
            disabled={!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0 || parseFloat(quantity) > asset.quantity}
            variant="destructive"
          >
            Sell {asset.symbol}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SellCryptoModal;