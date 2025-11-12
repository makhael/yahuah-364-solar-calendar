"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, FileWarning, AlertCircle, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const issues = [
  { icon: FileWarning, text: "Found 3 unused dependencies.", type: "warning" },
  { icon: AlertCircle, text: "Port 3000 is already in use by another process.", type: "conflict" },
  { icon: FileWarning, text: "Node.js version is outdated (v18.12.1), recommended v20.0.0+.", type: "warning" },
  { icon: AlertCircle, text: "Misconfigured '.env' file: missing 'DATABASE_URL'.", type: "conflict" },
];

export default function EnvProfiler() {
  const [isProfiling, setIsProfiling] = useState(false);
  const [profiled, setProfiled] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProfile = () => {
    setIsProfiling(true);
    setProfiled(false);
    setProgress(0);
  };

  useEffect(() => {
    if (isProfiling) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setIsProfiling(false);
            setProfiled(true);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(timer);
    }
  }, [isProfiling]);

  const renderIssue = (issue: typeof issues[0], index: number) => (
    <div key={index} className="flex items-center gap-3">
      <issue.icon className={`h-5 w-5 ${issue.type === 'warning' ? 'text-chart-4' : 'text-destructive'}`} />
      <p className="text-sm text-muted-foreground">{issue.text}</p>
    </div>
  );
  
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6" />
              Environment Profiler
            </CardTitle>
            <CardDescription>Detect remnants, misconfigurations, or conflicts.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {isProfiling && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Scanning environment...</p>
            <Progress value={progress} className="w-full" />
          </div>
        )}
        {profiled && (
          <div className="space-y-4">
            <h3 className="font-semibold">Profile complete. Found {issues.length} issues:</h3>
            <div className="space-y-3 rounded-lg border bg-card p-4">
              {issues.map(renderIssue)}
            </div>
          </div>
        )}
        {!isProfiling && !profiled && (
          <div className="flex h-full min-h-[150px] items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center text-muted-foreground">
                <p>Click "Profile Environment" to start scanning.</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleProfile} disabled={isProfiling} className="w-full">
          {isProfiling ? 'Profiling...' : profiled ? <><RefreshCw className="mr-2 h-4 w-4" />Re-run Profile</> : 'Profile Environment'}
        </Button>
      </CardFooter>
    </Card>
  );
}
