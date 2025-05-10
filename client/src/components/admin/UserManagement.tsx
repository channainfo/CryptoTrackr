import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { DataTable } from './data-table/DataTable';
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
import { UserForm } from './UserForm';

// Define user type
interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  walletAddress?: string;
  wallet_type?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserManagementProps {
  columns: ColumnDef<User>[];
}

export function UserManagement({ columns }: UserManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getAdminAuthHeader, isAdmin } = useAdminAuth();

  // Fetch users
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const headers = getAdminAuthHeader();
      const response = await fetch('/api/admin/users', {
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

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; isAdmin: boolean }) => {
      const headers = getAdminAuthHeader();
      return await apiRequest({
        url: '/api/admin/users',
        method: 'POST',
        data,
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: `User Created`,
        description: `The user has been created successfully.`,
      });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to create user.`,
        variant: 'destructive',
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { username?: string; isAdmin?: boolean } }) => {
      const headers = getAdminAuthHeader();
      return await apiRequest({
        url: `/api/admin/users/${id}`,
        method: 'PUT',
        data,
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: `User Updated`,
        description: `The user has been updated successfully.`,
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to update user.`,
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = getAdminAuthHeader();
      await apiRequest({
        url: `/api/admin/users/${id}`,
        method: 'DELETE',
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: `User Deleted`,
        description: `The user has been deleted successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to delete user.`,
        variant: 'destructive',
      });
    },
  });

  // Handle create form submission
  const handleCreate = (data: { username: string; isAdmin: boolean }) => {
    createUserMutation.mutate(data);
  };

  // Handle edit form submission
  const handleUpdate = (data: { username?: string; isAdmin?: boolean }) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data });
    }
  };

  // Handle delete
  const handleDelete = (user: User) => {
    deleteUserMutation.mutate(user.id);
  };

  // Open edit dialog with selected user
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Users</CardTitle>
          <CardDescription>
            There was a problem loading the user data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] })}
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
        <h2 className="text-xl font-semibold">User List</h2>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        filterColumn="username"
        entityName="User"
        isLoading={isLoading}
      />

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            onSubmit={handleCreate}
            onCancel={() => setIsAddDialogOpen(false)}
            isSubmitting={createUserMutation.isPending}
            submitLabel="Create"
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user information.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setSelectedUser(null);
            }}
            isSubmitting={updateUserMutation.isPending}
            submitLabel="Update"
            defaultValues={selectedUser ? { 
              username: selectedUser.username,
              isAdmin: selectedUser.isAdmin
            } : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}