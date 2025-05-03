import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  alertType: z.enum(['price_above', 'price_below', 'percent_change', 'volume_above', 'market_cap_above']),
  threshold: z.coerce.number().positive('Threshold must be positive'),
  status: z.enum(['active', 'triggered', 'disabled']),
  notificationMethod: z.string(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Alert {
  id: string;
  userId: string;
  tokenId: string;
  alertType: string;
  threshold: number;
  status: string;
  notificationSent: boolean;
  notificationMethod: string;
  lastTriggeredAt: string | null;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  token?: {
    id: string;
    symbol: string;
    name: string;
    imageUrl: string | null;
  };
}

interface EditAlertFormProps {
  alert: Alert;
  onSuccess: () => void;
}

export const EditAlertForm = ({ alert, onSuccess }: EditAlertFormProps) => {
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: alert.name,
      alertType: alert.alertType as any,
      threshold: Number(alert.threshold),
      status: alert.status as any,
      notificationMethod: alert.notificationMethod,
      description: alert.description || '',
    },
  });
  
  // Update alert mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest(`/api/alerts/${alert.id}`, {
        method: 'PATCH',
        data: values,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Alert updated',
        description: 'Your alert has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating alert:', error);
      toast({
        title: 'Error updating alert',
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
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center mb-4">
          <div className="flex items-center flex-1">
            {alert.token?.imageUrl && (
              <img
                src={alert.token.imageUrl}
                alt={alert.token.name}
                className="w-6 h-6 mr-2"
              />
            )}
            <span className="font-medium">
              {alert.token?.name} ({alert.token?.symbol})
            </span>
          </div>
        </div>
      
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alert Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
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
                        {...field}
                        className="pr-8"
                      />
                    ) : (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="triggered">Triggered</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
        </div>
        
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
        
        {alert.lastTriggeredAt && (
          <div className="text-sm text-muted-foreground">
            Last triggered: {new Date(alert.lastTriggeredAt).toLocaleString()}
          </div>
        )}
        
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
                Updating...
              </>
            ) : (
              'Update Alert'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};