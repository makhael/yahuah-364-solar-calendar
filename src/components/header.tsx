import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Header() {
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <Link href="/" className="flex items-center gap-3">
        {logo && (
            <Image
                src={logo.imageUrl}
                alt={logo.description}
                width={32}
                height={32}
                data-ai-hint={logo.imageHint}
                className="h-8 w-8 rounded-full object-cover"
            />
        )}
        <h1 className="text-lg font-semibold tracking-tight md:text-xl">Yahuah's 364 Solar Calendar</h1>
      </Link>
      <p className="hidden text-muted-foreground md:block">
        A pristine digital environment for your projects.
      </p>
    </header>
  );
}
