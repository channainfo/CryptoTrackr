import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { DataTable } from './DataTable';
import { EntityForm, FormField } from './EntityForm';
import { ColumnDef } from '@tanstack/react-table';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EntityCrudComponentProps {
  entityName: string;
  entityLabel: string;
  columns: ColumnDef<any>[];
  formFields: FormField[];
  queryKey: string[];
  filterColumn?: string;
  apiBasePath?: string;
}

export function EntityCrudComponent({
  entityName,
  entityLabel,
  columns,
  formFields,
  queryKey,
  filterColumn = 'username',
  apiBasePath,
}: EntityCrudComponentProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getAdminAuthHeader, isAdmin } = useAdminAuth();

  // Derive API path from queryKey if not provided
  const basePath = apiBasePath || queryKey[0] || `/api/admin/${entityName.toLowerCase()}`;

  // Fetch entities
  const {
    data: entities,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const headers = getAdminAuthHeader();
      const response = await fetch(basePath, {
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text || response.statusText}`);
      }

      return await response.json();
    },
    enabled: isAdmin,
  });

  // Create entity mutation
  const createEntityMutation = useMutation({
    mutationFn: async (data: any) => {
      const headers = getAdminAuthHeader();
      return await apiRequest({
        url: basePath,
        method: 'POST',
        data,
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: `${entityLabel} Created`,
        description: `The ${entityLabel.toLowerCase()} has been created successfully.`,
      });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to create ${entityLabel.toLowerCase()}.`,
        variant: 'destructive',
      });
    },
  });

  // Update entity mutation
  const updateEntityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const headers = getAdminAuthHeader();
      return await apiRequest({
        url: `${basePath}/${id}`,
        method: 'PUT',
        data,
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: `${entityLabel} Updated`,
        description: `The ${entityLabel.toLowerCase()} has been updated successfully.`,
      });
      setIsEditDialogOpen(false);
      setSelectedEntity(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to update ${entityLabel.toLowerCase()}.`,
        variant: 'destructive',
      });
    },
  });

  // Delete entity mutation
  const deleteEntityMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = getAdminAuthHeader();
      await apiRequest({
        url: `${basePath}/${id}`,
        method: 'DELETE',
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: `${entityLabel} Deleted`,
        description: `The ${entityLabel.toLowerCase()} has been deleted successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to delete ${entityLabel.toLowerCase()}.`,
        variant: 'destructive',
      });
    },
  });

  // Batch delete mutation
  const deleteMultipleEntityMutation = useMutation({
    mutationFn: async (entities: any[]) => {
      const headers = getAdminAuthHeader();
      const ids = entities.map(entity => entity.id);
      
      await apiRequest({
        url: `${basePath}/batch`,
        method: 'DELETE',
        data: { ids },
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: `${entityLabel}s Deleted`,
        description: `The selected ${entityLabel.toLowerCase()}s have been deleted successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to delete selected ${entityLabel.toLowerCase()}s.`,
        variant: 'destructive',
      });
    },
  });

  // Handle create form submission
  const handleCreate = (data: any) => {
    createEntityMutation.mutate(data);
  };

  // Handle edit form submission
  const handleUpdate = (data: any) => {
    if (selectedEntity) {
      updateEntityMutation.mutate({ id: selectedEntity.id, data });
    }
  };

  // Handle delete
  const handleDelete = (entity: any) => {
    deleteEntityMutation.mutate(entity.id);
  };

  // Handle batch delete
  const handleDeleteMultiple = (entities: any[]) => {
    deleteMultipleEntityMutation.mutate(entities);
  };

  // Open edit dialog with selected entity
  const handleEdit = (entity: any) => {
    setSelectedEntity(entity);
    setIsEditDialogOpen(true);
  };

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading {entityLabel}s</CardTitle>
          <CardDescription>
            There was a problem loading the {entityLabel.toLowerCase()} data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey })}
            variant="outline"
          >
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{entityLabel} List</h2>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add {entityLabel}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={entities || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDeleteSelected={handleDeleteMultiple}
        filterColumn={filterColumn}
        entityName={entityLabel}
        isLoading={isLoading}
      />

      {/* Add Entity Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New {entityLabel}</DialogTitle>
            <DialogDescription>
              Create a new {entityLabel.toLowerCase()} by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          <EntityForm
            fields={formFields}
            onSubmit={handleCreate}
            onCancel={() => setIsAddDialogOpen(false)}
            isSubmitting={createEntityMutation.isPending}
            submitLabel="Create"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Entity Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit {entityLabel}</DialogTitle>
            <DialogDescription>
              Update the {entityLabel.toLowerCase()} information.
            </DialogDescription>
          </DialogHeader>
          <EntityForm
            fields={formFields}
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setSelectedEntity(null);
            }}
            isSubmitting={updateEntityMutation.isPending}
            submitLabel="Update"
            entity={selectedEntity}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}