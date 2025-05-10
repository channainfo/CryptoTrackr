import React from 'react';
import { EntityCrudPage } from '@/components/admin/EntityCrudPage';
import { ColumnDef } from '@tanstack/react-table';
import { FormField } from '@/components/admin/data-table/EntityForm';
import { Badge } from '@/components/ui/badge';

interface MarketData {
  id: string;
  tokenId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  priceChangePercentage24h: number;
  lastUpdated: string;
}

export default function MarketDataManagement() {
  // Define columns for the data table
  const columns: ColumnDef<MarketData>[] = [
    {
      accessorKey: 'symbol',
      header: 'Symbol',
      cell: ({ row }) => {
        const symbol = row.getValue('symbol') as string;
        const name = row.getValue('name') as string;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{symbol?.toUpperCase()}</span>
            <span className="text-xs text-muted-foreground">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'currentPrice',
      header: 'Price (USD)',
      cell: ({ row }) => {
        const price = row.getValue('currentPrice') as number;
        return price 
          ? `$${price.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: price < 1 ? 8 : 2 
            })}` 
          : '-';
      },
    },
    {
      accessorKey: 'priceChangePercentage24h',
      header: '24h Change',
      cell: ({ row }) => {
        const change = row.getValue('priceChangePercentage24h') as number;
        const isPositive = change >= 0;
        return (
          <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
            {change ? `${isPositive ? '+' : ''}${change.toFixed(2)}%` : '0%'}
          </span>
        );
      },
    },
    {
      accessorKey: 'marketCap',
      header: 'Market Cap',
      cell: ({ row }) => {
        const marketCap = row.getValue('marketCap') as number;
        return marketCap 
          ? `$${(marketCap / 1000000).toFixed(2)}M` 
          : '-';
      },
    },
    {
      accessorKey: 'volume24h',
      header: 'Volume (24h)',
      cell: ({ row }) => {
        const volume = row.getValue('volume24h') as number;
        return volume 
          ? `$${(volume / 1000000).toFixed(2)}M` 
          : '-';
      },
    },
    {
      accessorKey: 'circulatingSupply',
      header: 'Circulating Supply',
      cell: ({ row }) => {
        const supply = row.getValue('circulatingSupply') as number;
        const symbol = row.getValue('symbol') as string;
        return supply 
          ? `${supply.toLocaleString()} ${symbol?.toUpperCase()}` 
          : '-';
      },
    },
    {
      accessorKey: 'lastUpdated',
      header: 'Last Updated',
      cell: ({ row }) => {
        const date = row.getValue('lastUpdated') as string;
        return date ? new Date(date).toLocaleString() : '-';
      },
    },
  ];

  // Define form fields for creating/editing market data
  const formFields: FormField[] = [
    { 
      name: 'tokenId', 
      label: 'Token ID', 
      type: 'text' as const, 
      required: true,
      description: 'ID of the cryptocurrency token'
    },
    { 
      name: 'symbol', 
      label: 'Symbol', 
      type: 'text' as const, 
      required: true,
      description: 'Symbol of the cryptocurrency (e.g., BTC)'
    },
    { 
      name: 'name', 
      label: 'Name', 
      type: 'text' as const, 
      required: true,
      description: 'Full name of the cryptocurrency (e.g., Bitcoin)'
    },
    { 
      name: 'currentPrice', 
      label: 'Current Price (USD)', 
      type: 'number' as const, 
      required: true,
      description: 'Current price in USD'
    },
    { 
      name: 'marketCap', 
      label: 'Market Cap (USD)', 
      type: 'number' as const, 
      required: true,
      description: 'Total market capitalization in USD'
    },
    { 
      name: 'volume24h', 
      label: '24h Volume (USD)', 
      type: 'number' as const, 
      required: true,
      description: 'Trading volume in the last 24 hours in USD'
    },
    { 
      name: 'priceChangePercentage24h', 
      label: '24h Price Change (%)', 
      type: 'number' as const, 
      required: true,
      description: 'Percentage price change in the last 24 hours'
    },
    { 
      name: 'circulatingSupply', 
      label: 'Circulating Supply', 
      type: 'number' as const, 
      required: true,
      description: 'Number of coins currently circulating'
    },
    { 
      name: 'totalSupply', 
      label: 'Total Supply', 
      type: 'number' as const, 
      description: 'Maximum number of coins that will ever exist'
    },
  ];

  return (
    <EntityCrudPage
      entityName="market-data"
      entityLabel="Market Data"
      columns={columns}
      formFields={formFields}
      queryKey={['/api/admin/market-data']}
      description="Manage cryptocurrency market data. Update current prices, market stats, and related information."
    />
  );
}