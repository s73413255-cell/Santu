/**
 * Utility functions for formatting numbers, currency and time
 */

export function formatCoins(amount: number): string {
  if (amount < 1000) {
    return Math.floor(amount).toLocaleString();
  }
  if (amount < 1000000) {
    const k = amount / 1000;
    return k >= 100 ? `${Math.floor(k)}K` : `${k.toFixed(1)}K`;
  }
  if (amount < 1000000000) {
    const m = amount / 1000000;
    return m >= 100 ? `${Math.floor(m)}M` : `${m.toFixed(2)}M`;
  }
  const b = amount / 1000000000;
  return `${b.toFixed(2)}B`;
}

export function formatTimeSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
