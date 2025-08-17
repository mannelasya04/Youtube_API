import { useCallback } from 'react';

export interface EventData {
  event_type: string;
  event_data?: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
}

export const useEventLogger = () => {
  const logEvent = useCallback(async (eventData: EventData) => {
    try {
      // In a real implementation, this would send to Supabase
      const enrichedEvent = {
        ...eventData,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };
      
      // For now, just log to console
      console.log('Event logged:', enrichedEvent);
      
      // Store in localStorage as a temporary solution
      const existingEvents = JSON.parse(localStorage.getItem('event_logs') || '[]');
      existingEvents.push(enrichedEvent);
      localStorage.setItem('event_logs', JSON.stringify(existingEvents));
      
      // In production, this would be:
      // await supabase.from('event_logs').insert(enrichedEvent);
      
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }, []);

  const logUserAction = useCallback((action: string, data?: Record<string, any>) => {
    logEvent({
      event_type: `user_${action}`,
      event_data: data,
    });
  }, [logEvent]);

  const logAPICall = useCallback((endpoint: string, method: string, status: number, data?: Record<string, any>) => {
    logEvent({
      event_type: 'api_call',
      event_data: {
        endpoint,
        method,
        status,
        ...data,
      },
    });
  }, [logEvent]);

  const logError = useCallback((error: string, context?: Record<string, any>) => {
    logEvent({
      event_type: 'error',
      event_data: {
        error,
        context,
      },
    });
  }, [logEvent]);

  return {
    logEvent,
    logUserAction,
    logAPICall,
    logError,
  };
};