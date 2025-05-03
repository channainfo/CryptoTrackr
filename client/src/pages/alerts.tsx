import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw 
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreateAlertForm } from '@/components/alerts/CreateAlertForm';
import { EditAlertForm } from '@/components/alerts/EditAlertForm';

// Types for our alerts
type AlertType = 'price_above' | 'price_below' | 'percent_change' | 'volume_above' | 'market_cap_above';
type AlertStatus = 'active' | 'triggered' | 'disabled';

interface Alert {
  id: string;
  userId: string;
  tokenId: string;
  alertType: AlertType;
  threshold: number;
  status: AlertStatus;
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
  typeLabel?: string;
  formattedThreshold?: string;
}

const AlertsPage = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch alerts data
  const { data: alerts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/alerts'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  }) as { data: Alert[], isLoading: boolean, isError: boolean, refetch: () => void };
  
  // Check alerts manually (for testing)
  const { mutate: checkAlerts, isPending: isChecking } = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/alerts/check', {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Alerts checked',
        description: `Checked ${data.totalChecked} alerts, ${data.triggered} triggered`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error checking alerts',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      console.error('Error checking alerts:', error);
    },
  });
  
  // Delete alert
  const { mutate: deleteAlert, isPending: isDeleting } = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest(`/api/alerts/${alertId}`, {
        method: 'DELETE',
      });
      return alertId;
    },
    onSuccess: (alertId) => {
      toast({
        title: 'Alert deleted',
        description: 'The alert has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      setDeleteAlertId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error deleting alert',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      console.error('Error deleting alert:', error);
      setDeleteAlertId(null);
    },
  });
  
  const handleEditClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setEditDialogOpen(true);
  };
  
  const handleDeleteClick = (alertId: string) => {
    setDeleteAlertId(alertId);
  };
  
  const confirmDelete = () => {
    if (deleteAlertId) {
      deleteAlert(deleteAlertId);
    }
  };
  
  const getStatusColor = (status: AlertStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'triggered': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'disabled': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  const getAlertTypeIcon = (alertType: AlertType) => {
    switch (alertType) {
      case 'price_above': return '↗️';
      case 'price_below': return '↘️';
      case 'percent_change': return '%';
      case 'volume_above': return '📊';
      case 'market_cap_above': return '💰';
      default: return '⚠️';
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading alerts...</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Error loading alerts</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't load your alerts. Please try again later.
        </p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Get notified when the market conditions meet your criteria
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => checkAlerts()}
            disabled={isChecking}
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Check Alerts
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Create Alert</DialogTitle>
                <DialogDescription>
                  Set up a new alert to notify you when market conditions match your criteria.
                </DialogDescription>
              </DialogHeader>
              <CreateAlertForm onSuccess={() => setCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-muted/20 rounded-lg p-8">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No alerts yet</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Create your first alert to get notified when specific market conditions are met.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alerts.map((alert: Alert) => (
            <Card key={alert.id} className="overflow-hidden relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg truncate">
                      {alert.name}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      {alert.token?.imageUrl && (
                        <img 
                          src={alert.token.imageUrl} 
                          alt={alert.token.name} 
                          className="w-5 h-5 mr-1"
                        />
                      )}
                      {alert.token?.name || "Unknown"} ({alert.token?.symbol || "?"})
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(alert.status)}>
                    {alert.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center font-medium mt-1 mb-2">
                  <span className="text-2xl mr-2">{getAlertTypeIcon(alert.alertType)}</span>
                  <span>{alert.typeLabel || alert.alertType}</span>
                  <span className="mx-2">→</span>
                  <span className="text-primary font-bold">
                    {alert.formattedThreshold || alert.threshold}
                  </span>
                </div>
                
                {alert.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {alert.description}
                  </p>
                )}
                
                {alert.lastTriggeredAt && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      Last triggered: {formatDate(alert.lastTriggeredAt)}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-1 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(alert)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(alert.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Alert Dialog */}
      {selectedAlert && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Edit Alert</DialogTitle>
              <DialogDescription>
                Modify your alert settings.
              </DialogDescription>
            </DialogHeader>
            <EditAlertForm 
              alert={selectedAlert} 
              onSuccess={() => {
                setEditDialogOpen(false);
                setSelectedAlert(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAlertId} onOpenChange={(open) => !open && setDeleteAlertId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the alert from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AlertsPage;