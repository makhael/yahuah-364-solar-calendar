import Header from '@/components/header';
import WorkspaceInit from '@/components/workspace-init';
import SecureWipe from '@/components/secure-wipe';
import AutoConfig from '@/components/auto-config';
import EnvProfiler from '@/components/env-profiler';

export default function ToolsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 lg:p-10">
        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          <WorkspaceInit />
          <SecureWipe />
          <EnvProfiler />
          <AutoConfig />
        </div>
      </main>
    </div>
  );
}
