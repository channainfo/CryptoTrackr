import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectLabel
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Edit, Trash2, Info } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  totalValue?: number;
  assetCount?: number;
}

interface PortfolioSummary {
  id: string;
  totalValue: number;
  assetCount: number;
}

interface PortfolioSelectorProps {
  onPortfolioChange?: (portfolioId: string) => void;
  currentPortfolioId?: string;
}

const PortfolioSelector = ({ onPortfolioChange, currentPortfolioId }: PortfolioSelectorProps) => {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState('');
  const [isDefaultPortfolio, setIsDefaultPortfolio] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [portfolioSummaries, setPortfolioSummaries] = useState<Record<string, PortfolioSummary>>({});
  const queryClient = useQueryClient();

  // Query to fetch all user portfolios
  const { data: portfolios, isLoading } = useQuery({
    queryKey: ['/api/portfolios'],
    queryFn: async () => {
      console.log('Fetching portfolios');
      try {
        const response = await fetch('/api/portfolios');
        if (!response.ok) {
          throw new Error('Failed to fetch portfolios');
        }
        const data = await response.json();
        console.log('Fetched portfolios:', data);
        return data;
      } catch (error) {
        console.error('Error fetching portfolios:', error);
        throw error;
      }
    }
  });

  // Mutation to create a new portfolio
  const createPortfolioMutation = useMutation({
    mutationFn: async (data: { name: string, description?: string, isDefault?: boolean }) => {
      return apiRequest({
        url: '/api/portfolios',
        method: 'POST',
        data
      });
    },
    onSuccess: (newPortfolio) => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      setIsCreateOpen(false);
      resetForm();
      
      // If this was set as default, update our local state accordingly
      if (newPortfolio.isDefault && onPortfolioChange) {
        onPortfolioChange(newPortfolio.id);
      }
      
      toast({
        title: "Portfolio created",
        description: "Your new portfolio has been created successfully.",
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

  // Mutation to update a portfolio
  const updatePortfolioMutation = useMutation({
    mutationFn: async (data: { id: string, name: string, description?: string, isDefault?: boolean }) => {
      return apiRequest({
        url: `/api/portfolios/${data.id}`,
        method: 'PATCH',
        data
      });
    },
    onSuccess: (updatedPortfolio) => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      setIsEditOpen(false);
      resetForm();
      
      // If this was set as default, update our local state accordingly
      if (updatedPortfolio.isDefault && onPortfolioChange) {
        onPortfolioChange(updatedPortfolio.id);
      }
      
      toast({
        title: "Portfolio updated",
        description: "Your portfolio has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to update portfolio",
        description: error.message || "There was an error updating your portfolio.",
      });
    }
  });

  // Mutation to delete a portfolio
  const deletePortfolioMutation = useMutation({
    mutationFn: async (portfolioId: string) => {
      return apiRequest({
        url: `/api/portfolios/${portfolioId}`,
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      setIsDeleteConfirmOpen(false);
      resetForm();
      
      toast({
        title: "Portfolio deleted",
        description: "Your portfolio has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete portfolio",
        description: error.message || "There was an error deleting your portfolio.",
      });
    }
  });

  // Reset form state
  const resetForm = () => {
    setNewPortfolioName('');
    setNewPortfolioDescription('');
    setIsDefaultPortfolio(false);
    setSelectedPortfolio(null);
  };

  // Handle creating a new portfolio
  const handleCreatePortfolio = () => {
    if (!newPortfolioName.trim()) return;
    
    createPortfolioMutation.mutate({
      name: newPortfolioName,
      description: newPortfolioDescription || undefined,
      isDefault: isDefaultPortfolio
    });
  };

  // Handle updating an existing portfolio
  const handleUpdatePortfolio = () => {
    if (!selectedPortfolio || !newPortfolioName.trim()) return;
    
    updatePortfolioMutation.mutate({
      id: selectedPortfolio.id,
      name: newPortfolioName,
      description: newPortfolioDescription || undefined,
      isDefault: isDefaultPortfolio
    });
  };

  // Handle deleting a portfolio
  const handleDeletePortfolio = () => {
    if (!selectedPortfolio) return;
    
    deletePortfolioMutation.mutate(selectedPortfolio.id);
  };

  // Open edit dialog with selected portfolio data
  const openEditDialog = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setNewPortfolioName(portfolio.name);
    setNewPortfolioDescription(portfolio.description || '');
    setIsDefaultPortfolio(portfolio.isDefault || false);
    setIsEditOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setIsDeleteConfirmOpen(true);
  };

  // Handle portfolio selection
  const handlePortfolioChange = (value: string) => {
    if (onPortfolioChange) {
      onPortfolioChange(value);
    }
  };

  // Find current portfolio in the list or use a default
  useEffect(() => {
    if (portfolios && portfolios.length > 0) {
      // Fetch portfolio summaries for each portfolio
      portfolios.forEach((portfolio: Portfolio) => {
        fetch(`/api/portfolios/${portfolio.id}/summary`)
          .then(res => res.json())
          .then(data => {
            setPortfolioSummaries(prev => ({
              ...prev,
              [portfolio.id]: data
            }));
          })
          .catch(err => {
            console.error(`Error fetching summary for portfolio ${portfolio.id}:`, err);
          });
      });
    }
  }, [portfolios]);

  // Find default or first portfolio to use as initial value if none is specified
  const defaultPortfolio = portfolios?.find((p: Portfolio) => p.isDefault) || portfolios?.[0];
  const selectedId = currentPortfolioId || defaultPortfolio?.id;

  // Prepare portfolio items with extra metadata
  const portfolioItems = portfolios?.map((portfolio: Portfolio) => {
    const summary = portfolioSummaries[portfolio.id];
    return {
      ...portfolio,
      assetCount: summary?.assetCount || 0,
      totalValue: summary?.totalValue || 0
    };
  });

  return (
    <div className="flex flex-col">
      {/* Portfolio Selector */}
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Select 
            value={selectedId}
            onValueChange={handlePortfolioChange}
            disabled={isLoading || !portfolios?.length}
          >
            <SelectTrigger className="w-full md:w-[240px]">
              <SelectValue placeholder="Select portfolio" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Your Portfolios</SelectLabel>
                {portfolioItems?.map((portfolio) => (
                  <SelectItem 
                    key={portfolio.id} 
                    value={portfolio.id}
                    className="flex justify-between items-center py-2"
                  >
                    <div className="flex items-center w-full justify-between pr-2">
                      <div>
                        {portfolio.name}
                        {portfolio.isDefault && (
                          <Badge variant="outline" className="ml-2 text-xs">Default</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(portfolio);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Edit Portfolio</TooltipContent>
                        </Tooltip>
                        
                        {portfolios.length > 1 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteDialog(portfolio);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Delete Portfolio</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Create Portfolio Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full" 
                onClick={() => setIsCreateOpen(true)}
              >
                <PlusCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create New Portfolio</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Create Portfolio Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Portfolio</DialogTitle>
            <DialogDescription>
              Add a new portfolio to track different sets of cryptocurrency assets.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="portfolio-name">Portfolio Name</Label>
              <Input 
                id="portfolio-name" 
                value={newPortfolioName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPortfolioName(e.target.value)}
                placeholder="My Investment Portfolio"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="portfolio-description">Description (Optional)</Label>
              <Textarea 
                id="portfolio-description" 
                value={newPortfolioDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPortfolioDescription(e.target.value)}
                placeholder="Long-term investments focused on large-cap tokens"
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
                <Label htmlFor="default-portfolio" className="inline-flex items-center">
                  Set as default portfolio
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        The default portfolio will be loaded automatically when you open the dashboard.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
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
              {createPortfolioMutation.isPending ? 'Creating...' : 'Create Portfolio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Portfolio Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
            <DialogDescription>
              Update the details of your portfolio.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-portfolio-name">Portfolio Name</Label>
              <Input 
                id="edit-portfolio-name" 
                value={newPortfolioName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPortfolioName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-portfolio-description">Description (Optional)</Label>
              <Textarea 
                id="edit-portfolio-description" 
                value={newPortfolioDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPortfolioDescription(e.target.value)}
                className="resize-none h-20"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-default-portfolio" 
                checked={isDefaultPortfolio}
                onCheckedChange={(checked) => setIsDefaultPortfolio(checked as boolean)}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="edit-default-portfolio" className="inline-flex items-center">
                  Set as default portfolio
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        The default portfolio will be loaded automatically when you open the dashboard.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditOpen(false);
                resetForm();
              }}
              disabled={updatePortfolioMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePortfolio}
              disabled={!newPortfolioName.trim() || updatePortfolioMutation.isPending}
            >
              {updatePortfolioMutation.isPending ? 'Updating...' : 'Update Portfolio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Portfolio</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the portfolio "{selectedPortfolio?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-destructive">
              All assets and historical data for this portfolio will be permanently deleted.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                resetForm();
              }}
              disabled={deletePortfolioMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeletePortfolio}
              disabled={deletePortfolioMutation.isPending}
            >
              {deletePortfolioMutation.isPending ? 'Deleting...' : 'Delete Portfolio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortfolioSelector;