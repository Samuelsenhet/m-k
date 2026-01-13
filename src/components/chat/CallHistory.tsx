import React from 'react';

export interface CallLogEntry {
  type: 'missed' | 'completed';
  timestamp: string;
  duration?: number; // seconds
  callerName: string;
}

interface CallHistoryProps {
  logs: CallLogEntry[];
}

export const CallHistory: React.FC<CallHistoryProps> = ({ logs }) => (
  <div className="mt-4">
    <h3 className="font-serif font-semibold text-base mb-2">Call History</h3>
    <ul className="space-y-2">
      {logs.map((log, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <span className={`inline-block w-2 h-2 rounded-full ${log.type === 'missed' ? 'bg-red-500' : 'bg-green-500'}`}></span>
          <span>{log.type === 'missed' ? 'Missed call' : 'Completed call'} with {log.callerName}</span>
          <span className="ml-auto text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
          {log.type === 'completed' && log.duration !== undefined && (
            <span className="ml-2 text-muted-foreground">{Math.floor(log.duration / 60)}m {log.duration % 60}s</span>
          )}
        </li>
      ))}
    </ul>
  </div>
);
