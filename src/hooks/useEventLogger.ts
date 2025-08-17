import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EventData {
  event_type: string;
  event_data?: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
}

export const useEventLogger = () => {
  const logEvent = useCallback(async (eventData: EventData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const enrichedEvent = {
        user_id: user?.id || null,
        event_type: eventData.event_type,
        event_data: eventData.event_data || {},
        user_agent: navigator.userAgent,
      };
      
      console.log('Event logged:', enrichedEvent);
      
      // Insert into Supabase
      const { error } = await supabase
        .from('event_logs')
        .insert(enrichedEvent);
      
      if (error) {
        console.error('Failed to insert event to database:', error);
        // Fallback to localStorage
        const existingEvents = JSON.parse(localStorage.getItem('event_logs') || '[]');
        existingEvents.push(enrichedEvent);
        localStorage.setItem('event_logs', JSON.stringify(existingEvents));
      }
      
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