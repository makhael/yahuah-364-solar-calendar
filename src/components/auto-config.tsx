"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, Copy, Check } from 'lucide-react';
import { generateConfig } from '@/app/actions';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  projectRequirements: z.string().min(10, "Please provide more details about your project requirements (at least 10 characters)."),
});

type FormValues = z.infer<typeof formSchema>;

export default function AutoConfig() {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectRequirements: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setConfig(null);
    setError(null);

    const formData = new FormData();
    formData.append('projectRequirements', values.projectRequirements);
    
    const result = await generateConfig(null, formData);

    if (result.data) {
      setConfig(result.data);
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  }
  
  const handleCopy = () => {
    if (config) {
      navigator.clipboard.writeText(config);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-6 w-6" />
          Automated Configuration
        </CardTitle>
        <CardDescription>AI-powered setup based on your project needs.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow flex flex-col">
          <CardContent className="flex-grow space-y-4">
            <FormField
              control={form.control}
              name="projectRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., A Next.js app with TypeScript, Tailwind CSS for styling, and connected to a PostgreSQL database."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {config && (
              <div className="relative rounded-md bg-muted/50">
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-chart-2" /> : <Copy className="h-4 w-4" />}
                </Button>
                <ScrollArea className="h-48">
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                    <code>{config}</code>
                  </pre>
                </ScrollArea>
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Generating...' : 'Generate Configuration'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
