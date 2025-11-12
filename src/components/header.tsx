import { Box } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-2">
        <Box className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Yahuah's 364 Solar Calendar</h1>
      </div>
      <p className="hidden text-muted-foreground md:block">
        A pristine digital environment for your projects.
      </p>
    </header>
  );
}
