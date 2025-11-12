"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from "@/components/ui/alert-dialog";

export default function WorkspaceInit() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleInit = () => {
    setIsInitializing(true);
    setInitialized(false);
    setProgress(0);
  };

  useEffect(() => {
    if (isInitializing) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setIsInitializing(false);
            setInitialized(true);
            return 100;
          }
          return prev + 5;
        });
      }, 300);
      return () => clearInterval(timer);
    }
  }, [isInitializing]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-6 w-6" />
          Workspace Initialization
        </CardTitle>
        <CardDescription>Create a pristine digital environment for a new project.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {isInitializing && (
          <div className="flex h-full min-h-[150px] flex-col items-center justify-center space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">Initializing workspace...</p>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground animate-pulse">Applying parameters...</p>
          </div>
        )}
        {initialized && (
          <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border-2 border-dashed border-primary/50 bg-primary/10 p-8 text-center h-full">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <h3 className="text-lg font-semibold">Workspace Initialized!</h3>
            <p className="text-sm text-muted-foreground">Your new environment is ready.</p>
          </div>
        )}
        {!isInitializing && !initialized && (
          <form className="space-y-4">
            <p className="text-sm font-medium text-foreground">Environment Parameters</p>
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input id="projectName" placeholder="e.g., my-awesome-project" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="framework">Framework</Label>
              <Select>
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Select a framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nextjs">Next.js</SelectItem>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="vue">Vue</SelectItem>
                  <SelectItem value="svelte">Svelte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full" disabled={isInitializing || initialized}>
              Initialize Workspace
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will create a pristine environment. Any unsaved changes in the current workspace will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleInit}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {initialized && (
          <Button variant="outline" onClick={() => setInitialized(false)} className="w-full ml-4">
            Start Another
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
