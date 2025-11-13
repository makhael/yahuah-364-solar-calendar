
import WorkspaceInit from '@/components/workspace-init';
import SecureWipe from '@/components/secure-wipe';
import AutoConfig from '@/components/auto-config';
import EnvProfiler from '@/components/env-profiler';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Terminal } from 'lucide-react';
import Link from 'next/link';


export default function ToolsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 lg:p-10">
      <header className="mb-12 flex flex-wrap gap-4 justify-between items-center">
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-left flex items-center gap-3">
          <Terminal className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-base font-bold text-primary tracking-wide">Developer Tools</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Advanced tools for environment management.</p>
          </div>
        </div>
        <Button variant="outline" asChild>
            <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Calendar
            </Link>
        </Button>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
        <WorkspaceInit />
        <SecureWipe />
        <EnvProfiler />
        <AutoConfig />
      </div>
    </div>
  );
}
