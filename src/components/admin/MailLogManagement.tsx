
'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { LoaderCircle, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface MailLog {
  id: string;
  to: string[];
  message?: {
    subject: string;
    html: string;
  };
  template?: {
    name: string;
  }
  delivery?: {
    state: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
    startTime: { seconds: number };
    endTime?: { seconds: number };
    error?: string;
  };
}

const getStatusInfo = (state?: MailLog['delivery']['state']) => {
  switch (state) {
    case 'SUCCESS':
      return { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Success', color: 'border-green-500/50 bg-green-900/20' };
    case 'ERROR':
      return { icon: <XCircle className="h-4 w-4 text-red-500" />, text: 'Error', color: 'border-red-500/50 bg-red-900/20' };
    case 'PROCESSING':
      return { icon: <LoaderCircle className="h-4 w-4 text-blue-500 animate-spin" />, text: 'Processing', color: 'border-blue-500/50 bg-blue-900/20' };
    default:
      return { icon: <Clock className="h-4 w-4 text-amber-500" />, text: 'Pending', color: 'border-amber-500/50 bg-amber-900/20' };
  }
};

const MailLogItem = ({ log }: { log: MailLog }) => {
  const statusInfo = getStatusInfo(log.delivery?.state);
  const subject = log.message?.subject || (log.template ? `Template: ${log.template.name}` : 'No Subject');
  const htmlContent = log.message?.html || `<p>Email content is being generated from the '${log.template?.name || 'unknown'}' template...</p>`;

  return (
    <AccordionItem value={log.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex justify-between items-center w-full pr-4">
            <div className="flex-grow text-left">
                <p className="font-semibold text-foreground truncate">{subject}</p>
                <p className="text-xs text-muted-foreground">To: {log.to.join(', ')}</p>
            </div>
             <Badge variant="outline" className={cn("flex-shrink-0 items-center gap-2", statusInfo.color)}>
                {statusInfo.icon}
                <span>{statusInfo.text}</span>
            </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 bg-background/50 rounded-md border space-y-3">
          <div>
            <h4 className="font-semibold text-sm text-foreground/90">Delivery Details</h4>
            <p className="text-xs text-muted-foreground">
              Queued: {log.delivery?.startTime ? new Date(log.delivery.startTime.seconds * 1000).toLocaleString() : 'N/A'}
            </p>
            {log.delivery?.endTime && (
              <p className="text-xs text-muted-foreground">
                Finished: {new Date(log.delivery.endTime.seconds * 1000).toLocaleString()}
              </p>
            )}
            {log.delivery?.error && (
              <p className="text-xs text-destructive mt-2">
                Error: {log.delivery.error}
              </p>
            )}
          </div>
          <div className="pt-3 border-t">
            <h4 className="font-semibold text-sm text-foreground/90">Email Content</h4>
            <div className="mt-2 border rounded-md p-2 bg-white max-h-60 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="prose prose-sm max-w-none text-black" />
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default function MailLogManagement() {
  const firestore = useFirestore();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  const mailQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'mail'), orderBy('delivery.startTime', 'desc'));
  }, [firestore]);

  const { data: mailLogs, isLoading } = useCollection<MailLog>(mailQuery);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative flex h-24 w-24 items-center justify-center">
            <LoaderCircle className="absolute h-full w-full animate-spin text-primary/50" />
            {logo && (
                <Image
                    src={logo.imageUrl}
                    alt={logo.description}
                    width={64}
                    height={64}
                    data-ai-hint={logo.imageHint}
                    className="h-16 w-16 rounded-full object-cover"
                    priority
                />
            )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mail Delivery Logs</CardTitle>
        <CardDescription>
          Status of emails sent by the Trigger Email extension. New logs may take a minute to appear.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mailLogs && mailLogs.length > 0 ? (
          <ScrollArea className="h-[60vh]">
            <Accordion type="multiple" className="pr-4">
              {mailLogs.map(log => <MailLogItem key={log.id} log={log} />)}
            </Accordion>
          </ScrollArea>
        ) : (
          <div className="text-center p-8 bg-secondary/30 rounded-lg">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No Email Logs Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No emails have been sent through the system yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
