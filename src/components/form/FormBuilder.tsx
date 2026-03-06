'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GripVertical, Plus, Trash2, Copy, MoveUp, MoveDown } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type FieldType = 'text' | 'email' | 'number' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormBuilderProps {
  initialFields?: FormField[];
  onChange?: (fields: FormField[]) => void;
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Teks' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Angka' },
  { value: 'tel', label: 'Telepon' },
  { value: 'textarea', label: 'Area Teks' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Kotak Centang' },
  { value: 'radio', label: 'Pilihan' },
  { value: 'date', label: 'Tanggal' },
];

interface SortableFieldProps {
  field: FormField;
  onRemove: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDuplicate: () => void;
}

function SortableField({ field, onRemove, onUpdate, onDuplicate }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border rounded-lg p-4 bg-card',
        isDragging && 'shadow-lg opacity-90'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipe Field</Label>
              <Select
                value={field.type}
                onValueChange={(value: FieldType) => onUpdate({ type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder="Label field..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Placeholder</Label>
            <Input
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Placeholder..."
            />
          </div>

          {(field.type === 'select' || field.type === 'radio') && (
            <div className="space-y-2">
              <Label>Pilihan (satu per baris)</Label>
              <Textarea
                value={field.options?.join('\n') || ''}
                onChange={(e) =>
                  onUpdate({ options: e.target.value.split('\n').filter(Boolean) })
                }
                placeholder="Pilihan 1&#10;Pilihan 2&#10;Pilihan 3"
                rows={3}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => onUpdate({ required: checked })}
              />
              <Label>Wajib diisi</Label>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onDuplicate}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onRemove}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormBuilder({ initialFields = [], onChange }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      const newFields = arrayMove(fields, oldIndex, newIndex);
      setFields(newFields);
      onChange?.(newFields);
    }
  };

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'Field Baru',
      placeholder: '',
      required: false,
    };
    const newFields = [...fields, newField];
    setFields(newFields);
    onChange?.(newFields);
  };

  const removeField = (id: string) => {
    const newFields = fields.filter((f) => f.id !== id);
    setFields(newFields);
    onChange?.(newFields);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    const newFields = fields.map((f) =>
      f.id === id ? { ...f, ...updates } : f
    );
    setFields(newFields);
    onChange?.(newFields);
  };

  const duplicateField = (id: string) => {
    const field = fields.find((f) => f.id === id);
    if (field) {
      const newField: FormField = {
        ...field,
        id: `field-${Date.now()}`,
        label: `${field.label} (copy)`,
      };
      const index = fields.findIndex((f) => f.id === id);
      const newFields = [...fields.slice(0, index + 1), newField, ...fields.slice(index + 1)];
      setFields(newFields);
      onChange?.(newFields);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Form Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={fields} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  onRemove={() => removeField(field.id)}
                  onUpdate={(updates) => updateField(field.id, updates)}
                  onDuplicate={() => duplicateField(field.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button variant="outline" onClick={addField} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Field
        </Button>
      </CardContent>
    </Card>
  );
}
