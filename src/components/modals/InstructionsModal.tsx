
'use client';

import React from 'react';
import { XCircle, BookOpen, Palette, Compass, CalendarDays, Edit, Users, Mic, ScrollText, ThumbsUp, BookMarked, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstructionItem = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="text-primary mt-1 w-6 flex-shrink-0">{icon}</div>
        <div className="flex-1">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">{children}</p>
        </div>
    </div>
);


export const InstructionsModal = ({ isOpen, onClose }: InstructionsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl relative border flex flex-col max-h-[90vh] h-full sm:h-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-bg-pattern absolute inset-0 opacity-10 rounded-2xl"></div>
        <div className="relative z-10 flex flex-col h-full">
            <div className="p-6 pb-4 flex-shrink-0 border-b">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-20"
                    aria-label="Close"
                >
                    <XCircle className="w-8 h-8" />
                </button>
                <div className="flex items-start gap-4 pr-8">
                    <BookOpen className="w-8 h-8 md:w-7 md:h-7 text-foreground mt-1 flex-shrink-0" />
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-foreground">
                            How to Use This Calendar
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">A guide to restoring true time.</p>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto">
                <ScrollArea className="h-full">
                    <div className="p-6">
                        <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Welcome to True Time!</AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-muted-foreground">This calendar is a tool for restoring the original 364-day solar calendar described in the books of Enoch and Jubilees. It's designed to help you track Sabbaths, Feasts (Moedim), and prophetic time as ordained by the Creator, free from the corruption of Babylonian and Roman systems.</p>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-2">
                                <AccordionTrigger>The Master Control Panel</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <InstructionItem icon={<Palette />} title="Theme Switcher">
                                        Change the visual appearance of the calendar. Choose between Desert Scroll, Ocean Blue, and Paper Light themes to suit your preference.
                                    </InstructionItem>
                                    <InstructionItem icon={<Compass />} title="Calendar Alignment (Presets)">
                                        This is the most important setting. A "preset" saves a specific Gregorian date as the anchor for "Month 1, Day 1." You can create multiple presets (e.g., one for Qumran alignment, another for a different reckoning) and switch between them. As a guest, you can use the date picker to set this anchor date.
                                    </InstructionItem>
                                    <InstructionItem icon={<Users />} title="User Profile & Sign In">
                                        Sign in to save your notes, presets, and other data. You can continue as a guest, but your data will only be saved on your current device. Creating an account saves everything to the cloud, accessible from anywhere.
                                    </InstructionItem>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Navigating the Calendar & Your Notes</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <InstructionItem icon={<CalendarDays />} title="Day & Month Details">
                                        Click on any day to open a detailed modal with information about its spiritual significance, Hebrew name, and community-submitted scriptures. Click the info icon next to a month's title for a deeper look into its meaning.
                                    </InstructionItem>
                                    <InstructionItem icon={<Edit />} title="Private Notes">
                                        In the Day Detail modal, you can write private, personal notes for any day. These notes are only visible to you and are saved to your account if you are signed in.
                                    </InstructionItem>
                                    <InstructionItem icon={<BookMarked />} title="My Revelation Timeline">
                                        When a note feels like a significant insight from the Ruach, check the "Mark as Revelation" box before saving. This will add the note to your personal "My Revelation Timeline" on the main page, creating a powerful journal of your spiritual journey through time.
                                    </InstructionItem>
                                     <InstructionItem icon={<Search />} title="Search & Go to Date">
                                        Use the search icon in the header to find anything in the calendar. You can jump directly to a specific day by typing "m1d15" (for Month 1, Day 15) or "d4" (for Day 4 of any month). You can also search for feast names, glossary terms, or podcast titles.
                                    </InstructionItem>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger>Community & Study Tools</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <InstructionItem icon={<ThumbsUp />} title="Community Scriptures">
                                        Inside the Day Detail modal, you can share a scripture reference that you feel is relevant to that day. The community can then "upvote" submissions that resonate with them by clicking the thumbs-up icon. The most-upvoted scriptures for that day will rise to the top, creating a shared treasury of inspired readings.
                                    </InstructionItem>
                                    <InstructionItem icon={<Users />} title="Daily Discussion & Forums">
                                        Click the chat icon in the header to open the community hub. You can participate in a public chat specific to the current day or create and join broader discussion topics in the Community Forums.
                                    </InstructionItem>
                                    <InstructionItem icon={<CalendarDays />} title="Community Appointments">
                                        Appointments created by leaders appear on the calendar days. Click on a day to view details and RSVP if you are signed in.
                                    </InstructionItem>
                                    <InstructionItem icon={<ScrollText />} title="The Glossary">
                                        This calendar is filled with restored Hebrew terms. Click any underlined, italicized term to open a pop-up definition. You can also access the Full Glossary from the footer to search all terms or even propose new ones for the community.
                                    </InstructionItem>
                                    <InstructionItem icon={<Mic />} title="Podcast Hub">
                                        Scroll down to the "Podcast Series Hub" to find in-depth audio teachings that correspond to the principles of this calendar.
                                    </InstructionItem>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-5">
                                <AccordionTrigger>Teacher & Admin Tools</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Users with a 'Leader' or 'Admin' role can access the unified **Admin Dashboard** from their user profile dropdown. This dashboard contains all management tools in one place.</p>
                                    <InstructionItem icon={<ShieldCheck />} title="Admin Dashboard">
                                        This central hub, accessible via your profile menu, contains all management pages. Use the sidebar to navigate between User Management, Appointments, Scrolls, Scriptures, and Forums.
                                    </InstructionItem>
                                    <InstructionItem icon={<BookMarked />} title="Teacher's Scriptorium (in Dashboard)">
                                        This is your personal library. Upload your entire collection of notes and teachings as Markdown (.md) files. The app will organize them by folder, allowing you to read, study, and sort them. You can sort categories and scrolls alphabetically or by a custom drag-and-drop order.
                                    </InstructionItem>
                                    <InstructionItem icon={<CalendarDays />} title="Appointment Management (in Dashboard)">
                                       Create and manage events for the whole community. Create single-day, multi-day, or recurring events. These appointments will appear on the main calendar for all users to see.
                                    </InstructionItem>
                                    <InstructionItem icon={<ScrollText />} title="Content Moderation (in Dashboard)">
                                        Admins and Leaders can moderate all community-submitted content. You can edit or delete any scripture submission from the "Scripture Management" page and delete entire topics or individual messages from the "Forum Management" page to ensure the community remains healthy and focused.
                                    </InstructionItem>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </ScrollArea>
            </div>
            
            <div className="p-4 flex-shrink-0 border-t flex justify-end bg-secondary/30 rounded-b-2xl">
                <Button type="button" onClick={onClose}>Close</Button>
            </div>
        </div>
      </div>
    </div>
  );
};
