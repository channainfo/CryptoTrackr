import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

interface PortfolioSelectorProps {
  onPortfolioChange?: (portfolioId: string) => void;
}

const PortfolioSelector = ({ onPortfolioChange }: PortfolioSelectorProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState('');
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
    mutationFn: async (data: { name: string, description?: string }) => {
      console.log('Creating portfolio:', data);
      try {
        const response = await fetch('/api/portfolios', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to create portfolio:', errorText);
          throw new Error('Failed to create portfolio');
        }
        const result = await response.json();
        console.log('Created portfolio:', result);
        return result;
      } catch (error) {
        console.error('Error creating portfolio:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      setIsCreateOpen(false);
      setNewPortfolioName('');
      setNewPortfolioDescription('');
    }
  });

  const handleCreatePortfolio = () => {
    if (!newPortfolioName.trim()) return;
    
    createPortfolioMutation.mutate({
      name: newPortfolioName,
      description: newPortfolioDescription || undefined
    });
  };

  const handlePortfolioChange = (value: string) => {
    if (onPortfolioChange) {
      onPortfolioChange(value);
    }
  };

  // Find default portfolio in the list to set as the initial value
  const defaultPortfolio = portfolios?.find((p: Portfolio) => p.isDefault) || portfolios?.[0];

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1">
        <Select 
          defaultValue={defaultPortfolio?.id}
          onValueChange={handlePortfolioChange}
          disabled={isLoading || !portfolios?.length}
        >
          <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Select portfolio" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {portfolios?.map((portfolio: Portfolio) => (
                <SelectItem key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                  {portfolio.isDefault && " (Default)"}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full" 
            title="Create new portfolio"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
        </DialogTrigger>
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
              <Input 
                id="portfolio-description" 
                value={newPortfolioDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPortfolioDescription(e.target.value)}
                placeholder="Long-term investments"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateOpen(false)}
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
    </div>
  );
};

export default PortfolioSelector;