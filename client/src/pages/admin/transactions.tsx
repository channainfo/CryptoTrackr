import React from 'react';
import { EntityCrudPage } from '@/components/admin/EntityCrudPage';
import { ColumnDef } from '@tanstack/react-table';
import { FormField } from '@/components/admin/data-table/EntityForm';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  userId: string;
  username?: string;
  cryptoId: string;
  cryptoName?: string;
  cryptoSymbol?: string;
  type: string;
  quantity: number;
  price: number;
  value: number;
  timestamp: string;
}

export default function TransactionsManagement() {
  // Define columns for the data table
  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'username',
      header: 'User',
    },
    {
      accessorKey: 'cryptoSymbol',
      header: 'Token',
      cell: ({ row }) => {
        const symbol = row.getValue('cryptoSymbol') as string;
        const name = row.getValue('cryptoName') as string;
        return symbol ? (
          <div className="flex flex-col">
            <span className="font-medium">{symbol}</span>
            <span className="text-xs text-muted-foreground">{name}</span>
          </div>
        ) : '-';
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <Badge 
            variant={type === 'buy' ? 'default' : 'destructive'} 
            className="capitalize"
          >
            {type || 'Unknown'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => {
        const quantity = row.getValue('quantity') as number;
        const symbol = row.getValue('cryptoSymbol') as string;
        return quantity ? `${quantity} ${symbol || ''}` : '-';
      },
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => {
        const price = row.getValue('price') as number;
        return price ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}` : '-';
      },
    },
    {
      accessorKey: 'value',
      header: 'Total Value',
      cell: ({ row }) => {
        const value = row.getValue('value') as number;
        return value ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
      },
    },
    {
      accessorKey: 'timestamp',
      header: 'Date',
      cell: ({ row }) => {
        const date = row.getValue('timestamp') as string;
        return date ? new Date(date).toLocaleString() : '-';
      },
    },
  ];

  // Define form fields for creating/editing transactions
  const formFields: FormField[] = [
    { 
      name: 'userId', 
      label: 'User ID', 
      type: 'text' as const, 
      required: true,
      description: 'ID of the user who performed this transaction'
    },
    { 
      name: 'cryptoId', 
      label: 'Token ID', 
      type: 'text' as const, 
      required: true,
      description: 'ID of the cryptocurrency token'
    },
    { 
      name: 'cryptoSymbol', 
      label: 'Token Symbol', 
      type: 'text' as const, 
      required: true,
      description: 'Symbol of the cryptocurrency (e.g., BTC)'
    },
    { 
      name: 'cryptoName', 
      label: 'Token Name', 
      type: 'text' as const, 
      required: true,
      description: 'Full name of the cryptocurrency (e.g., Bitcoin)'
    },
    { 
      name: 'type', 
      label: 'Transaction Type', 
      type: 'select' as const,
      options: [
        { label: 'Buy', value: 'buy' },
        { label: 'Sell', value: 'sell' },
      ],
      required: true,
      description: 'Type of transaction'
    },
    { 
      name: 'quantity', 
      label: 'Quantity', 
      type: 'number' as const, 
      required: true,
      description: 'Amount of cryptocurrency in the transaction'
    },
    { 
      name: 'price', 
      label: 'Price per Unit', 
      type: 'number' as const, 
      required: true,
      description: 'Price per unit in USD'
    },
    { 
      name: 'timestamp', 
      label: 'Transaction Date', 
      type: 'text' as const, 
      required: true,
      description: 'Date and time of the transaction'
    },
  ];

  return (
    <EntityCrudPage
      entityName="transactions"
      entityLabel="Transaction"
      columns={columns}
      formFields={formFields}
      queryKey={['/api/admin/transactions']}
      description="Manage user transaction records. View, add, and edit buy/sell transactions."
    />
  );
}