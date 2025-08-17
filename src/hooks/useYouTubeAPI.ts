import { useState, useCallback } from 'react';
import { useEventLogger } from './useEventLogger';

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

  // Mock API calls - replace with actual YouTube API calls
  const fetchVideoDetails = useCallback(async (videoId: string): Promise<YouTubeVideo | null> => {
    setIsLoading(true);
    try {
      logAPICall('/youtube/videos', 'GET', 200, { videoId });
      
      // Mock data - replace with actual API call
      const mockVideo: YouTubeVideo = {
        id: videoId,
        title: "Sample YouTube Video",
        description: "This is a sample video description that demonstrates the YouTube companion dashboard functionality.",
        thumbnails: {
          default: { url: `https://img.youtube.com/vi/${videoId}/default.jpg` },
          medium: { url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` },
          high: { url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` },
          maxres: { url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` }
        },
        statistics: {
          viewCount: "1234567",
          likeCount: "89012",
          commentCount: "3456"
        },
        publishedAt: "2025-01-15T10:00:00Z"
      };
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      return mockVideo;
      
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
      
      // Mock data - replace with actual API call
      const mockComments: YouTubeComment[] = [
        {
          id: "comment1",
          snippet: {
            authorDisplayName: "John Doe",
            authorChannelId: "UCxxxxxxxxxxxxxxxxxxxxxxx",
            textDisplay: "Great video! Very helpful content.",
            likeCount: 12,
            publishedAt: "2025-01-15T12:00:00Z",
            updatedAt: "2025-01-15T12:00:00Z"
          }
        },
        {
          id: "comment2",
          snippet: {
            authorDisplayName: "Jane Smith",
            authorChannelId: "UCyyyyyyyyyyyyyyyyyyyyyyy",
            textDisplay: "Thanks for sharing this tutorial. Looking forward to more!",
            likeCount: 8,
            publishedAt: "2025-01-15T14:30:00Z",
            updatedAt: "2025-01-15T14:30:00Z"
          }
        }
      ];
      
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      return mockComments;
      
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
      
      // Mock API call - replace with actual YouTube API update
      await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate API delay
      
      return true;
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
      
      // Mock API call - replace with actual YouTube API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
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
      
      // Mock API call - replace with actual YouTube API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return true;
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