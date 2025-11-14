
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle, XCircle, HelpCircle, Check, CalendarClock, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hebrewDays, TEKUFAH_MONTHS } from '@/lib/calendar-data';
import { useUI } from '@/context/UIContext';
import { getGregorianDate, get364DateFromGregorian } from '@/lib/calendar-utils';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { collection } from 'firebase/firestore';


const appointmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().optional(),
  tags: z.string().optional(),
  
  startMonth: z.number().min(1).max(12),
  startDay: z.number().min(1).max(31),
  
  isMultiDay: z.boolean(),
  endMonth: z.number().min(1).max(12).optional().nullable(),
  endDay: z.number().min(1).max(31).optional().nullable(),

  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time is required."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time is required.").optional().nullable(),
  
  colorTheme: z.enum(["default", "blue", "green", "purple", "orange"]).default("default"),

  inviteScope: z.enum(["all", "community", "private"]),
  invitedUserIds: z.array(z.string()).optional(),
  sendNotification: z.boolean().optional(),
  
  recurrenceFrequency: z.enum(["none", "weekly", "bi-weekly"]),
}).refine(data => {
    if (data.isMultiDay) {
        return data.recurrenceFrequency === 'none';
    }
    return true;
}, {
    message: "A multi-day event cannot also be a recurring event.",
    path: ["isMultiDay"],
}).refine(data => {
    if (data.isMultiDay) {
        return data.endMonth !== null && data.endDay !== null && data.endMonth !== undefined && data.endDay !== undefined;
    }
    return true;
}, {
    message: "End date is required for a multi-day event.",
    path: ["endDay"],
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface UserProfile {
    id: string;
    displayName: string;
    email: string;
}

interface AppointmentModalProps {
  appointment: any | null;
  date?: string; // YYYY-MM-DD string
  onClose: () => void;
}

const months = Array.from({ length: 12 }, (_, i) => i + 1);

const colorThemes = [
    { name: 'default', label: 'Default', class: 'bg-muted' },
    { name: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { name: 'green', label: 'Green', class: 'bg-green-500' },
    { name: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { name: 'orange', label: 'Orange', class: 'bg-orange-500' },
];


export const AppointmentModal = ({ appointment, date, onClose }: AppointmentModalProps) => {
  const { startDate: m1d1StartDate, handleSaveAppointment } = useUI();
  const firestore = useFirestore();
  const [openUserSelect, setOpenUserSelect] = useState(false);
  
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: allUsers } = useCollection<UserProfile>(usersQuery);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: '',
      description: '',
      tags: '',
      startMonth: 1,
      startDay: 1,
      isMultiDay: false,
      endMonth: null,
      endDay: null,
      startTime: '10:00',
      endTime: '12:00',
      colorTheme: 'default',
      inviteScope: 'community',
      invitedUserIds: [],
      sendNotification: true,
      recurrenceFrequency: 'none',
    }
  });

  const watchRecurrence = watch('recurrenceFrequency');
  const watchIsMultiDay = watch('isMultiDay');
  const watchStartMonth = watch('startMonth');
  const watchStartDay = watch('startDay');
  const watchInviteScope = watch('inviteScope');
  const watchInvitedUsers = watch('invitedUserIds');

  useEffect(() => {
    if (watchIsMultiDay && watchRecurrence !== 'none') {
        setValue('recurrenceFrequency', 'none');
    }
  }, [watchIsMultiDay, watchRecurrence, setValue]);
  
  useEffect(() => {
    if (watchRecurrence !== 'none' && watchIsMultiDay) {
        setValue('isMultiDay', false);
    }
  }, [watchRecurrence, watchIsMultiDay, setValue]);

  const calculatedDayOfWeek = useMemo(() => {
      if (!watchStartDay || watchStartDay < 1 || watchStartDay > 31) return null;
      const dayOfWeekIndex = (watchStartDay - 1) % 7;
      return hebrewDays[dayOfWeekIndex];
  }, [watchStartDay]);

  const handleFormSubmit = (data: AppointmentFormData) => {
    const finalData = { ...data, recurrenceDay: calculatedDayOfWeek };
    handleSaveAppointment(finalData, appointment?.id);
    onClose();
  };
  
  const daysForStartMonth = TEKUFAH_MONTHS.includes(watchStartMonth) ? 31 : 30;
  const watchEndMonth = watch('endMonth');
  const daysForEndMonth = watchEndMonth ? (TEKUFAH_MONTHS.includes(watchEndMonth) ? 31 : 30) : 30;


  const calculatedStartDate = useMemo(() => {
    if (m1d1StartDate && watchStartMonth && watchStartDay) {
      return getGregorianDate(m1d1StartDate, watchStartMonth, watchStartDay);
    }
    return null;
  }, [m1d1StartDate, watchStartMonth, watchStartDay]);

  useEffect(() => {
    if (appointment) {
        const start364 = get364DateFromGregorian(new Date(appointment.startDate + 'T00:00:00'), m1d1StartDate);
        const end364 = appointment.endDate ? get364DateFromGregorian(new Date(appointment.endDate + 'T00:00:00'), m1d1StartDate) : null;
        
        reset({
            title: appointment.title,
            description: appointment.description || '',
            tags: appointment.tags?.join(', ') || '',
            startMonth: start364?.month,
            startDay: start364?.day,
            isMultiDay: !!(appointment.endDate && appointment.startDate !== appointment.endDate),
            endMonth: end364?.month,
            endDay: end364?.day,
            startTime: appointment.startTime,
            endTime: appointment.endTime || '',
            colorTheme: appointment.colorTheme || 'default',
            inviteScope: appointment.inviteScope,
            invitedUserIds: appointment.invitedUserIds || [],
            sendNotification: true, // Default to true for edits
            recurrenceFrequency: appointment.recurrence?.frequency || 'none',
        });
    } else if (date) { // Pre-fill date for new appointment
        const start364 = get364DateFromGregorian(new Date(date + 'T00:00:00'), m1d1StartDate);
        reset({
            title: '',
            description: '',
            tags: '',
            startMonth: start364?.month || 1,
            startDay: start364?.day || 1,
            isMultiDay: false,
            endMonth: null,
            endDay: null,
            startTime: '10:00',
            endTime: '12:00',
            colorTheme: 'default',
            inviteScope: 'community',
            invitedUserIds: [],
            sendNotification: true,
            recurrenceFrequency: 'none',
        });
    } else {
        reset({
          title: '',
          description: '',
          tags: '',
          startMonth: 1,
          startDay: 1,
          isMultiDay: false,
          endMonth: null,
          endDay: null,
          startTime: '10:00',
          endTime: '12:00',
          colorTheme: 'default',
          inviteScope: 'community',
          invitedUserIds: [],
          sendNotification: true,
          recurrenceFrequency: 'none',
        });
    }
  }, [appointment, date, reset, m1d1StartDate]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-lg relative border modal-bg-pattern flex flex-col max-h-[90vh] h-full sm:h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-full overflow-hidden">
          <div className="p-6 pb-4 border-b flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
              aria-label="Close"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <div className="flex items-start gap-4">
              <CalendarClock className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-foreground pr-8">{appointment ? 'Edit' : 'Create New'} Appointment</h2>
                <p className="text-sm text-muted-foreground">Schedule a teaching, gathering, or personal event.</p>
              </div>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            <ScrollArea className="h-full w-full">
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                  <Controller name="title" control={control} render={({ field }) => <Input id="title" {...field} className="bg-background/50" />} />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Controller name="description" control={control} render={({ field }) => <Textarea id="description" {...field} rows={3} className="bg-background/50" />} />
                   <p className="text-xs text-muted-foreground">Format with: `**bold**`, `*italic*`</p>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="tags-appointment">Tags (comma-separated)</Label>
                  <Controller name="tags" control={control} render={({ field }) => ( <Input id="tags-appointment" {...field} placeholder="e.g., teaching, community, feast" className="bg-background/50 mt-1" /> )} />
                </div>


                <div className="p-4 rounded-lg border bg-secondary/50">
                  <h3 className="text-base font-semibold text-foreground mb-3">Date (Yahuah's Calendar)</h3>

                  <div className="space-y-3">
                    <Label>Start Month & Day <span className="text-destructive">*</span></Label>
                    <p className="text-xs text-muted-foreground/80 font-medium -mb-1">{calculatedDayOfWeek || 'Select a day'}</p>
                    <div className="flex items-center gap-2">
                      <Controller name="startMonth" control={control} render={({ field }) => (
                        <Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)}>
                          <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {months.map(m => <SelectItem key={m} value={String(m)}>Month {m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )} />
                      <Controller name="startDay" control={control} render={({ field }) => (
                        <Input type="number" min="1" max={daysForStartMonth} {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} className="bg-background/50 w-full" placeholder="Day" />
                      )} />
                    </div>
                    {errors.startDay && <p className="text-sm text-destructive mt-1">{errors.startDay.message}</p>}
                  </div>

                  <div className="mt-2">
                    {calculatedStartDate && <p className="text-xs text-muted-foreground">Witness Date: {calculatedStartDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                  </div>

                  <div className="mt-4 flex items-center space-x-2">
                    <Controller name="isMultiDay" control={control} render={({ field }) => <Switch id="isMultiDay" checked={field.value} onCheckedChange={field.onChange} disabled={watchRecurrence !== 'none'} />} />
                    <Label htmlFor="isMultiDay">Multi-Day Event</Label>
                  </div>

                  {watchIsMultiDay && (
                    <div className="mt-4 space-y-3">
                      <Label>End Month & Day</Label>
                      <div className="flex items-center gap-2">
                        <Controller name="endMonth" control={control} render={({ field }) => (
                          <Select onValueChange={(val) => field.onChange(val ? Number(val) : null)} value={field.value ? String(field.value) : undefined}>
                            <SelectTrigger className="bg-background/50"><SelectValue placeholder="End Month" /></SelectTrigger>
                            <SelectContent>
                              {months.map(m => <SelectItem key={m} value={String(m)}>Month {m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )} />
                        <Controller name="endDay" control={control} render={({ field }) => (
                          <Input type="number" min="1" max={daysForEndMonth} {...field} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} className="bg-background/50" placeholder="End Day" />
                        )} />
                      </div>
                      {errors.endDay && <p className="text-sm text-destructive mt-1">{errors.endDay.message}</p>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time <span className="text-destructive">*</span></Label>
                    <Controller name="startTime" control={control} render={({ field }) => <Input id="startTime" type="time" {...field} className="bg-background/50" />} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Controller name="endTime" control={control} render={({ field }) => <Input id="endTime" type="time" {...field} className="bg-background/50" />} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Recurrence</Label>
                  <Controller name="recurrenceFrequency" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={watchIsMultiDay}>
                      <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Does not repeat</SelectItem>
                        <SelectItem value="weekly">Repeats Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Repeats Bi-Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                  {watchRecurrence !== 'none' && calculatedDayOfWeek && (
                    <p className="text-xs text-muted-foreground pt-1">This event will recur every {calculatedDayOfWeek}.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Color Theme</Label>
                  <Controller name="colorTheme" control={control} render={({ field }) => (
                    <div className="flex items-center gap-3">
                      {colorThemes.map(theme => (
                        <TooltipProvider key={theme.name}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => field.onChange(theme.name)}
                                className={cn(
                                  "w-8 h-8 rounded-full border-2 transition-all",
                                  field.value === theme.name ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-muted'
                                )}
                              >
                                <div className={cn("w-full h-full rounded-full", theme.class)} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{theme.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  )} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Invite Scope</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button" asChild><HelpCircle className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Public: Visible to all. Community: Visible to signed-in users. Private: Visible only to creator (future invitation system).</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Controller name="inviteScope" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Public (All Visitors)</SelectItem>
                        <SelectItem value="community">Community (Signed-in Users)</SelectItem>
                        <SelectItem value="private">Private (By Invitation Only)</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>

                {watchInviteScope === 'private' && (
                  <div className="space-y-2">
                      <Label>Invite Users</Label>
                      <Controller
                          name="invitedUserIds"
                          control={control}
                          render={({ field }) => (
                              <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                                  <PopoverTrigger asChild>
                                      <Button variant="outline" role="combobox" aria-expanded={openUserSelect} className="w-full justify-between bg-background/50">
                                          <span className="truncate">
                                            {watchInvitedUsers && watchInvitedUsers.length > 0
                                                ? `${watchInvitedUsers.length} user${watchInvitedUsers.length > 1 ? 's' : ''} selected`
                                                : "Select users..."}
                                          </span>
                                          <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                      <Command>
                                          <CommandInput placeholder="Search users..." />
                                          <CommandList>
                                              <CommandEmpty>No users found.</CommandEmpty>
                                              <CommandGroup>
                                                  {allUsers?.map(user => (
                                                      <CommandItem
                                                          key={user.id}
                                                          value={user.displayName}
                                                          onSelect={() => {
                                                              const currentInvited = field.value || [];
                                                              const isSelected = currentInvited.includes(user.id);
                                                              const newInvited = isSelected
                                                                  ? currentInvited.filter(id => id !== user.id)
                                                                  : [...currentInvited, user.id];
                                                              field.onChange(newInvited);
                                                          }}
                                                      >
                                                          <Check className={cn("mr-2 h-4 w-4", (field.value || []).includes(user.id) ? "opacity-100" : "opacity-0")} />
                                                          {user.displayName} ({user.email})
                                                      </CommandItem>
                                                  ))}
                                              </CommandGroup>
                                          </CommandList>
                                      </Command>
                                  </PopoverContent>
                              </Popover>
                          )}
                      />
                  </div>
                )}
                 {watchInviteScope === 'private' && watchInvitedUsers && watchInvitedUsers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Controller name="sendNotification" control={control} render={({ field }) => <Switch id="sendNotification" checked={field.value} onCheckedChange={field.onChange} />} />
                    <Label htmlFor="sendNotification">Send email notification to invited users</Label>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="p-4 flex justify-end items-center gap-2 border-t bg-secondary/30 rounded-b-2xl flex-shrink-0">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="animate-spin" /> : `${appointment ? 'Update' : 'Save'} Appointment`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
