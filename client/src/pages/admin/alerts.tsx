import React from 'react';
import { EntityCrudPage } from '@/components/admin/EntityCrudPage';
import { ColumnDef } from '@tanstack/react-table';
import { FormField } from '@/components/admin/data-table/EntityForm';
import { Badge } from '@/components/ui/badge';

interface Alert {
  id: string;
  userId: string;
  username?: string;
  tokenId: string;
  tokenSymbol?: string;
  alertType: string;
  threshold: number;
  status: string;
  createdAt: string;
  triggeredAt?: string;
}

export default function AlertsManagement() {
  // Define columns for the data table
  const columns: ColumnDef<Alert>[] = [
    {
      accessorKey: 'username',
      header: 'User',
    },
    {
      accessorKey: 'tokenSymbol',
      header: 'Token',
    },
    {
      accessorKey: 'alertType',
      header: 'Alert Type',
      cell: ({ row }) => {
        const alertType = row.getValue('alertType') as string;
        return (
          <Badge variant="outline" className="capitalize">
            {alertType?.replace('_', ' ') || 'Unknown'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'threshold',
      header: 'Threshold',
      cell: ({ row }) => {
        const threshold = row.getValue('threshold') as number;
        const alertType = row.getValue('alertType') as string;
        
        if (alertType?.includes('percent')) {
          return `${threshold}%`;
        }
        
        return threshold;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge 
            variant={
              status === 'active'
                ? 'default'
                : status === 'triggered'
                ? 'secondary'
                : 'outline'
            }
            className="capitalize"
          >
            {status || 'Unknown'}
          </Badge>
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
    {
      accessorKey: 'triggeredAt',
      header: 'Triggered At',
      cell: ({ row }) => {
        const date = row.getValue('triggeredAt') as string;
        return date ? new Date(date).toLocaleDateString() : '-';
      },
    },
  ];

  // Define form fields for creating/editing alerts
  const formFields: FormField[] = [
    { 
      name: 'userId', 
      label: 'User ID', 
      type: 'text' as const, 
      required: true,
      description: 'ID of the user who owns this alert'
    },
    { 
      name: 'tokenId', 
      label: 'Token ID', 
      type: 'text' as const, 
      required: true,
      description: 'ID of the token to monitor'
    },
    { 
      name: 'alertType', 
      label: 'Alert Type', 
      type: 'select' as const,
      options: [
        { label: 'Price Above', value: 'price_above' },
        { label: 'Price Below', value: 'price_below' },
        { label: 'Percent Change', value: 'percent_change' },
        { label: 'Volume Above', value: 'volume_above' },
        { label: 'Market Cap Above', value: 'market_cap_above' },
      ],
      required: true,
      description: 'Type of condition to monitor'
    },
    { 
      name: 'threshold', 
      label: 'Threshold', 
      type: 'number' as const, 
      required: true,
      description: 'Value that triggers the alert'
    },
    { 
      name: 'status', 
      label: 'Status', 
      type: 'select' as const,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Triggered', value: 'triggered' },
        { label: 'Disabled', value: 'disabled' },
      ],
      required: true,
      description: 'Current status of the alert'
    },
  ];

  return (
    <EntityCrudPage
      entityName="alerts"
      entityLabel="Alert"
      columns={columns}
      formFields={formFields}
      queryKey={['/api/admin/alerts']}
      description="Manage price alerts for users. Create, edit, and view triggered alerts."
    />
  );
}