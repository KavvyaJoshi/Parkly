import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { onSlowRequestsChange } from '../../services/api.js';

/**
 * Explains slow first loads: the free API host sleeps when idle and takes
 * up to a minute to start again. Shown only while a request is unusually slow.
 */
export default function ServerWakeBanner() {
  const [slow, setSlow] = useState(false);

  useEffect(() => onSlowRequestsChange(setSlow), []);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      {slow && (
        <div className="flex max-w-md items-start gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          <p>
            <span className="font-semibold">Waking up the server…</span> Parkly runs on free hosting that sleeps when
            idle, so the first load can take up to a minute.
          </p>
        </div>
      )}
    </div>
  );
}
