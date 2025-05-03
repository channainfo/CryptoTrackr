import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
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
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Alert type options
const alertTypeOptions = [
  { value: 'price_above', label: 'Price Above' },
  { value: 'price_below', label: 'Price Below' },
  { value: 'percent_change', label: 'Percent Change (24h)' },
  { value: 'volume_above', label: 'Volume Above' },
  { value: 'market_cap_above', label: 'Market Cap Above' },
];

// Form schema using zod
const formSchema = z.object({
  name: z.string().min(1, 'Alert name is required').max(100),
  description: z.string().max(500).optional(),
  alertType: z.enum(['price_above', 'price_below', 'percent_change', 'volume_above', 'market_cap_above']),
  threshold: z.coerce.number()
    .min(0.000001, 'Threshold must be greater than 0')
    .refine(val => !isNaN(val), {
      message: 'Threshold must be a valid number',
    }),
  notificationMethod: z.enum(['email', 'push', 'sms']).default('email'),
  status: z.enum(['active', 'triggered', 'disabled']).default('active'),
});

// Infer the type from the schema
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

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: alert.name,
      description: alert.description || '',
      alertType: alert.alertType as any,
      threshold: alert.threshold,
      notificationMethod: alert.notificationMethod as any,
      status: alert.status as any,
    },
  });

  // Update alert mutation
  const { mutate: updateAlert, isPending } = useMutation({
    mutationFn: async (values: any) => {
      return apiRequest(`/api/alerts/${alert.id}`, {
        method: 'PATCH',
        data: values,
      });
    },
    onSuccess: (data) => {
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
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // Convert threshold to string to match the database schema expectation
    const dataToSubmit = {
      ...values,
      threshold: values.threshold.toString()
    };
    updateAlert(dataToSubmit);
  };

  // Determine if we should show currency symbol
  const shouldShowCurrencySymbol = (alertType: string) => {
    return ['price_above', 'price_below', 'market_cap_above'].includes(alertType);
  };

  // Get placeholder text for threshold based on alert type
  const getThresholdPlaceholder = (alertType: string) => {
    switch (alertType) {
      case 'price_above':
      case 'price_below':
        return 'e.g. 50000';
      case 'percent_change':
        return 'e.g. 5 (for 5%)';
      case 'volume_above':
        return 'e.g. 1000000';
      case 'market_cap_above':
        return 'e.g. 1000000000';
      default:
        return 'Enter threshold value';
    }
  };

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
                <Input placeholder="e.g. BTC above $50k" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for your alert
              </FormDescription>
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
                  placeholder="Additional details about this alert"
                  className="resize-none"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 bg-muted/30 p-3 rounded-md">
          <div className="font-medium">Token:</div>
          <div className="flex items-center">
            {alert.token?.imageUrl && (
              <img
                src={alert.token.imageUrl}
                alt={alert.token.name}
                className="w-5 h-5 mr-1"
              />
            )}
            {alert.token?.name || "Unknown"} ({alert.token?.symbol || "?"})
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="alertType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alert Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select alert type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {alertTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The condition to trigger the alert
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="threshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Threshold</FormLabel>
                <FormControl>
                  <div className="relative">
                    {shouldShowCurrencySymbol(form.watch('alertType')) && (
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-muted-foreground">$</span>
                      </div>
                    )}
                    <Input
                      type="number"
                      placeholder={getThresholdPlaceholder(form.watch('alertType'))}
                      className={shouldShowCurrencySymbol(form.watch('alertType')) ? 'pl-7' : ''}
                      step="any"
                      {...field}
                    />
                    {form.watch('alertType') === 'percent_change' && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-muted-foreground">%</span>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  The value that will trigger this alert
                </FormDescription>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How you would like to be notified
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="triggered">Triggered</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Enable or disable this alert
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={isPending}>
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