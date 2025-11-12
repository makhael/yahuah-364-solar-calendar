import YahuahCalendar from '@/components/calendar/YahuahCalendar';
import { CalendarErrorBoundary } from '@/components/calendar/CalendarErrorBoundary';

export default function Home() {
  return (
    <CalendarErrorBoundary>
      <YahuahCalendar />
    </CalendarErrorBoundary>
  );
}
