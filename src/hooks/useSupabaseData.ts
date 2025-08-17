import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEventLogger } from './useEventLogger';

export interface Video {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export interface Note {
  id: string;
  video_id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
}

export const useSupabaseData = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { logUserAction, logError } = useEventLogger();

  // Fetch user's videos
  const fetchVideos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      logError('Failed to fetch videos', { error });
      console.error('Error fetching videos:', error);
    }
  }, [logError]);

  // Fetch notes for a specific video
  const fetchNotes = useCallback(async (videoId?: string) => {
    try {
      let query = supabase.from('notes').select('*');
      
      if (videoId) {
        query = query.eq('video_id', videoId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      logError('Failed to fetch notes', { error });
      console.error('Error fetching notes:', error);
    }
  }, [logError]);

  // Add a new video
  const addVideo = useCallback(async (videoData: {
    youtube_video_id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    published_at?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('videos')
        .insert({
          ...videoData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setVideos(prev => [data, ...prev]);
      logUserAction('video_added', { videoId: data.id, youtubeVideoId: videoData.youtube_video_id });
      
      return data;
    } catch (error) {
      logError('Failed to add video', { error });
      throw error;
    }
  }, [logUserAction, logError]);

  // Update a video
  const updateVideo = useCallback(async (videoId: string, updates: Partial<Video>) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .update(updates)
        .eq('id', videoId)
        .select()
        .single();

      if (error) throw error;

      setVideos(prev => prev.map(video => 
        video.id === videoId ? { ...video, ...data } : video
      ));
      
      logUserAction('video_updated', { videoId });
      return data;
    } catch (error) {
      logError('Failed to update video', { videoId, error });
      throw error;
    }
  }, [logUserAction, logError]);

  // Add a new note
  const addNote = useCallback(async (noteData: {
    video_id: string;
    title: string;
    content: string;
    tags: string[];
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notes')
        .insert({
          ...noteData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      logUserAction('note_created', { noteId: data.id, videoId: noteData.video_id });
      
      return data;
    } catch (error) {
      logError('Failed to add note', { error });
      throw error;
    }
  }, [logUserAction, logError]);

  // Delete a note
  const deleteNote = useCallback(async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));
      logUserAction('note_deleted', { noteId });
    } catch (error) {
      logError('Failed to delete note', { noteId, error });
      throw error;
    }
  }, [logUserAction, logError]);

  return {
    videos,
    notes,
    isLoading,
    fetchVideos,
    fetchNotes,
    addVideo,
    updateVideo,
    addNote,
    deleteNote
  };
};