import React from 'react';

interface IncomingCallNotificationProps {
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({ callerName, onAccept, onDecline }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
    <div className="bg-card rounded-xl p-6 shadow-lg text-center">
      <h2 className="font-serif font-semibold text-lg mb-2">Video Call Request</h2>
      <p className="mb-4">{callerName} wants to start a video call.</p>
      <div className="flex gap-4 justify-center">
        <button className="bg-primary text-white px-4 py-2 rounded-full" onClick={onAccept}>Accept</button>
        <button className="bg-muted px-4 py-2 rounded-full" onClick={onDecline}>Decline</button>
      </div>
    </div>
  </div>
);
