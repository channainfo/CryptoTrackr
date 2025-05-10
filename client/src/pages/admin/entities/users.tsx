import React from 'react';
import { EntityCrudPage } from '@/components/admin/EntityCrudPage';
import { ColumnDef } from '@tanstack/react-table';
import { FormField } from '@/components/admin/data-table/EntityForm';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  // Define columns for the data table
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'username',
      header: 'Username',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'isAdmin',
      header: 'Admin Status',
      cell: ({ row }) => {
        const isAdmin = row.getValue('isAdmin');
        return isAdmin ? (
          <Badge variant="default" className="bg-red-500">Admin</Badge>
        ) : (
          <Badge variant="outline">User</Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return date ? new Date(date).toLocaleDateString() : '-';
      },
    },
  ];

  // Define form fields for creating/editing users
  const formFields: FormField[] = [
    { 
      name: 'username', 
      label: 'Username', 
      type: 'text' as const, 
      required: true,
      description: 'Unique username for the user'
    },
    { 
      name: 'email', 
      label: 'Email', 
      type: 'text' as const, 
      required: true,
      description: 'User email address'
    },
    { 
      name: 'password', 
      label: 'Password', 
      type: 'password' as const, 
      required: true,
      description: 'Set a secure password (only required for new users)'
    },
    { 
      name: 'isAdmin', 
      label: 'Admin Status', 
      type: 'boolean' as const, 
      description: 'Grant admin privileges to this user'
    },
  ];

  return (
    <EntityCrudPage
      entityName="users"
      entityLabel="User"
      columns={columns}
      formFields={formFields}
      queryKey={['/api/admin/users']}
      description="Manage all users in your application. Create, edit, and delete user accounts."
    />
  );
}