import React from 'react';
import { EntityCrudPage } from '@/components/admin/EntityCrudPage';
import { ColumnDef } from '@tanstack/react-table';
import { FormField } from '@/components/admin/data-table/EntityForm';
import { Badge } from '@/components/ui/badge';

interface UserWallet {
  id: string;
  userId: string;
  username?: string;
  address: string;
  chainType: string;
  label: string;
  isActive: boolean;
  lastSynced?: string;
  createdAt: string;
}

export default function WalletsManagement() {
  // Define columns for the data table
  const columns: ColumnDef<UserWallet>[] = [
    {
      accessorKey: 'username',
      header: 'User',
    },
    {
      accessorKey: 'address',
      header: 'Wallet Address',
      cell: ({ row }) => {
        const address = row.getValue('address') as string;
        if (!address) return '-';
        
        // Truncate wallet address for display
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      },
    },
    {
      accessorKey: 'chainType',
      header: 'Chain',
      cell: ({ row }) => {
        const chainType = row.getValue('chainType') as string;
        return (
          <Badge 
            variant={
              chainType === 'ethereum'
                ? 'default'
                : chainType === 'solana'
                ? 'secondary'
                : chainType === 'base'
                ? 'outline'
                : 'destructive'
            }
            className="capitalize"
          >
            {chainType || 'Unknown'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'label',
      header: 'Label',
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive');
        return isActive ? (
          <Badge variant="default">Active</Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        );
      },
    },
    {
      accessorKey: 'lastSynced',
      header: 'Last Synced',
      cell: ({ row }) => {
        const date = row.getValue('lastSynced') as string;
        return date ? new Date(date).toLocaleString() : 'Never';
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Added On',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return date ? new Date(date).toLocaleDateString() : '-';
      },
    },
  ];

  // Define form fields for creating/editing user wallets
  const formFields: FormField[] = [
    { 
      name: 'userId', 
      label: 'User ID', 
      type: 'text' as const, 
      required: true,
      description: 'ID of the user who owns this wallet'
    },
    { 
      name: 'address', 
      label: 'Wallet Address', 
      type: 'text' as const, 
      required: true,
      description: 'Public address of the wallet'
    },
    { 
      name: 'chainType', 
      label: 'Blockchain Type', 
      type: 'select' as const,
      options: [
        { label: 'Ethereum', value: 'ethereum' },
        { label: 'Solana', value: 'solana' },
        { label: 'Base', value: 'base' },
        { label: 'Sui', value: 'sui' },
      ],
      required: true,
      description: 'Blockchain network for this wallet'
    },
    { 
      name: 'label', 
      label: 'Label', 
      type: 'text' as const, 
      required: true,
      description: 'User-defined label for this wallet'
    },
    { 
      name: 'isActive', 
      label: 'Active Status', 
      type: 'boolean' as const, 
      description: 'Whether this wallet is currently active'
    },
  ];

  return (
    <EntityCrudPage
      entityName="wallets"
      entityLabel="User Wallet"
      columns={columns}
      formFields={formFields}
      queryKey={['/api/admin/wallets']}
      description="Manage user wallet connections. View and manage wallet addresses linked to user accounts."
    />
  );
}