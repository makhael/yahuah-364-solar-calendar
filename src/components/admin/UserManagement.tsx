
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { LoaderCircle, Trash2, Edit, Save, X, UserPlus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';


interface User {
  id: string;
  displayName: string;
  email: string;
  role: 'member' | 'leader' | 'admin';
  status: 'pending' | 'approved' | 'denied';
}

interface EditingUserState {
    id: string;
    displayName: string;
    email: string;
}

const getRoleVariant = (role: User['role']) => {
  switch (role) {
    case 'admin':
      return 'default';
    case 'leader':
      return 'secondary';
    default:
      return 'outline';
  }
};

const UserTable = ({ users, onRoleChange, onStatusChange, onDelete, updatingUsers }: { users: User[], onRoleChange: Function, onStatusChange: Function, onDelete: Function, updatingUsers: Record<string, boolean> }) => {
  const [editingUser, setEditingUser] = useState<EditingUserState | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleEditClick = (user: User) => {
    setEditingUser({ id: user.id, displayName: user.displayName, email: user.email });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };
  
  const handleSaveEdit = () => {
    if (!editingUser || !firestore) return;

    const userRef = doc(firestore, 'users', editingUser.id);
    setDocumentNonBlocking(userRef, { displayName: editingUser.displayName, email: editingUser.email }, { merge: true });

    toast({ title: 'User Updated', description: `Details for ${editingUser.displayName} have been saved.` });
    setEditingUser(null);
  };


  if (users.length === 0) {
    return <p className="text-center text-muted-foreground p-8">No users in this category.</p>
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map(user => {
          const isEditing = editingUser?.id === user.id;
          return (
            <Card key={user.id} className="bg-background/50">
              <CardHeader>
                {isEditing ? (
                  <Input value={editingUser.displayName} onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})} className="text-lg font-bold p-0 border-0 shadow-none focus-visible:ring-0" />
                ) : (
                  <CardTitle className="text-lg">{user.displayName}</CardTitle>
                )}
                {isEditing ? (
                  <Input value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="text-sm p-0 border-0 shadow-none focus-visible:ring-0" />
                ) : (
                  <CardDescription>{user.email}</CardDescription>
                )}
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
                
                {isEditing ? (
                     <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                        <Button onClick={handleSaveEdit}>Save</Button>
                    </div>
                ) : (
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                            <Edit className="w-4 h-4 mr-2"/>
                            Edit User
                        </Button>
                    </div>
                )}


                {updatingUsers[user.id] && !isEditing ? (
                  <div className="flex justify-center py-4">
                    <LoaderCircle className="animate-spin h-5 w-5" />
                  </div>
                ) : (
                  !isEditing && 
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Change Role</Label>
                      <Select value={user.role} onValueChange={(value) => onRoleChange(user.id, value as User['role'])} >
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
                      <Select value={user.status} onValueChange={(value) => onStatusChange(user.id, value as User['status'])} >
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
          )
        })}
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
            {users.map(user => {
              const isEditing = editingUser?.id === user.id;
              return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {isEditing ? (
                    <Input value={editingUser!.displayName} onChange={(e) => setEditingUser({...editingUser!, displayName: e.target.value})} />
                  ) : user.displayName}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input value={editingUser!.email} onChange={(e) => setEditingUser({...editingUser!, email: e.target.value})} />
                  ) : user.email}
                </TableCell>
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
                  {updatingUsers[user.id] && !isEditing ? (
                    <LoaderCircle className="animate-spin h-5 w-5 ml-auto" />
                  ) : (
                    <div className="flex gap-2 justify-end">
                      {isEditing ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={handleCancelEdit}> <X className="h-4 w-4" /> </Button>
                          <Button variant="default" size="icon" onClick={handleSaveEdit}> <Save className="h-4 w-4" /> </Button>
                        </>
                      ) : (
                        <>
                          <Select value={user.role} onValueChange={(value) => onRoleChange(user.id, value as User['role'])} >
                            <SelectTrigger className="w-[120px]"> <SelectValue placeholder="Change role" /> </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="leader">Leader</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={user.status} onValueChange={(value) => onStatusChange(user.id, value as User['status'])} >
                            <SelectTrigger className="w-[120px]"> <SelectValue placeholder="Change status" /> </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="denied">Denied</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="icon" onClick={() => handleEditClick(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
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
                        </>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

const createUserSchema = z.object({
  displayName: z.string().min(3, "Display name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(['member', 'leader', 'admin']),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      role: 'member',
    },
  });

  const { formState: { isSubmitting }, control, handleSubmit } = form;

  const onSubmit = async (data: CreateUserForm) => {
    try {
      // We can't use the main auth instance for this, as it might be signed in.
      // Firebase doesn't support creating users from the client SDK while another user is signed in.
      // This is a simplified approach. A more robust solution would use a backend function.
      
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const newUser = userCredential.user;

      const userDocRef = doc(firestore, "users", newUser.uid);
      await setDoc(userDocRef, {
        displayName: data.displayName,
        email: data.email,
        role: data.role,
        status: 'approved',
        createdAt: new Date().toISOString(),
      });
      
      toast({
        title: "User Created",
        description: `Account for ${data.displayName} has been successfully created.`,
      });

      form.reset();
      setOpen(false);

    } catch (error: any) {
      console.error("Error creating user:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use by another account.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak.';
      }
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Enter the details for the new user account. The user will be created with 'approved' status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayName" className="text-right">Name</Label>
              <Controller
                name="displayName"
                control={control}
                render={({ field }) => <Input id="displayName" {...field} className="col-span-3" />}
              />
              {form.formState.errors.displayName && <p className="col-span-4 text-xs text-destructive text-right">{form.formState.errors.displayName.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input id="email" type="email" {...field} className="col-span-3" />}
              />
              {form.formState.errors.email && <p className="col-span-4 text-xs text-destructive text-right">{form.formState.errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Password</Label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => <Input id="password" type="password" {...field} className="col-span-3" />}
              />
              {form.formState.errors.password && <p className="col-span-4 text-xs text-destructive text-right">{form.formState.errors.password.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="leader">Leader</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                      </Select>
                  )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
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

  const approvedUsers = useMemo(() => users?.filter(u => u.status === 'approved') || [], [users]);
  const pendingUsers = useMemo(() => users?.filter(u => u.status === 'pending' || !u.status) || [], [users]);
  const deniedUsers = useMemo(() => users?.filter(u => u.status === 'denied') || [], [users]);

  return (
    <>
      <div className="flex justify-end mb-4">
        <CreateUserDialog />
      </div>
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
    </>
  );
}
