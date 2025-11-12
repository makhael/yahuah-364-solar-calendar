"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

const wipeTasks = [
  "Clearing session storage...",
  "Erasing local storage...",
  "Deleting cached assets...",
  "Purging temporary files...",
  "Verifying data removal...",
];

export default function SecureWipe() {
  const [isWiping, setIsWiping] = useState(false);
  const [wiped, setWiped] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  const handleWipe = () => {
    setIsWiping(true);
    setWiped(false);
    setCurrentTaskIndex(0);
  };

  useEffect(() => {
    if (isWiping) {
      if (typeof window !== "undefined") {
        window.localStorage.clear();
        window.sessionStorage.clear();
      }
      
      const timer = setInterval(() => {
        setCurrentTaskIndex(prev => {
          if (prev >= wipeTasks.length - 1) {
            clearInterval(timer);
            setIsWiping(false);
            setWiped(true);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
      return () => clearInterval(timer);
    }
  }, [isWiping]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-6 w-6 text-destructive" />
          Secure Data Wipe
        </CardTitle>
        <CardDescription>Permanently erase sensitive information before reset.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {isWiping && (
          <div className="space-y-3">
            <p className="text-sm text-center font-medium">Wiping in progress...</p>
            <ul className="space-y-2">
              {wipeTasks.map((task, index) => (
                <li key={index} className={cn("flex items-center gap-3 text-sm transition-opacity", index <= currentTaskIndex ? 'opacity-100 text-muted-foreground' : 'opacity-30')}>
                  {index < currentTaskIndex ? (
                    <CheckCircle className="h-4 w-4 text-chart-2" />
                  ) : index === currentTaskIndex ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {wiped && (
          <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border-2 border-dashed border-chart-2/50 bg-chart-2/10 p-8 text-center h-full">
            <CheckCircle className="h-12 w-12 text-chart-2" />
            <h3 className="text-lg font-semibold">Data Wipe Complete</h3>
            <p className="text-sm text-muted-foreground">All temporary data has been securely erased.</p>
          </div>
        )}
        {!isWiping && !wiped && (
           <div className="flex h-full min-h-[150px] items-center justify-center rounded-lg border-2 border-dashed">
             <div className="text-center text-muted-foreground">
                <p>Click "Wipe Data" to securely erase temporary data.</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full" disabled={isWiping || wiped}>
              <Trash2 className="mr-2 h-4 w-4" /> Wipe Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action is irreversible and will permanently delete all temporary data, including local and session storage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleWipe}>
                Yes, Wipe Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {wiped && (
          <Button variant="outline" onClick={() => setWiped(false)} className="w-full">
            Wipe Again
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
