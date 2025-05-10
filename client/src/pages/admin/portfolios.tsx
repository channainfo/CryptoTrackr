import React from 'react';
import { EntityCrudPage } from '@/components/admin/EntityCrudPage';
import { ColumnDef } from '@tanstack/react-table';
import { FormField } from '@/components/admin/data-table/EntityForm';
import { Badge } from '@/components/ui/badge';

interface Portfolio {
  id: string;
  userId: string;
  username?: string;
  name: string;
  description: string;
  isDefault: boolean;
  totalValue: number;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function PortfoliosManagement() {
  // Define columns for the data table
  const columns: ColumnDef<Portfolio>[] = [
    {
      accessorKey: 'username',
      header: 'User',
    },
    {
      accessorKey: 'name',
      header: 'Portfolio Name',
    },
    {
      accessorKey: 'isDefault',
      header: 'Default',
      cell: ({ row }) => {
        const isDefault = row.getValue('isDefault');
        return isDefault ? (
          <Badge variant="default">Default</Badge>
        ) : (
          <Badge variant="outline">No</Badge>
        );
      },
    },
    {
      accessorKey: 'totalValue',
      header: 'Total Value',
      cell: ({ row }) => {
        const value = row.getValue('totalValue') as number;
        return value ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';
      },
    },
    {
      accessorKey: 'assetCount',
      header: 'Assets',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return date ? new Date(date).toLocaleDateString() : '-';
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      cell: ({ row }) => {
        const date = row.getValue('updatedAt') as string;
        return date ? new Date(date).toLocaleDateString() : '-';
      },
    },
  ];

  // Define form fields for creating/editing portfolios
  const formFields: FormField[] = [
    { 
      name: 'userId', 
      label: 'User ID', 
      type: 'text' as const, 
      required: true,
      description: 'ID of the user who owns this portfolio'
    },
    { 
      name: 'name', 
      label: 'Portfolio Name', 
      type: 'text' as const, 
      required: true,
      description: 'Name of the portfolio'
    },
    { 
      name: 'description', 
      label: 'Description', 
      type: 'textarea' as const,
      description: 'Optional description of the portfolio'
    },
    { 
      name: 'isDefault', 
      label: 'Default Portfolio', 
      type: 'boolean' as const,
      description: 'Whether this is the user\'s default portfolio'
    },
  ];

  return (
    <EntityCrudPage
      entityName="portfolios"
      entityLabel="Portfolio"
      columns={columns}
      formFields={formFields}
      queryKey={['/api/admin/portfolios']}
      description="Manage user portfolios. View and edit portfolio details and settings."
    />
  );
}