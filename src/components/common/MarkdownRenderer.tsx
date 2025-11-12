
"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
    return (
        <ReactMarkdown
            className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
            components={{
                p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                em: ({ node, ...props }) => <em className="italic" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                a: ({ node, ...props }) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    );
};
