import { useMemo } from 'react';
import { JourneyPhase } from './useUserJourney';
import { Pose } from '@/components/mascot/MaakMascot';

export interface MascotStateConfig {
  pose: Pose;
  message: string | null;
  effects?: string[];
}

const MASCOT_STATES: Record<string, MascotStateConfig> = {
  ONBOARDING: {
    pose: 'Idle',
    message: null
  },
  WAITING: {
    pose: 'Idle',
    message: 'Dina matchningar analyseras... 🔍'
  },
  READY: {
    pose: 'Jump',
    message: 'Dina matchningar är redo! 🎉',
    effects: ['pulse']
  },
  FIRST_MATCH: {
    pose: 'Happy',
    message: 'Din första matchning! Välkommen till MÄÄK! 🥳',
    effects: ['confetti', 'sparkles']
  },
  NEW_BATCH: {
    pose: 'Happy',
    message: 'Nya matchningar har anlänt! 🔥',
    effects: ['pulse']
  },
  NO_MATCHES: {
    pose: 'Idle',
    message: 'Inga nya matchningar idag, men imorgon kommer fler! 💫'
  },
  MATCH_OPENED: {
    pose: 'Jump',
    message: null
  },
  ICEBREAKER_USED: {
    pose: 'Happy',
    message: 'Bra val av isbrytare! 💬'
  }
};

export type MascotEventType = 
  | 'BATCH_DELIVERED'
  | 'FIRST_MATCH'
  | 'MATCH_OPENED'
  | 'ICEBREAKER_USED'
  | 'NO_MATCHES';

export const useMascotState = (
  journeyPhase: JourneyPhase,
  isFirstDay: boolean = false,
  matchesDeliveredToday: number = 0
): MascotStateConfig => {
  return useMemo(() => {
    // Priority: Event states > Journey states
    
    switch (journeyPhase) {
      case 'ONBOARDING':
        return MASCOT_STATES.ONBOARDING;
        
      case 'WAITING':
        return MASCOT_STATES.WAITING;
        
      case 'READY':
        if (isFirstDay) {
          return MASCOT_STATES.FIRST_MATCH;
        }
        return MASCOT_STATES.READY;
        
      case 'ACTIVE':
        if (isFirstDay && matchesDeliveredToday > 0) {
          return MASCOT_STATES.FIRST_MATCH;
        }
        if (matchesDeliveredToday > 0) {
          return MASCOT_STATES.NEW_BATCH;
        }
        return MASCOT_STATES.NO_MATCHES;
        
      default:
        return MASCOT_STATES.ONBOARDING;
    }
  }, [journeyPhase, isFirstDay, matchesDeliveredToday]);
};

// Get mascot state for specific events
export const getMascotEventState = (eventType: MascotEventType): MascotStateConfig => {
  switch (eventType) {
    case 'BATCH_DELIVERED':
      return MASCOT_STATES.NEW_BATCH;
    case 'FIRST_MATCH':
      return MASCOT_STATES.FIRST_MATCH;
    case 'MATCH_OPENED':
      return MASCOT_STATES.MATCH_OPENED;
    case 'ICEBREAKER_USED':
      return MASCOT_STATES.ICEBREAKER_USED;
    case 'NO_MATCHES':
      return MASCOT_STATES.NO_MATCHES;
    default:
      return MASCOT_STATES.ONBOARDING;
  }
};
