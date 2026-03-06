// Re-export all hooks
export { useAdminShortcut } from './useAdminShortcut';
export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useMediaQuery } from './useMediaQuery';
export { useClickOutside } from './useClickOutside';
export { useOnlineStatus } from './useOnlineStatus';
export { useCountdown } from './useCountdown';
export { useToast } from './use-toast';
export { useIsMobile } from './use-mobile';

// Auth hooks
export { AuthProvider, useAuth, useRequireAuth, useAdmin } from './useAuth';

// Event hooks
export { useEvents, useEvent } from './useEvents';

// Participant hooks  
export { useParticipants, useRandomParticipant } from './useParticipants';

// Prize hooks
export { usePrizes, useWinners } from './usePrizes';

// Analytics hooks
export { useEventAnalytics, useAdminAnalytics } from './useAnalytics';
