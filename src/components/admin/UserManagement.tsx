
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';


interface User {
  id: string;
  displayName: string;
  email: string;
  role: 'member' | 'leader' | 'admin';
  status: 'pending' | 'approved' | 'denied';
}

interface UserProfileData {
  role?: string;
}

const getRoleVariant = (role: User['role']) => {
  switch (role) {
    case 'admin':
      return 'default'; // Was 'destructive'
    case 'leader':
      return 'secondary';
    default:
      return 'outline';
  }
};

const UserTable = ({ users, onRoleChange, onStatusChange, onDelete, updatingUsers }: { users: User[], onRoleChange: Function, onStatusChange: Function, onDelete: Function, updatingUsers: Record<string, boolean> }) => {
  if (users.length === 0) {
    return <p className="text-center text-muted-foreground p-8">No users in this category.</p>
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map(user => (
          <Card key={user.id} className="bg-background/50">
            <CardHeader>
              <CardTitle className="text-lg">{user.displayName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Role</p>
                <Badge variant={getRoleVariant(user.role)} className="capitalize">{user.role}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Status</p>
                 <Badge className={cn("capitalize", {
                    'bg-green-600 hover:bg-green-700': user.status === 'approved',
                    'bg-amber-500 hover:bg-amber-600': user.status === 'pending',
                    'bg-destructive hover:bg-destructive/90': user.status === 'denied',
                })}>{user.status}</Badge>
              </div>

              <Separator />

              {updatingUsers[user.id] ? (
                <div className="flex justify-center py-4">
                  <LoaderCircle className="animate-spin h-5 w-5" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Change Role</Label>
                    <Select
                      value={user.role}
                      onValueChange={(value) => onRoleChange(user.id, value as User['role'])}
                    >
                      <SelectTrigger><SelectValue placeholder="Change role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="leader">Leader</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Change Status</Label>
                    <Select
                      value={user.status}
                      onValueChange={(value) => onStatusChange(user.id, value as User['status'])}
                    >
                      <SelectTrigger><SelectValue placeholder="Change status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">Delete User</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the user '{user.displayName}' and all of their associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(user.id)}>Yes, delete user</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-[320px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.displayName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleVariant(user.role)} className="capitalize">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn("capitalize", {
                      'bg-green-600 hover:bg-green-700': user.status === 'approved',
                      'bg-amber-500 hover:bg-amber-600': user.status === 'pending',
                      'bg-destructive hover:bg-destructive/90': user.status === 'denied',
                  })}>{user.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {updatingUsers[user.id] ? (
                    <LoaderCircle className="animate-spin h-5 w-5 ml-auto" />
                  ) : (
                    <div className="flex gap-2 justify-end">
                      <Select
                        value={user.role}
                        onValueChange={(value) => onRoleChange(user.id, value as User['role'])}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Change role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="leader">Leader</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={user.status}
                        onValueChange={(value) => onStatusChange(user.id, value as User['status'])}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="denied">Denied</SelectItem>
                        </SelectContent>
                      </Select>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user '{user.displayName}' and all of their associated data. This does NOT delete their Firebase Auth record.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(user.id)}>Yes, delete user</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

export function UserManagement() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !firestore) return null;
    return collection(firestore, 'users');
  }, [isUserLoading, firestore]);

  const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  const [updatingUsers, setUpdatingUsers] = useState<Record<string, boolean>>({});

  const handleRoleChange = (userId: string, newRole: User['role']) => {
    if (!firestore) return;
    setUpdatingUsers(prev => ({ ...prev, [userId]: true }));

    const userRef = doc(firestore, 'users', userId);
    setDocumentNonBlocking(userRef, { role: newRole }, { merge: true });

    setTimeout(() => {
      toast({ title: 'Role Updated', description: `User role has been changed to ${newRole}.` });
      setUpdatingUsers(prev => ({ ...prev, [userId]: false }));
    }, 500);
  };

  const handleStatusChange = (userId: string, newStatus: User['status']) => {
    if (!firestore) return;
    setUpdatingUsers(prev => ({ ...prev, [userId]: true }));

    const userRef = doc(firestore, 'users', userId);
    setDocumentNonBlocking(userRef, { status: newStatus }, { merge: true });

    setTimeout(() => {
      toast({ title: 'Status Updated', description: `User status has been changed to ${newStatus}.` });
      setUpdatingUsers(prev => ({ ...prev, [userId]: false }));
    }, 500)
  }

  const handleDelete = async (userId: string) => {
    if (!firestore) return;
    const userToDelete = users?.find(u => u.id === userId);
    if (!userToDelete) return;

    setUpdatingUsers(prev => ({ ...prev, [userId]: true }));
    try {
      await deleteDoc(doc(firestore, 'users', userId));
      toast({ title: 'User Deleted', description: `User ${userToDelete.displayName} has been removed.` });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
      setUpdatingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  const approvedUsers = users?.filter(u => u.status === 'approved') || [];
  const pendingUsers = users?.filter(u => u.status === 'pending') || [];
  const deniedUsers = users?.filter(u => u.status === 'denied') || [];

  return (
    <Card>
      {areUsersLoading ? (
        <div className="flex justify-center items-center p-12">
          <LoaderCircle className="animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="approved">
          <CardHeader className="p-4 sm:p-6">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="approved" className="py-2">Approved ({approvedUsers.length})</TabsTrigger>
              <TabsTrigger value="pending" className="py-2">Pending ({pendingUsers.length})</TabsTrigger>
              <TabsTrigger value="denied" className="py-2">Denied ({deniedUsers.length})</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 sm:pt-0">
            <TabsContent value="approved" className="mt-0">
              <UserTable users={approvedUsers} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} onDelete={handleDelete} updatingUsers={updatingUsers} />
            </TabsContent>
            <TabsContent value="pending" className="mt-0">
              <UserTable users={pendingUsers} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} onDelete={handleDelete} updatingUsers={updatingUsers} />
            </TabsContent>
            <TabsContent value="denied" className="mt-0">
              <UserTable users={deniedUsers} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} onDelete={handleDelete} updatingUsers={updatingUsers} />
            </TabsContent>
          </CardContent>
        </Tabs>
      )}
    </Card>
  );
}
