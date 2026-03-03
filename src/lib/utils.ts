import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import i18n from '@/i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 0) return i18n.t('time.justNow');
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return i18n.t('time.justNow');
  if (mins < 60) return i18n.t('time.minsAgo', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return i18n.t('time.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return i18n.t('time.daysAgo', { count: days });
  return date.toLocaleDateString();
}
