
"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle, XCircle, Compass } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';

const presetSchema = z.object({
  name: z.string().min(3, { message: "Preset name must be at least 3 characters long." }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter a valid date." }),
});

type PresetFormData = z.infer<typeof presetSchema>;

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PresetFormData) => void;
  preset: { id: string, name: string, startDate: string } | null;
}

export const PresetModal = ({ isOpen, onClose, onSave, preset }: PresetModalProps) => {
  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<PresetFormData>({
    resolver: zodResolver(presetSchema),
    defaultValues: {
      name: '',
      startDate: '',
    }
  });

  useEffect(() => {
    if (preset) {
      reset({ name: preset.name, startDate: preset.startDate });
    } else {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      reset({ name: '', startDate: `${y}-${m}-${d}` });
    }
  }, [preset, reset]);
  
  if (!isOpen) return null;

  const handleFormSubmit = (data: PresetFormData) => {
    onSave(data);
  };

  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md relative border modal-bg-pattern flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
           <div className="p-6 pb-4 border-b">
             <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
                aria-label="Close"
            >
                <XCircle className="w-8 h-8" />
            </button>
            <div className="flex items-start gap-4 pr-8">
                 <Compass className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                     <h2 className="text-xl font-bold text-foreground">{preset ? 'Edit' : 'Add New'} Calendar Alignment</h2>
                    <p className="text-sm text-muted-foreground">Save a Gregorian date as the M1 D1 anchor.</p>
                </div>
            </div>
          </div>
            <div className="flex-grow overflow-y-auto">
                 <ScrollArea className="h-full">
                    <div className="p-6 space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-muted-foreground">Alignment Name</Label>
                        <Controller
                          name="name"
                          control={control}
                          render={({ field }) => <Input id="name" {...field} placeholder="e.g., Qumran Alignment" className="bg-background/50"/>}
                        />
                        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="startDate" className="text-muted-foreground">M1 D1 Anchor Date</Label>
                        <Controller
                          name="startDate"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              date={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                              setDate={(date) => {
                                if (date) {
                                  field.onChange(formatDateString(date));
                                }
                              }}
                            />
                          )}
                        />
                        {errors.startDate && <p className="text-sm text-destructive mt-1">{errors.startDate.message}</p>}
                      </div>
                    </div>
                 </ScrollArea>
            </div>
          <div className="p-4 flex justify-end items-center gap-2 border-t bg-secondary/30 rounded-b-2xl">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Save Alignment'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
