
import { TEKUFAH_MONTHS, APPOINTMENTS } from './calendar-data';
import { type Toast } from '@/hooks/use-toast';

export const getYearStartInfo = (dateString: string) => {
  // Protective check to prevent TypeError if dateString is undefined
  const validDateString = dateString || new Date().toISOString().split('T')[0];
  const startDate = new Date(validDateString + 'T00:00:00');
  return { startDate };
};

export const getGregorianDate = (startDate: Date, monthNum: number, dayNum: number) => {
  let dayOffset = 0;
  for (let m = 1; m < monthNum; m++) {
    dayOffset += TEKUFAH_MONTHS.includes(m) ? 31 : 30;
  }
  dayOffset += dayNum - 1;
  const target = new Date(startDate.getTime());
  target.setDate(target.getDate() + dayOffset);
  return target;
};

export const get364DateFromGregorian = (gregorianDate: Date, m1d1StartDate: Date) => {
  const diffTime = gregorianDate.getTime() - m1d1StartDate.getTime();
  
  const dayOfYear = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (dayOfYear < 0) {
    return null;
  }

  let month = 1;
  let day = dayOfYear + 1;

  while (month <= 12) {
    const daysInThisMonth = TEKUFAH_MONTHS.includes(month) ? 31 : 30;
    
    if (day <= daysInThisMonth) {
      break;
    }
    
    day -= daysInThisMonth;
    month++;

    if (month > 12) {
      return null;
    }
  }

  return { month, day };
};

export function getWeekNumber(d: Date) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  return weekNo;
}

export function copyToClipboard(text: string, toast?: (props: Toast) => any) {
  if (!text) return;

  // Modern browsers with clipboard permission
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      if (toast) {
        toast({ title: 'Copied to clipboard!' });
      }
    }).catch(err => {
      console.warn('Modern copy failed, falling back:', err);
      fallbackCopy(text, toast); // Fallback for browsers that block the API
    });
  } else {
    // Fallback for older browsers
    fallbackCopy(text, toast);
  }
}

// Fallback method for copying text to clipboard
function fallbackCopy(text: string, toast?: (props: Toast) => any) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Make the textarea invisible
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful && toast) {
      toast({ title: 'Copied to clipboard!' });
    } else if (!successful && toast) {
        toast({ variant: 'destructive', title: 'Copy failed', description: 'Could not copy text to clipboard.' });
    }
  } catch (err) {
    console.error('Fallback copy failed: ', err);
    if(toast) {
        toast({ variant: 'destructive', title: 'Copy failed', description: 'An error occurred during copy.' });
    }
  }

  document.body.removeChild(textArea);
}


export const exportToICS = (year: number, startDate: Date) => {
  const events: string[] = [];
  
  Object.entries(APPOINTMENTS).forEach(([key, appointment]) => {
    const [monthNum, dayNum] = key.split('-').map(Number);
    const gregorianDate = getGregorianDate(startDate, monthNum, dayNum);
    
    const startDateStr = gregorianDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    events.push(`BEGIN:VEVENT
UID:${key}-${year}@yahuah-calendar
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}
DTSTART;VALUE=DATE:${gregorianDate.getFullYear()}${String(gregorianDate.getMonth() + 1).padStart(2, '0')}${String(gregorianDate.getDate()).padStart(2, '0')}
SUMMARY:${appointment.label}
DESCRIPTION:${appointment.meaning}. ${appointment.prophetic || ''}
LOCATION:Yahuah's Calendar
END:VEVENT`);
  });

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Yahuah's Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${events.join('\n')}
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `yahuah-calendar-${year}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getSacredMonthName = (monthNum: number) => {
    const torahNamedMonths: Record<number, string> = { 1: 'Aviv', 2: 'Ziv', 7: 'Ethanim', 8: 'Bul' };
    if (torahNamedMonths[monthNum]) {
        return torahNamedMonths[monthNum];
    }
    const ordinals: Record<number, string> = { 3: 'Third', 4: 'Fourth', 5: 'Fifth', 6: 'Sixth', 9: 'Ninth', 10: 'Tenth', 11: 'Eleventh', 12: 'Twelfth' };
    return `The ${ordinals[monthNum]} Month`;
}
