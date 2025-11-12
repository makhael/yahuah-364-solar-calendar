"use client";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SunIcon, MoonIcon } from '@/components/calendar/icons';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTheme } from '@/context/ThemeContext';

export const ThemeSwitcher = () => {
    const { theme, setTheme } = useTheme();

    return (
        <DropdownMenu>
            <TooltipProvider>
                <Tooltip>
                    <DropdownMenuTrigger asChild>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon">
                                {theme === 'theme-paper-light' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                                <span className="sr-only">Change theme</span>
                            </Button>
                        </TooltipTrigger>
                    </DropdownMenuTrigger>
                    <TooltipContent>
                        <p>Change Theme</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as any)}>
                    <DropdownMenuRadioItem value="theme-desert-scroll">
                        <MoonIcon className="mr-2 h-4 w-4" />
                        <span>Desert Scroll</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="theme-ocean-blue">
                        <MoonIcon className="mr-2 h-4 w-4" />
                        <span>Ocean Blue</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="theme-paper-light">
                        <SunIcon className="mr-2 h-4 w-4" />
                        <span>Paper Light</span>
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};