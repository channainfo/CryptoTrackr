import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { UserManagement } from '@/components/admin/UserManagement';

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  walletAddress?: string;
  wallet_type?: string; // Matches database column name
  createdAt: string;
  updatedAt: string;
}

export default function UsersManagementPage() {
  // Define columns for the data table
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'username',
      header: 'Username',
    },

    {
      accessorKey: 'walletAddress',
      header: 'Wallet',
      cell: ({ row }) => {
        const address = row.getValue('walletAddress') as string;
        const type = row.original.wallet_type as string;

        if (!address) return '-';

        return (
          <div className="flex flex-col">
            <span className="font-medium">{`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}</span>
            {type && <span className="text-xs text-muted-foreground capitalize">{type}</span>}
          </div>
        );
      },
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

  return (
    <div className="space-y-4">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage all users in your application. Create, edit, and delete user accounts.
        </p>
      </header>

      <UserManagement columns={columns} />
    </div>
  );
}