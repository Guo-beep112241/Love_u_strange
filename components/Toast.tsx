export interface ToastProps {
  message: string | null;
  tone?: 'ok' | 'error';
}

export function Toast({ message, tone = 'ok' }: ToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 bottom-24 z-[80] -translate-x-1/2 max-w-[86vw] px-3 py-2 border-2 font-zh text-caption text-center shadow-[3px_3px_0_0_#a8ff3e] ${
        tone === 'error'
          ? 'bg-surface-base text-brand-toxic border-brand-toxic shadow-[3px_3px_0_0_#ff4dc4]'
          : 'bg-brand-accent text-surface-base border-brand-accent'
      }`}
    >
      {message}
    </div>
  );
}
