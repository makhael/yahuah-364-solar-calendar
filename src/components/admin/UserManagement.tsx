
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase, useAuth, useFirebaseApp } from '@/firebase';
import { collection, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { setDocumentNonBlocking, updateUserPassword } from '@/firebase/non-blocking-updates';
import { LoaderCircle, Trash2, Edit, Save, X, UserPlus, LogIn, Send, Search, KeyRound } from 'lucide-react';
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
import { createUserWithEmailAndPassword, getAuth as getAuthSecondary, signInWithCredential, EmailAuthProvider, signOut as firebaseSignOut, reauthenticateWithCredential } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { useRouter } from 'next/navigation';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Checkbox } from '../ui/checkbox';


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
}

const passwordChangeSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type PasswordChangeForm = z.infer<typeof passwordChangeSchema>;

const ChangePasswordDialog = ({ user, open, onOpenChange }: { user: User | null; open: boolean; onOpenChange: (open: boolean) => void }) => {
  const { toast } = useToast();
  const form = useForm<PasswordChangeForm>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const { formState: { isSubmitting }, handleSubmit, reset } = form;

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: PasswordChangeForm) => {
    if (!user) return;
    try {
      // This is a placeholder for a secure, server-side password change.
      // In a real app, this would call a Cloud Function.
      await updateUserPassword(user.id, data.newPassword);
      toast({
        title: "Password Updated",
        description: `Password for ${user.displayName} has been changed.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not change password. See console for details.",
      });
      console.error("Password update error:", error);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password for {user.displayName}</DialogTitle>
          <DialogDescription>
            Enter a new password for this user. They will be notified if you choose.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...form.register('newPassword')} />
              {form.formState.errors.newPassword && <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" {...form.register('confirmPassword')} />
              {form.formState.errors.confirmPassword && <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Set New Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


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

const UserTable = ({ users, onRoleChange, onStatusChange, onDelete, updatingUsers, onSwitchUser, currentUserId }: { users: User[], onRoleChange: Function, onStatusChange: Function, onDelete: Function, updatingUsers: Record<string, boolean>, onSwitchUser: (email: string) => void, currentUserId: string | null }) => {
  const [editingUser, setEditingUser] = useState<EditingUserState | null>(null);
  const [passwordChangeUser, setPasswordChangeUser] = useState<User | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleEditClick = (user: User) => {
    setEditingUser({ id: user.id, displayName: user.displayName });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };
  
  const handleSaveEdit = () => {
    if (!editingUser || !firestore) return;

    const userRef = doc(firestore, 'users', editingUser.id);
    setDocumentNonBlocking(userRef, { displayName: editingUser.displayName }, { merge: true });

    toast({ title: 'User Updated', description: `Display name for ${editingUser.displayName} has been saved.` });
    setEditingUser(null);
  };


  if (users.length === 0) {
    return <p className="text-center text-muted-foreground p-8">No users in this category.</p>
  }

  return (
    <>
      <ChangePasswordDialog user={passwordChangeUser} open={!!passwordChangeUser} onOpenChange={(isOpen) => !isOpen && setPasswordChangeUser(null)} />
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map(user => {
          const isEditing = editingUser?.id === user.id;
          const isCurrentUser = user.id === currentUserId;

          return (
            <Card key={user.id} className="bg-background/50">
              <CardHeader>
                {isEditing ? (
                  <Input value={editingUser.displayName} onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})} className="text-lg font-bold" />
                ) : (
                  <CardTitle className="text-lg">{user.displayName} {isCurrentUser && <span className="text-sm font-normal text-muted-foreground">(You)</span>}</CardTitle>
                )}
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
                
                {isEditing ? (
                     <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                        <Button onClick={handleSaveEdit}>Save</Button>
                    </div>
                ) : (
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                            <Edit className="w-4 h-4 mr-2"/>
                            Edit Name
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="secondary" size="sm">
                                <LogIn className="w-4 h-4 mr-2"/>
                                Switch User
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Switch to {user.displayName}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will sign you out and pre-fill the login form with this user's email. You will need their password to proceed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onSwitchUser(user.email)}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
                
                <div className="space-y-4">
                    <Button variant="outline" className="w-full" onClick={() => setPasswordChangeUser(user)}><KeyRound className="w-4 h-4 mr-2"/> Change Password</Button>
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
                        <Button variant="destructive" className="w-full" disabled={isCurrentUser}>Delete User</Button>
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
              <TableHead className="text-right w-[450px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => {
              const isEditing = editingUser?.id === user.id;
              const isCurrentUser = user.id === currentUserId;
              return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {isEditing ? (
                    <Input value={editingUser!.displayName} onChange={(e) => setEditingUser({...editingUser!, displayName: e.target.value})} />
                  ) : (
                    <>
                     {user.displayName} {isCurrentUser && <span className="text-sm font-normal text-muted-foreground">(You)</span>}
                    </>
                  )}
                </TableCell>
                <TableCell>
                  {user.email}
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
                          <Button variant="outline" size="sm" onClick={() => setPasswordChangeUser(user)}><KeyRound className="w-4 h-4"/></Button>
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="ghost" size="icon" title="Switch User">
                                <LogIn className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Switch to {user.displayName}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will sign you out and pre-fill the login form with this user's email. You will need their password to proceed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onSwitchUser(user.email)}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button variant="outline" size="icon" onClick={() => handleEditClick(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" disabled={isCurrentUser}>
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
  sendWelcomeEmail: z.boolean().default(true),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const mainApp = useFirebaseApp(); // Get the main Firebase app instance
  const firestore = useFirestore();
  const { toast } = useToast();
  const auth = useAuth();
  
  const currentAdminUser = auth.currentUser;


  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      role: 'member',
      sendWelcomeEmail: true,
    },
  });

  const { formState: { isSubmitting, isSubmitSuccessful }, control, handleSubmit, reset } = form;

  useEffect(() => {
    if (isSubmitSuccessful) {
        reset();
        setOpen(false);
    }
  }, [isSubmitSuccessful, reset]);


  const onSubmit = async (data: CreateUserForm) => {
    if (!currentAdminUser || !currentAdminUser.email) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Admin user not found. Please sign in again.",
        });
        return;
    }

    const tempAppName = `temp-user-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuthSecondary(tempApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(tempAuth, data.email, data.password);
        const newUser = userCredential.user;

        const userDocRef = doc(firestore, "users", newUser.uid);
        await setDoc(userDocRef, {
            displayName: data.displayName,
            email: data.email,
            role: data.role,
            status: 'approved',
            createdAt: new Date().toISOString(),
        });
        
        if (data.sendWelcomeEmail) {
            const mailColRef = collection(firestore, "mail");
            const templateRef = doc(firestore, 'emailTemplates', 'welcome-admin-created');
            const templateSnap = await getDoc(templateRef);

            if (templateSnap.exists()) {
                const template = templateSnap.data();
                const html = (template.html || '').replace(/{{displayName}}/g, data.displayName);
                const subject = (template.subject || '').replace(/{{displayName}}/g, data.displayName);

                await addDocumentNonBlocking(mailColRef, {
                    to: [data.email],
                    message: {
                        subject,
                        html,
                    }
                });
            } else {
                console.warn("welcome-admin-created email template not found. Skipping email.");
            }
        }
        
        toast({
            title: "User Created",
            description: `Account for ${data.displayName} has been successfully created.`,
        });

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
        // Re-throw to prevent form reset on failure
        throw error;
    } finally {
        // Sign out the newly created user from the temporary auth instance
        await firebaseSignOut(tempAuth);
        // Clean up the temporary app
        await deleteApp(tempApp);

        // Re-authenticate the admin if their state was affected.
        // A robust solution may require the admin password again.
        // For now, we rely on the main auth session persisting.
        if (auth.currentUser?.uid !== currentAdminUser.uid) {
            console.warn("Admin auth state may have been affected. A manual re-login might be needed if issues occur.");
            // Ideally, re-authenticate admin here, e.g., by asking for password
            // and calling `reauthenticateWithCredential`.
        }
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
             <div className="flex items-center space-x-2 justify-end pt-2">
                <Controller
                    name="sendWelcomeEmail"
                    control={control}
                    render={({ field }) => (
                       <Checkbox id="sendWelcomeEmail" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                />
                <Label htmlFor="sendWelcomeEmail" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Send welcome email
                </Label>
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
  const { user: currentUser, isUserLoading } = useUser();
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSwitchUser = (email: string) => {
    firebaseSignOut(auth).then(() => {
      router.push(`/login?email=${encodeURIComponent(email)}`);
    }).catch((error) => {
      console.error("Sign out error", error);
      toast({variant: 'destructive', title: 'Sign Out Failed', description: 'Could not sign out to switch users.'});
    });
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchTerm) return users;
    const lowercasedSearch = searchTerm.toLowerCase();
    return users.filter(user => 
      user.displayName.toLowerCase().includes(lowercasedSearch) ||
      user.email.toLowerCase().includes(lowercasedSearch)
    );
  }, [users, searchTerm]);

  const approvedUsers = useMemo(() => filteredUsers?.filter(u => u.status === 'approved') || [], [filteredUsers]);
  const pendingUsers = useMemo(() => filteredUsers?.filter(u => u.status === 'pending' || !u.status) || [], [filteredUsers]);
  const deniedUsers = useMemo(() => filteredUsers?.filter(u => u.status === 'denied') || [], [filteredUsers]);

  return (
    <>
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
              placeholder="Search by name or email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
                <UserTable users={approvedUsers} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} onDelete={handleDelete} updatingUsers={updatingUsers} onSwitchUser={handleSwitchUser} currentUserId={currentUser?.uid || null} />
              </TabsContent>
              <TabsContent value="pending" className="mt-0">
                <UserTable users={pendingUsers} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} onDelete={handleDelete} updatingUsers={updatingUsers} onSwitchUser={handleSwitchUser} currentUserId={currentUser?.uid || null} />
              </TabsContent>
              <TabsContent value="denied" className="mt-0">
                <UserTable users={deniedUsers} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} onDelete={handleDelete} updatingUsers={updatingUsers} onSwitchUser={handleSwitchUser} currentUserId={currentUser?.uid || null} />
              </TabsContent>
            </CardContent>
          </Tabs>
        )}
      </Card>
    </>
  );
}



