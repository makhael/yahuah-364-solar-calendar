
'use client';

import React, { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, deleteDoc, getDocs, where, arrayRemove, writeBatch } from 'firebase/firestore';
import { LoaderCircle, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { AppointmentModal } from '../modals/AppointmentModal';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface Appointment {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  startTime: string;
  inviteScope: 'all' | 'community' | 'private';
  creatorId: string;
  updatedAt?: { seconds: number };
  createdAt?: { seconds: number };
}

type SortConfig = {
  key: keyof Appointment | 'updatedAt';
  direction: 'ascending' | 'descending';
};

export default function AppointmentManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'updatedAt', direction: 'descending' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appointments'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: appointments, isLoading: areAppointmentsLoading } = useCollection<Appointment>(appointmentsQuery);
  
  const sortedAppointments = useMemo(() => {
    if (!appointments) return [];
    
    const sortableAppointments = [...appointments];
    sortableAppointments.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'updatedAt') {
          aValue = a.updatedAt || a.createdAt;
          bValue = b.updatedAt || b.createdAt;
      } else {
          aValue = a[sortConfig.key as keyof Appointment];
          bValue = b[sortConfig.key as keyof Appointment];
      }

      if (aValue === undefined || bValue === undefined) return 0;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (aValue && typeof aValue === 'object' && 'seconds' in aValue && bValue && typeof bValue === 'object' && 'seconds' in bValue) {
        comparison = aValue.seconds - bValue.seconds;
      }
      
      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });

    return sortableAppointments;
  }, [appointments, sortConfig]);

  const requestSort = (key: keyof Appointment | 'updatedAt') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    } else if (key === 'updatedAt') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Appointment | 'updatedAt') => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? (
      <ArrowUpDown className="ml-2 h-4 w-4" />
    ) : (
      <ArrowUpDown className="ml-2 h-4 w-4" />
    );
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAppointment(null);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  }

  const handleDelete = async (appointmentToDelete: Appointment) => {
    if (!firestore) return;
    setIsDeleting(appointmentToDelete.id);
    
    const batch = writeBatch(firestore);
    
    const appointmentRef = doc(firestore, 'appointments', appointmentToDelete.id);
    batch.delete(appointmentRef);

    const datesToCheck: string[] = [];
    const startDate = new Date(appointmentToDelete.startDate + 'T00:00:00');
    const endDate = appointmentToDelete.endDate ? new Date(appointmentToDelete.endDate + 'T00:00:00') : startDate;
    
    let currentDate = new Date(startDate);
    while(currentDate <= endDate) {
        datesToCheck.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // This part is tricky without knowing if other events exist on these dates.
    // For simplicity, we'll remove the dates from the summary. A more robust solution
    // would check if other events exist before removing.
    for (const dateStr of datesToCheck) {
        const year = dateStr.substring(0, 4);
        const summaryRef = doc(firestore, 'appointmentSummaries', year);
        batch.update(summaryRef, {
            appointmentDates: arrayRemove(dateStr)
        });
    }

    try {
        await batch.commit();
        toast({ title: 'Appointment Deleted', description: 'The appointment has been removed from the calendar.' });
    } catch (error: any) {
        console.error("Error deleting appointment:", error);
        toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    } finally {
        setIsDeleting(null);
    }
  };
  
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  if (areAppointmentsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background rounded-lg">
        <div className="relative flex h-24 w-24 items-center justify-center">
            <LoaderCircle className="absolute h-full w-full animate-spin text-primary/50" />
            {logo && (
                <Image
                    src={logo.imageUrl}
                    alt={logo.description}
                    width={64}
                    height={64}
                    data-ai-hint={logo.imageHint}
                    className="h-16 w-16 rounded-full object-cover"
                    priority
                />
            )}
        </div>
      </div>
    );
  }

  return (
    <>
        <div className="flex justify-end mb-4">
            <Button onClick={handleCreate} className="w-full sm:w-auto">
                Create New Appointment
            </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Appointments ({appointments?.length || 0})</CardTitle>
            <CardDescription>Click column headers to sort appointments.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <div className="p-6 pt-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('title')}>
                        Title {getSortIcon('title')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('startDate')}>
                        Start Date {getSortIcon('startDate')}
                      </Button>
                    </TableHead>
                     <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('updatedAt')}>
                        Last Modified {getSortIcon('updatedAt')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('startTime')}>
                        Time {getSortIcon('startTime')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('inviteScope')}>
                        Scope {getSortIcon('inviteScope')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAppointments && sortedAppointments.length > 0 ? (
                    sortedAppointments.map(appointment => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">{appointment.title}</TableCell>
                        <TableCell>{new Date(appointment.startDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</TableCell>
                        <TableCell>
                          {appointment.updatedAt ? new Date(appointment.updatedAt.seconds * 1000).toLocaleString() : (appointment.createdAt ? new Date(appointment.createdAt.seconds * 1000).toLocaleString() : 'N/A')}
                        </TableCell>
                        <TableCell>{appointment.startTime}</TableCell>
                        <TableCell>
                          <Badge variant={appointment.inviteScope === 'all' ? 'default' : appointment.inviteScope === 'community' ? 'secondary' : 'outline'}>
                            {appointment.inviteScope}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            {isDeleting === appointment.id ? (
                                <LoaderCircle className="animate-spin h-5 w-5 ml-auto" />
                            ) : (
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(appointment)}>
                                        <Edit className="mr-2 h-3 w-3" /> Edit
                                    </Button>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="mr-2 h-3 w-3" /> Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the appointment "{appointment.title}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(appointment)}>
                                                    Yes, delete appointment
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No appointments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    
        {isModalOpen && (
            <AppointmentModal appointment={editingAppointment} onClose={handleCloseModal} />
        )}
    </>
  );
}
