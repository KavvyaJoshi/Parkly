import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiRequest, onSlowRequestsChange, SLOW_REQUEST_MS } from '../services/api.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('slow request tracking', () => {
  it('reports slow requests (e.g. a sleeping server) and clears when they finish', async () => {
    vi.useFakeTimers();
    let respond;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { respond = resolve; })));
    const listener = vi.fn();
    const unsubscribe = onSlowRequestsChange(listener);

    const request = apiRequest('/health', { auth: false });
    await vi.advanceTimersByTimeAsync(SLOW_REQUEST_MS - 1);
    expect(listener).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(listener).toHaveBeenLastCalledWith(true);

    respond(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }));
    await expect(request).resolves.toEqual({ status: 'ok' });
    expect(listener).toHaveBeenLastCalledWith(false);
    unsubscribe();
  });

  it('stays quiet for fast requests', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    const listener = vi.fn();
    const unsubscribe = onSlowRequestsChange(listener);

    await apiRequest('/health', { auth: false });
    await vi.advanceTimersByTimeAsync(SLOW_REQUEST_MS * 2);

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});
