import React from 'react';
import { EntityCrudPage } from '@/components/admin/EntityCrudPage';
import { ColumnDef } from '@tanstack/react-table';
import { FormField } from '@/components/admin/data-table/EntityForm';
import { Badge } from '@/components/ui/badge';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  order: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function LearningModulesManagement() {
  // Define columns for the data table
  const columns: ColumnDef<LearningModule>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.getValue('category') as string;
        return (
          <Badge variant="outline" className="capitalize">
            {category?.toLowerCase().replace('_', ' ') || 'Unknown'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'difficulty',
      header: 'Difficulty',
      cell: ({ row }) => {
        const difficulty = row.getValue('difficulty') as string;
        return (
          <Badge
            variant={
              difficulty === 'beginner'
                ? 'default'
                : difficulty === 'intermediate'
                ? 'secondary'
                : 'destructive'
            }
            className="capitalize"
          >
            {difficulty || 'Unknown'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge 
            variant={status === 'published' ? 'default' : 'outline'}
            className="capitalize"
          >
            {status || 'Draft'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'order',
      header: 'Order',
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

  // Define form fields for creating/editing learning modules
  const formFields: FormField[] = [
    { 
      name: 'title', 
      label: 'Title', 
      type: 'text' as const, 
      required: true,
      description: 'Title of the learning module'
    },
    { 
      name: 'description', 
      label: 'Description', 
      type: 'textarea' as const, 
      required: true,
      description: 'Detailed description of the learning module'
    },
    { 
      name: 'category', 
      label: 'Category', 
      type: 'select' as const,
      options: [
        { label: 'Basics', value: 'basics' },
        { label: 'Blockchain', value: 'blockchain' },
        { label: 'Trading', value: 'trading' },
        { label: 'DeFi', value: 'defi' },
        { label: 'Security', value: 'security' },
        { label: 'NFTs', value: 'nfts' },
      ],
      required: true,
      description: 'Category for grouping learning modules'
    },
    { 
      name: 'difficulty', 
      label: 'Difficulty', 
      type: 'select' as const,
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
      required: true,
      description: 'Difficulty level for the module'
    },
    { 
      name: 'order', 
      label: 'Display Order', 
      type: 'number' as const, 
      required: true,
      description: 'The order in which this module appears in listings'
    },
    { 
      name: 'status', 
      label: 'Status', 
      type: 'select' as const,
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
        { label: 'Archived', value: 'archived' },
      ],
      required: true,
      description: 'Current status of the learning module'
    },
  ];

  return (
    <EntityCrudPage
      entityName="learning-modules"
      entityLabel="Learning Module"
      columns={columns}
      formFields={formFields}
      queryKey={['/api/admin/learning-modules']}
      description="Manage educational content for your users. Create, edit, and organize learning modules."
    />
  );
}