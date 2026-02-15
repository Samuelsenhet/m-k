/**
 * Logging utility with log levels, formatting, remote logging, and toggleable debug mode.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('User signed in', { userId: '123' });
 *   logger.error('Payment failed', error);
 *
 * Toggle debug logs at runtime (persists via localStorage):
 *   logger.enableDebug()   // turn on
 *   logger.disableDebug()  // turn off
 */

import { supabase, hasValidSupabaseConfig } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

interface LogEntry {
  level: keyof typeof LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  url?: string;
  userAgent?: string;
  userId?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const LS_DEBUG_KEY = 'mk_debug_logging';

function isDebugEnabled(): boolean {
  try {
    return localStorage.getItem(LS_DEBUG_KEY) === 'true';
  } catch {
    return false;
  }
}

function getMinLevel(): LogLevel {
  if (import.meta.env.DEV || isDebugEnabled()) return LogLevel.DEBUG;
  return LogLevel.WARN;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const LEVEL_STYLES: Record<string, string> = {
  DEBUG: 'color:#8B8B8B',
  INFO: 'color:#2563EB',
  WARN: 'color:#D97706',
  ERROR: 'color:#DC2626;font-weight:bold',
};

const LEVEL_LABELS: Record<string, string> = {
  DEBUG: 'DBG',
  INFO: 'INF',
  WARN: 'WRN',
  ERROR: 'ERR',
};

function ts(): string {
  return new Date().toISOString();
}

function formatPrefix(level: string): [string, string] {
  const label = LEVEL_LABELS[level] ?? level;
  const style = LEVEL_STYLES[level] ?? '';
  return [`%c[${label}]`, style];
}

// ---------------------------------------------------------------------------
// Remote logging (batched)
// ---------------------------------------------------------------------------

const REMOTE_MIN_LEVEL = LogLevel.ERROR;
const FLUSH_INTERVAL_MS = 10_000;
const MAX_BATCH_SIZE = 20;

const remoteBuffer: LogEntry[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function startFlushTimer() {
  if (flushTimer) return;
  flushTimer = setInterval(flushRemoteLogs, FLUSH_INTERVAL_MS);
}

async function flushRemoteLogs() {
  if (remoteBuffer.length === 0 || !hasValidSupabaseConfig) return;

  const batch = remoteBuffer.splice(0, MAX_BATCH_SIZE);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table may not exist in generated types yet
    await (supabase as any).from('app_logs').insert(
      batch.map((entry) => ({
        level: entry.level,
        message: entry.message,
        data: entry.data != null ? JSON.parse(JSON.stringify(entry.data)) : null,
        created_at: entry.timestamp,
        url: entry.url,
        user_agent: entry.userAgent,
        user_id: entry.userId ?? null,
      })),
    );
  } catch {
    // Silently drop – we don't want logging failures to break the app.
    // Re-queue entries so they aren't lost (up to max batch size).
    remoteBuffer.unshift(...batch.slice(0, MAX_BATCH_SIZE - remoteBuffer.length));
  }
}

function queueRemoteLog(entry: LogEntry) {
  if (LogLevel[entry.level] < REMOTE_MIN_LEVEL) return;
  remoteBuffer.push(entry);
  if (remoteBuffer.length >= MAX_BATCH_SIZE) {
    void flushRemoteLogs();
  }
  startFlushTimer();
}

// ---------------------------------------------------------------------------
// Core log function
// ---------------------------------------------------------------------------

function log(level: keyof typeof LogLevel, message: string, ...data: unknown[]) {
  const numericLevel = LogLevel[level];
  if (numericLevel < getMinLevel()) return;

  const [prefix, style] = formatPrefix(level);
  const consoleFn =
    level === 'ERROR'
      ? console.error
      : level === 'WARN'
        ? console.warn
        : level === 'DEBUG'
          ? console.debug
          : console.log;

  consoleFn(prefix, style, message, ...data);

  // Queue for remote logging if severe enough
  const entry: LogEntry = {
    level,
    message,
    data: data.length === 1 ? data[0] : data.length > 1 ? data : undefined,
    timestamp: ts(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };

  // Attach user ID if a session exists (non-blocking)
  supabase.auth.getSession().then(({ data }) => {
    entry.userId = data.session?.user?.id;
    queueRemoteLog(entry);
  }).catch(() => {
    queueRemoteLog(entry);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const logger = {
  debug: (message: string, ...data: unknown[]) => log('DEBUG', message, ...data),
  info: (message: string, ...data: unknown[]) => log('INFO', message, ...data),
  warn: (message: string, ...data: unknown[]) => log('WARN', message, ...data),
  error: (message: string, ...data: unknown[]) => log('ERROR', message, ...data),
  log: (message: string, ...data: unknown[]) => log('INFO', message, ...data),

  /** Group console output (dev/debug only). */
  group: (label: string) => {
    if (import.meta.env.DEV || isDebugEnabled()) console.group(label);
  },
  groupEnd: () => {
    if (import.meta.env.DEV || isDebugEnabled()) console.groupEnd();
  },

  /** Enable debug-level logging (persists in localStorage). */
  enableDebug: () => {
    try {
      localStorage.setItem(LS_DEBUG_KEY, 'true');
    } catch { /* noop */ }
    console.log('%c[Logger] Debug logging enabled', 'color:green');
  },

  /** Disable debug-level logging. */
  disableDebug: () => {
    try {
      localStorage.removeItem(LS_DEBUG_KEY);
    } catch { /* noop */ }
    console.log('%c[Logger] Debug logging disabled', 'color:gray');
  },

  /** Immediately flush any buffered remote logs. */
  flush: flushRemoteLogs,
};

// Flush on page unload so we don't lose buffered entries.
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushRemoteLogs();
    }
  });
}
