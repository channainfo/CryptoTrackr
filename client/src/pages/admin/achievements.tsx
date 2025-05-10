import React from 'react';
import { EntityCrudPage } from '@/components/admin/EntityCrudPage';
import { ColumnDef } from '@tanstack/react-table';
import { FormField } from '@/components/admin/data-table/EntityForm';
import { Badge } from '@/components/ui/badge';

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: string;
  threshold: number;
  icon: string;
  points: number;
  rarity: string;
  createdAt: string;
  updatedAt: string;
}

export default function AchievementsManagement() {
  // Define columns for the data table
  const columns: ColumnDef<Achievement>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <Badge variant="outline" className="capitalize">
            {type?.toLowerCase().replace('_', ' ') || 'Unknown'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'threshold',
      header: 'Threshold',
    },
    {
      accessorKey: 'points',
      header: 'Points',
    },
    {
      accessorKey: 'rarity',
      header: 'Rarity',
      cell: ({ row }) => {
        const rarity = row.getValue('rarity') as string;
        return (
          <Badge 
            variant={
              rarity === 'common'
                ? 'outline'
                : rarity === 'uncommon'
                ? 'default'
                : rarity === 'rare'
                ? 'secondary'
                : 'destructive'
            }
            className="capitalize"
          >
            {rarity || 'Unknown'}
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
  ];

  // Define form fields for creating/editing achievements
  const formFields: FormField[] = [
    { 
      name: 'title', 
      label: 'Title', 
      type: 'text' as const, 
      required: true,
      description: 'Name of the achievement'
    },
    { 
      name: 'description', 
      label: 'Description', 
      type: 'textarea' as const, 
      required: true,
      description: 'Description of how to earn the achievement'
    },
    { 
      name: 'type', 
      label: 'Type', 
      type: 'select' as const,
      options: [
        { label: 'Transaction Count', value: 'transaction_count' },
        { label: 'Portfolio Value', value: 'portfolio_value' },
        { label: 'Login Streak', value: 'login_streak' },
        { label: 'Learning Progress', value: 'learning_progress' },
        { label: 'Token Diversity', value: 'token_diversity' },
      ],
      required: true,
      description: 'Type of activity that earns this achievement'
    },
    { 
      name: 'threshold', 
      label: 'Threshold', 
      type: 'number' as const, 
      required: true,
      description: 'Value that must be reached to earn this achievement'
    },
    { 
      name: 'icon', 
      label: 'Icon', 
      type: 'text' as const, 
      required: true,
      description: 'Icon name from the Lucide icon set'
    },
    { 
      name: 'points', 
      label: 'Points', 
      type: 'number' as const, 
      required: true,
      description: 'Point value of this achievement'
    },
    { 
      name: 'rarity', 
      label: 'Rarity', 
      type: 'select' as const,
      options: [
        { label: 'Common', value: 'common' },
        { label: 'Uncommon', value: 'uncommon' },
        { label: 'Rare', value: 'rare' },
        { label: 'Legendary', value: 'legendary' },
      ],
      required: true,
      description: 'Rarity level of this achievement'
    },
  ];

  return (
    <EntityCrudPage
      entityName="achievements"
      entityLabel="Achievement"
      columns={columns}
      formFields={formFields}
      queryKey={['/api/admin/achievements']}
      description="Manage user achievements for gamification. Create and edit achievements to incentivize platform usage."
    />
  );
}