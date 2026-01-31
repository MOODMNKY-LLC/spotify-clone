'use client';

import { Box } from '@/components/Box';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  console.error('[site error boundary]', error?.message ?? error, error?.digest ?? '');
  return (
    <Box className="h-full flex flex-col items-center justify-center gap-4">
      <div className="text-neutral-400">Something went wrong.</div>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 transition"
      >
        Try again
      </button>
    </Box>
  );
}
