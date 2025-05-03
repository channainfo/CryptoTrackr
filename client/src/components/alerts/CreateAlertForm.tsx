import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Create the form schema
const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  tokenId: z.string().min(1, 'Please select a token'),
  alertType: z.enum(['price_above', 'price_below', 'percent_change', 'volume_above', 'market_cap_above']),
  threshold: z.coerce.number().positive('Threshold must be positive'),
  notificationMethod: z.string().default('app'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Token {
  id: string;
  symbol: string;
  name: string;
  imageUrl?: string;
}

interface CreateAlertFormProps {
  onSuccess: () => void;
}

export const CreateAlertForm = ({ onSuccess }: CreateAlertFormProps) => {
  const queryClient = useQueryClient();
  const [tokenSearch, setTokenSearch] = useState('');
  
  // Query tokens from the API
  const { data: tokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ['/api/crypto/market'],
  });
  
  // Filter tokens based on search
  const filteredTokens = tokens.filter((token: Token) => {
    const searchLower = tokenSearch.toLowerCase();
    return (
      token.name.toLowerCase().includes(searchLower) ||
      token.symbol.toLowerCase().includes(searchLower)
    );
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      tokenId: '',
      alertType: 'price_above',
      threshold: 0,
      notificationMethod: 'app',
      description: '',
    },
  });
  
  // Create alert mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest('/api/alerts', {
        method: 'POST',
        data: values,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Alert created',
        description: 'Your alert has been created successfully.',
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating alert:', error);
      toast({
        title: 'Error creating alert',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (values: FormValues) => {
    mutate(values);
  };
  
  // Get the alert type label
  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'price_above': return 'Price rises above';
      case 'price_below': return 'Price falls below';
      case 'percent_change': return 'Price changes by';
      case 'volume_above': return 'Volume exceeds';
      case 'market_cap_above': return 'Market cap exceeds';
      default: return type;
    }
  };
  
  // Get selected token details
  const selectedTokenId = form.watch('tokenId');
  const selectedToken = tokens.find((token: Token) => token.id === selectedTokenId);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alert Name</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Bitcoin above $50k" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="tokenId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token</FormLabel>
              <div className="flex flex-col space-y-2">
                <Input
                  placeholder="Search tokens..."
                  value={tokenSearch}
                  onChange={(e) => setTokenSearch(e.target.value)}
                  className="mb-2"
                />
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a token" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {isLoadingTokens ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading tokens...
                        </div>
                      ) : filteredTokens.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          No tokens found
                        </div>
                      ) : (
                        filteredTokens.map((token: Token) => (
                          <SelectItem
                            key={token.id}
                            value={token.id}
                            className="flex items-center"
                          >
                            <div className="flex items-center">
                              {token.imageUrl && (
                                <img
                                  src={token.imageUrl}
                                  alt={token.name}
                                  className="w-5 h-5 mr-2"
                                />
                              )}
                              {token.name} ({token.symbol})
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="alertType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alert Type</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select alert type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price_above">Price rises above</SelectItem>
                      <SelectItem value="price_below">Price falls below</SelectItem>
                      <SelectItem value="percent_change">Price changes by (%)</SelectItem>
                      <SelectItem value="volume_above">Volume exceeds</SelectItem>
                      <SelectItem value="market_cap_above">Market cap exceeds</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="threshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Threshold Value</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    {form.watch('alertType') === 'percent_change' ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="5.0"
                        {...field}
                        className="pr-8"
                      />
                    ) : (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="50000"
                        {...field}
                        className="pr-8"
                      />
                    )}
                    <div className="ml-[-30px] text-muted-foreground">
                      {form.watch('alertType') === 'percent_change' ? '%' : '$'}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notificationMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Method</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app">In-App Notification</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="push">Push Notification</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add notes about this alert..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Alert'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};