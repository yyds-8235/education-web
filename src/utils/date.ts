import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
    return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
    return dayjs(date).format(format);
}

export function formatTime(date: string | Date, format = 'HH:mm:ss'): string {
    return dayjs(date).format(format);
}

export function fromNow(date: string | Date): string {
    return dayjs(date).fromNow();
}

export function isToday(date: string | Date): boolean {
    return dayjs(date).isSame(dayjs(), 'day');
}

export function isYesterday(date: string | Date): boolean {
    return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
}

export function isTomorrow(date: string | Date): boolean {
    return dayjs(date).isSame(dayjs().add(1, 'day'), 'day');
}

export function isThisWeek(date: string | Date): boolean {
    return dayjs(date).isSame(dayjs(), 'week');
}

export function isThisMonth(date: string | Date): boolean {
    return dayjs(date).isSame(dayjs(), 'month');
}

export function getWeekDays(date?: string | Date): string[] {
    const start = dayjs(date).startOf('week');
    return Array.from({ length: 7 }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'));
}

export function getMonthDays(year: number, month: number): number {
    return dayjs(`${year}-${month}`).daysInMonth();
}

export function getAge(birthDate: string | Date): number {
    return dayjs().diff(dayjs(birthDate), 'year');
}

export function getDuration(start: string | Date, end: string | Date): number {
    return dayjs(end).diff(dayjs(start), 'minute');
}

export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
        return `${mins}分钟`;
    }

    if (mins === 0) {
        return `${hours}小时`;
    }

    return `${hours}小时${mins}分钟`;
}
