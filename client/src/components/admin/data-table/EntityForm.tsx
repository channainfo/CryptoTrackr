import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Define field types
export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'boolean' 
  | 'select' 
  | 'date' 
  | 'password';

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: { value: string; label: string }[]; // For select fields
  description?: string;
  defaultValue?: any;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

interface EntityFormProps {
  fields: FormField[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  defaultValues?: Record<string, any>;
  isSubmitting?: boolean;
  submitLabel?: string;
  entity?: any;
}

export function EntityForm({
  fields,
  onSubmit,
  onCancel,
  defaultValues = {},
  isSubmitting = false,
  submitLabel = 'Save',
  entity,
}: EntityFormProps) {
  // Dynamically generate validation schema based on field definitions
  const generateSchema = () => {
    const schemaMap: Record<string, any> = {};
    
    fields.forEach(field => {
      let fieldSchema;
      
      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'password':
          fieldSchema = z.string();
          if (field.required) {
            fieldSchema = fieldSchema.min(1, `${field.label} is required`);
          } else {
            fieldSchema = fieldSchema.optional();
          }
          break;
          
        case 'number':
          fieldSchema = z.coerce.number();
          if (field.min !== undefined) fieldSchema = fieldSchema.min(field.min);
          if (field.max !== undefined) fieldSchema = fieldSchema.max(field.max);
          if (!field.required) fieldSchema = fieldSchema.optional();
          break;
          
        case 'boolean':
          fieldSchema = z.boolean().default(false);
          break;
          
        case 'select':
          fieldSchema = z.string();
          if (field.required) {
            fieldSchema = fieldSchema.min(1, `${field.label} is required`);
          } else {
            fieldSchema = fieldSchema.optional();
          }
          break;
          
        case 'date':
          // Store dates as ISO strings, use Date objects in UI
          fieldSchema = z.string().refine(
            (val) => !val || !isNaN(Date.parse(val)),
            { message: 'Invalid date format' }
          );
          if (!field.required) fieldSchema = fieldSchema.optional();
          break;
          
        default:
          fieldSchema = z.any();
      }
      
      schemaMap[field.name] = fieldSchema;
    });
    
    return z.object(schemaMap);
  };

  const formSchema = generateSchema();
  
  // Prepare initial form values by combining field defaults with provided defaultValues
  const prepareDefaultValues = () => {
    const values: Record<string, any> = {};
    
    fields.forEach(field => {
      // Prioritize passed defaultValues, then entity value, then field's defaultValue
      if (defaultValues && defaultValues[field.name] !== undefined) {
        values[field.name] = defaultValues[field.name];
      } else if (entity && entity[field.name] !== undefined) {
        // For dates, ensure we have a string
        if (field.type === 'date' && entity[field.name]) {
          const date = entity[field.name];
          values[field.name] = typeof date === 'string' ? date : date.toISOString();
        } else {
          values[field.name] = entity[field.name];
        }
      } else if (field.defaultValue !== undefined) {
        values[field.name] = field.defaultValue;
      } else {
        // Set appropriate empty values based on field type
        switch (field.type) {
          case 'text':
          case 'textarea':
          case 'password':
          case 'select':
            values[field.name] = '';
            break;
          case 'number':
            values[field.name] = field.min || 0;
            break;
          case 'boolean':
            values[field.name] = false;
            break;
          case 'date':
            values[field.name] = '';
            break;
        }
      }
    });
    
    return values;
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: prepareDefaultValues(),
  });

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <FormLabel>{field.label}</FormLabel>
                  <FormControl>
                    {field.type === 'text' && (
                      <Input
                        {...formField}
                        disabled={isSubmitting || field.readOnly}
                      />
                    )}
                    {field.type === 'textarea' && (
                      <Textarea
                        {...formField}
                        disabled={isSubmitting || field.readOnly}
                      />
                    )}
                    {field.type === 'number' && (
                      <Input
                        type="number"
                        {...formField}
                        min={field.min}
                        max={field.max}
                        step={field.step || 1}
                        onChange={(e) => 
                          formField.onChange(e.target.valueAsNumber)
                        }
                        disabled={isSubmitting || field.readOnly}
                      />
                    )}
                    {field.type === 'boolean' && (
                      <div className="pt-2">
                        <Checkbox
                          checked={formField.value}
                          onCheckedChange={formField.onChange}
                          disabled={isSubmitting || field.readOnly}
                        />
                      </div>
                    )}
                    {field.type === 'select' && field.options && (
                      <div className="w-full"> {/* Wrap in a div to satisfy Slot requirements */}
                        <Select
                          onValueChange={formField.onChange}
                          defaultValue={formField.value?.toString() || field.options[0]?.value || "placeholder"}
                          disabled={isSubmitting || field.readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((option) => (
                              <SelectItem 
                                key={option.value} 
                                value={option.value || "placeholder"} // Ensure no empty string values
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {field.type === 'date' && (
                      <Input
                        type="date"
                        {...formField}
                        disabled={isSubmitting || field.readOnly}
                      />
                    )}
                    {field.type === 'password' && (
                      <Input
                        type="password"
                        {...formField}
                        disabled={isSubmitting || field.readOnly}
                      />
                    )}
                  </FormControl>
                  {field.description && (
                    <FormDescription>{field.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}