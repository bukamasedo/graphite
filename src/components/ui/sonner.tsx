import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          fontSize: '12px',
        },
      }}
    />
  );
}
