import { useState } from "react";
import { PlusIcon, FolderPlus, BookOpen, Filter, TrendingUp, TrendingDown, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import PortfolioCard from "@/components/portfolio/PortfolioCard";
import { usePortfolios } from "@/hooks/usePortfolios";
import { CryptoTerm } from "@/components/education/CryptoTerm";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PortfolioWithAssets } from "@/hooks/usePortfolios";

const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Highest Value", value: "value-high" },
  { label: "Lowest Value", value: "value-low" },
  { label: "Best Performance", value: "performance-high" },
  { label: "Worst Performance", value: "performance-low" },
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Name (Z-A)", value: "name-desc" },
];

const Portfolio = () => {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  
  // Determine the correct portfolio type for the hook based on active tab
  const getPortfolioType = (tab: string): 'all' | 'watchlist' | 'standard' => {
    if (tab === "watchlist") return "watchlist";
    if (tab === "active") return "all"; // We'll filter active portfolios client-side
    return "all";
  };
  
  // Get the portfolio type for the current tab
  const portfolioType = getPortfolioType(activeTab);
  console.log(`Active tab: ${activeTab}, using portfolio type: ${portfolioType}`);
  
  // Pass the portfolioType to the hook for server-side filtering
  const { portfoliosWithAssets, isLoading } = usePortfolios(portfolioType);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState('');
  const [isDefaultPortfolio, setIsDefaultPortfolio] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Apply additional client-side filtering for active portfolios with assets
  const filteredPortfolios = portfoliosWithAssets.filter(item => {
    // Convert isWatchlist to a boolean to handle any possible type issues
    const isWatchlist = Boolean(item.portfolio.isWatchlist);
    
    console.log(`Filtering portfolio "${item.portfolio.name}" in "${activeTab}" tab (isWatchlist: ${isWatchlist})`);
    
    if (activeTab === "all") {
      // For "all" tab, show all portfolios
      return true;
    } 
    else if (activeTab === "active") {
      // For "active" tab, only show portfolios with assets and NOT watchlists
      const hasAssets = item.assets.length > 0;
      const notWatchlist = !isWatchlist;
      console.log(`Portfolio ${item.portfolio.name}: hasAssets=${hasAssets}, notWatchlist=${notWatchlist}`);
      return hasAssets && notWatchlist;
    }
    else if (activeTab === "watchlist") {
      // For "watchlist" tab, show ONLY watchlist portfolios
      console.log(`Watchlist filter for ${item.portfolio.name}, isWatchlist=${isWatchlist}`);
      return isWatchlist === true;
    }
    return false;
  });
  
  const sortedPortfolios = [...filteredPortfolios].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.portfolio.createdAt).getTime() - new Date(a.portfolio.createdAt).getTime();
      case "oldest":
        return new Date(a.portfolio.createdAt).getTime() - new Date(b.portfolio.createdAt).getTime();
      case "value-high":
        return b.totalValue - a.totalValue;
      case "value-low":
        return a.totalValue - b.totalValue;
      case "performance-high":
        return b.totalChangePercent - a.totalChangePercent;
      case "performance-low":
        return a.totalChangePercent - b.totalChangePercent;
      case "name-asc":
        return a.portfolio.name.localeCompare(b.portfolio.name);
      case "name-desc":
        return b.portfolio.name.localeCompare(a.portfolio.name);
      default:
        return 0;
    }
  });

  // Mutation to create a new portfolio
  const createPortfolioMutation = useMutation({
    mutationFn: async (data: { name: string, description?: string, isDefault?: boolean, isWatchlist?: boolean }) => {
      return apiRequest({
        url: '/api/portfolios',
        method: 'POST',
        data
      });
    },
    onSuccess: (data) => {
      // Invalidate all portfolio queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      
      // Also invalidate specific tabs
      if (data.isWatchlist) {
        console.log("Created watchlist portfolio, invalidating watchlist queries");
        queryClient.invalidateQueries({ queryKey: ['/api/portfolios', 'watchlist'] });
      } else {
        console.log("Created standard portfolio, invalidating standard queries");
        queryClient.invalidateQueries({ queryKey: ['/api/portfolios', 'standard'] });
      }
      
      setIsCreateOpen(false);
      resetForm();
      
      toast({
        title: data.isWatchlist ? "Watchlist created" : "Portfolio created",
        description: `Your new ${data.isWatchlist ? 'watchlist' : 'portfolio'} has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to create portfolio",
        description: error.message || "There was an error creating your portfolio.",
      });
    }
  });

  // Reset form state
  const resetForm = () => {
    setNewPortfolioName('');
    setNewPortfolioDescription('');
    setIsDefaultPortfolio(false);
  };

  // Handle creating a new portfolio
  const handleCreatePortfolio = () => {
    if (!newPortfolioName.trim()) return;
    
    // Set isWatchlist to true when creating from watchlist tab
    const isWatchlist = activeTab === "watchlist";
    console.log("Creating portfolio:", {
      name: newPortfolioName, 
      isWatchlist, 
      activeTab
    });
    
    // Make sure isWatchlist is explicitly set as a boolean to avoid type conversion issues
    const requestData = {
      name: newPortfolioName,
      description: newPortfolioDescription || undefined,
      isDefault: isDefaultPortfolio,
      // Explicitly use Boolean constructor to force true/false value
      isWatchlist: Boolean(isWatchlist),
      // CRITICAL: Send the activeTab so the server knows which tab we're creating from
      activeTab: activeTab
    };
    
    console.log("Sending portfolio creation request:", requestData);
    
    createPortfolioMutation.mutate(requestData);
  };

  // Get portfolio count by type for badges
  const portfolioCounts = {
    all: portfoliosWithAssets.length,
    active: portfoliosWithAssets.filter(p => p.assets.length > 0).length,
    watchlist: portfoliosWithAssets.filter(p => p.portfolio.isWatchlist).length
  };

  // Select the appropriate icon for sort option
  const getSortIcon = (sortValue: string) => {
    switch (sortValue) {
      case "newest":
      case "oldest":
        return <Clock className="h-4 w-4 mr-1" />;
      case "value-high":
      case "performance-high":
        return <TrendingUp className="h-4 w-4 mr-1" />;
      case "value-low":
      case "performance-low":
        return <TrendingDown className="h-4 w-4 mr-1" />;
      case "name-asc":
      case "name-desc":
        return <Star className="h-4 w-4 mr-1" />;
      default:
        return <Filter className="h-4 w-4 mr-1" />;
    }
  };
  
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">My Portfolios</h2>
          <p className="text-neutral-mid dark:text-gray-400 mt-1">
            View and manage your <CryptoTerm termKey="portfolio-diversification">diversified</CryptoTerm> cryptocurrency portfolios
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-2">
          <Button onClick={() => setIsCreateOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-1" />
            Create Portfolio
          </Button>
          <Button variant="outline" asChild>
            <Link href="/learning/glossary">
              <BookOpen className="h-4 w-4 mr-1" />
              Crypto Glossary
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs 
        defaultValue="all" 
        className="w-full" 
        onValueChange={(value) => {
          setActiveTab(value);
          // Force refetch the appropriate data when tab changes
          if (value === 'watchlist') {
            queryClient.invalidateQueries({ queryKey: ['/api/portfolios', 'watchlist'] });
          } else if (value === 'standard') {
            queryClient.invalidateQueries({ queryKey: ['/api/portfolios', 'standard'] });
          } else {
            queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
          }
        }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <TabsList className="mb-4 md:mb-0">
            <TabsTrigger value="all" className="relative">
              All Portfolios
              {portfolioCounts.all > 0 && (
                <Badge variant="secondary" className="ml-2">{portfolioCounts.all}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="relative">
              Active
              {portfolioCounts.active > 0 && (
                <Badge variant="secondary" className="ml-2">{portfolioCounts.active}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="relative">
              Watchlist
              {portfolioCounts.watchlist > 0 && (
                <Badge variant="secondary" className="ml-2">{portfolioCounts.watchlist}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Sort options */}
          <div className="flex items-center">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  {getSortIcon(sortBy)}
                  <SelectValue placeholder="Sort portfolios" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Sort By</SelectLabel>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="all" className="space-y-6">
          {renderPortfolioContent()}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-6">
          {renderPortfolioContent()}
        </TabsContent>
        
        <TabsContent value="watchlist" className="space-y-6">
          {renderPortfolioContent()}
        </TabsContent>
      </Tabs>

      {/* Create Portfolio Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeTab === "watchlist" ? "Create New Watchlist" : "Create New Portfolio"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "watchlist" 
                ? "Create a watchlist to monitor cryptocurrencies you're interested in without owning them."
                : "Add a new portfolio to track different sets of cryptocurrency assets you own."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="portfolio-name">
                {activeTab === "watchlist" ? "Watchlist Name" : "Portfolio Name"}
              </Label>
              <Input 
                id="portfolio-name" 
                value={newPortfolioName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPortfolioName(e.target.value)}
                placeholder={activeTab === "watchlist" ? "My Bitcoin Watchlist" : "My Investment Portfolio"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="portfolio-description">Description (Optional)</Label>
              <Textarea 
                id="portfolio-description" 
                value={newPortfolioDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPortfolioDescription(e.target.value)}
                placeholder={
                  activeTab === "watchlist" 
                    ? "Tokens I'm interested in for future investment" 
                    : "Long-term investments focused on large-cap tokens"
                }
                className="resize-none h-20"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="default-portfolio" 
                checked={isDefaultPortfolio}
                onCheckedChange={(checked) => setIsDefaultPortfolio(checked as boolean)}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="default-portfolio">
                  Set as default portfolio
                </Label>
                <p className="text-sm text-muted-foreground">
                  The default portfolio will be loaded automatically on the dashboard.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
              disabled={createPortfolioMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePortfolio}
              disabled={!newPortfolioName.trim() || createPortfolioMutation.isPending}
            >
              {createPortfolioMutation.isPending 
                ? 'Creating...' 
                : activeTab === "watchlist" 
                  ? 'Create Watchlist' 
                  : 'Create Portfolio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Helper function to render portfolio content based on loading state and filtered data
  function renderPortfolioContent() {
    if (isLoading) {
      return (
        // Loading skeleton
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-6" />
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <Skeleton className="h-4 w-4/5 mb-2" />
                  <Skeleton className="h-6 w-2/3" />
                </div>
                <div>
                  <Skeleton className="h-4 w-4/5 mb-2" />
                  <Skeleton className="h-6 w-2/3" />
                </div>
                <div>
                  <Skeleton className="h-4 w-4/5 mb-2" />
                  <Skeleton className="h-6 w-2/3" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      );
    } 
    
    if (sortedPortfolios.length === 0) {
      return (
        // Empty state
        <div className="text-center py-12 bg-neutral-lighter dark:bg-zinc-800 rounded-xl">
          <div className="max-w-md mx-auto">
            <FolderPlus className="h-12 w-12 text-neutral-mid mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2 dark:text-white">
              {activeTab === "all" 
                ? "No Portfolios Found" 
                : activeTab === "active" 
                  ? "No Active Portfolios" 
                  : "No Watchlist Portfolios"}
            </h3>
            <p className="text-neutral-mid dark:text-gray-400 mb-6">
              {activeTab === "all" 
                ? "Create your first portfolio to start tracking your crypto assets."
                : activeTab === "active"
                  ? "Add assets to your portfolios to see them here."
                  : "Create a watchlist portfolio to track tokens you're interested in."}
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create {activeTab === "watchlist" ? "Watchlist" : "Portfolio"}
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      // Portfolio grid
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPortfolios.map((item) => (
          <PortfolioCard 
            key={item.portfolio.id} 
            portfolio={item.portfolio} 
            assets={item.assets} 
          />
        ))}
      </div>
    );
  }
};

export default Portfolio;
