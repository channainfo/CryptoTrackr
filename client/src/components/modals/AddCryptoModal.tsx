import { useState, useEffect } from "react";
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
import { Search, X } from "lucide-react";
import { useCryptoData } from "@/hooks/useCryptoData";
import { usePortfolio } from "@/hooks/usePortfolio";
import { CryptoAsset } from "@/types/crypto";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface AddCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId?: string;
}

const AddCryptoModal = ({ isOpen, onClose, portfolioId }: AddCryptoModalProps) => {
  const { marketData, isLoading } = useCryptoData();
  const { addAssetToPortfolio } = usePortfolio();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCryptos, setFilteredCryptos] = useState<CryptoAsset[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(null);
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    if (marketData.length > 0) {
      if (searchTerm) {
        setFilteredCryptos(
          marketData.filter(crypto =>
            crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      } else {
        // Show top 8 by market cap if no search term
        setFilteredCryptos(marketData.slice(0, 8));
      }
    }
  }, [searchTerm, marketData]);

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

  const handleCryptoSelect = (crypto: CryptoAsset) => {
    setSelectedCrypto(crypto);
  };

  const handleAddCrypto = () => {
    if (!selectedCrypto || !quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) {
      toast({
        variant: "destructive",
        title: "Invalid quantity",
        description: "Please enter a valid quantity (0 or greater)",
      });
      return;
    }

    addAssetToPortfolio(
      {
        ...selectedCrypto,
        quantity: parseFloat(quantity),
        value: parseFloat(quantity) * selectedCrypto.currentPrice
      },
      portfolioId
    );

    toast({
      title: "Cryptocurrency added",
      description: `Added ${quantity} ${selectedCrypto.symbol} to your portfolio`,
    });

    // Reset form and close modal
    setSelectedCrypto(null);
    setQuantity("");
    setSearchTerm("");
    onClose();
  };

  const handleModalClose = () => {
    setSelectedCrypto(null);
    setQuantity("");
    setSearchTerm("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Cryptocurrency</DialogTitle>
          <DialogDescription>
            Search and add cryptocurrencies to your portfolio
          </DialogDescription>
        </DialogHeader>

        {!selectedCrypto ? (
          <>
            <div className="mb-4">
              <Label htmlFor="cryptoSearch">Search Cryptocurrency</Label>
              <div className="relative">
                <Input
                  id="cryptoSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Bitcoin, Ethereum, etc."
                  className="pr-10"
                />
                <div className="absolute right-3 top-2.5 text-neutral-mid">
                  <Search className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="mb-4 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium text-neutral-dark mb-2">
                {searchTerm ? "Search Results" : "Popular Cryptocurrencies"}
              </p>

              {isLoading ? (
                <div className="flex justify-center p-4">
                  <span>Loading cryptocurrencies...</span>
                </div>
              ) : filteredCryptos.length === 0 ? (
                <div className="text-center py-4 text-neutral-mid">
                  No cryptocurrencies found
                </div>
              ) : (
                filteredCryptos.map((crypto) => (
                  <div
                    key={crypto.id}
                    className="flex items-center justify-between p-3 hover:bg-neutral-light rounded-lg cursor-pointer"
                    onClick={() => handleCryptoSelect(crypto)}
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full ${getBgColor(crypto.symbol)}`}>
                        <span className="text-xs font-mono">{crypto.symbol}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{crypto.name}</p>
                        <p className="text-xs text-neutral-mid">{crypto.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium font-mono">
                        ${crypto.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-xs ${crypto.priceChangePercentage24h >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {crypto.priceChangePercentage24h >= 0 ? '+' : ''}{crypto.priceChangePercentage24h.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full ${getBgColor(selectedCrypto.symbol)}`}>
                  <span className="text-sm font-mono">{selectedCrypto.symbol}</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium">{selectedCrypto.name}</p>
                  <p className="text-sm text-neutral-mid">{selectedCrypto.symbol}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedCrypto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="price">Current Price</Label>
              <Input
                id="price"
                value={`$${selectedCrypto.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                readOnly
                disabled
              />
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="any"
                placeholder="Enter quantity"
              />
            </div>
            
            {quantity && !isNaN(parseFloat(quantity)) && parseFloat(quantity) >= 0 && (
              <div className="rounded-md bg-neutral-lighter p-3 mb-4">
                <p className="text-sm">
                  Total Value: <span className="font-medium">${(parseFloat(quantity) * selectedCrypto.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          {selectedCrypto && (
            <Button 
              className="w-full" 
              onClick={handleAddCrypto}
              disabled={!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0}
            >
              Add to Portfolio
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCryptoModal;
