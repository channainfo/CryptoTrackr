import React from "react";
import { AdminLayout } from "./AdminLayout";
import { EntityCrudComponent } from "./data-table/EntityCrudComponent";
import { ColumnDef } from "@tanstack/react-table";
import { FormField } from "./data-table/EntityForm";

interface EntityCrudPageProps {
  entityName: string;
  entityLabel: string;
  columns: ColumnDef<any>[];
  formFields: FormField[];
  queryKey: string[];
  filterColumn?: string;
  apiBasePath?: string;
  description?: string;
}

export function EntityCrudPage({
  entityName,
  entityLabel,
  columns,
  formFields,
  queryKey,
  filterColumn,
  apiBasePath,
  description,
}: EntityCrudPageProps) {
  return (
    <div className="space-y-4">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">
          {entityLabel} Management
        </h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </header>

      <EntityCrudComponent
        entityName={entityName}
        entityLabel={entityLabel}
        columns={columns}
        formFields={formFields}
        queryKey={queryKey}
        filterColumn={filterColumn}
        apiBasePath={apiBasePath}
      />
    </div>
  );
}
