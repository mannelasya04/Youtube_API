import { useState, useCallback } from 'react';
import { useEventLogger } from './useEventLogger';
import { supabase } from '@/integrations/supabase/client';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
    maxres: { url: string };
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  publishedAt: string;
}

export interface YouTubeComment {
  id: string;
  snippet: {
    authorDisplayName: string;
    authorChannelId: string;
    textDisplay: string;
    likeCount: number;
    publishedAt: string;
    updatedAt: string;
    parentId?: string;
  };
}

export const useYouTubeAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { logAPICall, logError } = useEventLogger();

  const fetchVideoDetails = useCallback(async (videoId: string): Promise<YouTubeVideo | null> => {
    setIsLoading(true);
    try {
      logAPICall('/youtube/videos', 'GET', 200, { videoId });
      
      const { data, error } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'fetchVideoDetails', videoId }
      });

      if (error) {
        throw error;
      }

      return data;
      
    } catch (error) {
      logError('Failed to fetch video details', { videoId, error });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [logAPICall, logError]);

  const fetchVideoComments = useCallback(async (videoId: string): Promise<YouTubeComment[]> => {
    setIsLoading(true);
    try {
      logAPICall('/youtube/commentThreads', 'GET', 200, { videoId });
      
      const { data, error } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'fetchVideoComments', videoId }
      });

      if (error) {
        throw error;
      }

      return data || [];
      
    } catch (error) {
      logError('Failed to fetch video comments', { videoId, error });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [logAPICall, logError]);

  const updateVideoDetails = useCallback(async (videoId: string, title: string, description: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      logAPICall('/youtube/videos', 'PUT', 200, { videoId, title, description });
      
      const { data, error } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'updateVideoDetails', videoId, title, description }
      });

      if (error) {
        throw error;
      }

      return data?.success || false;
    } catch (error) {
      logError('Failed to update video details', { videoId, error });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [logAPICall, logError]);

  const postComment = useCallback(async (videoId: string, text: string, parentCommentId?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      logAPICall('/youtube/commentThreads', 'POST', 201, { videoId, text, parentCommentId });
      
      const { data, error } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'postComment', videoId, commentText: text, parentCommentId }
      });

      if (error) {
        throw error;
      }

      return data?.success || false;
    } catch (error) {
      logError('Failed to post comment', { videoId, text, error });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [logAPICall, logError]);

  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      logAPICall('/youtube/comments', 'DELETE', 200, { commentId });
      
      const { data, error } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'deleteComment', videoId: commentId }
      });

      if (error) {
        throw error;
      }

      return data?.success || false;
    } catch (error) {
      logError('Failed to delete comment', { commentId, error });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [logAPICall, logError]);

  return {
    isLoading,
    fetchVideoDetails,
    fetchVideoComments,
    updateVideoDetails,
    postComment,
    deleteComment,
  };
};