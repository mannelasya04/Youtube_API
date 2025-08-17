import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    // Get the auth header from the request
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      supabase.auth.setAuth(authHeader.replace('Bearer ', ''));
    }

    const { action, videoId, title, description, commentText, parentCommentId } = await req.json();

    let response;

    switch (action) {
      case 'fetchVideoDetails':
        response = await fetchVideoDetails(videoId, YOUTUBE_API_KEY);
        break;
      case 'fetchVideoComments':
        response = await fetchVideoComments(videoId, YOUTUBE_API_KEY);
        break;
      case 'updateVideoDetails':
        response = await updateVideoDetails(videoId, title, description, YOUTUBE_API_KEY);
        break;
      case 'postComment':
        response = await postComment(videoId, commentText, YOUTUBE_API_KEY, parentCommentId);
        break;
      case 'deleteComment':
        response = await deleteComment(videoId, YOUTUBE_API_KEY);
        break;
      default:
        throw new Error('Invalid action');
    }

    console.log(`YouTube API ${action} completed for video ${videoId}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('YouTube API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchVideoDetails(videoId: string, apiKey: string) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`YouTube API error: ${data.error?.message || 'Unknown error'}`);
  }

  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }

  const video = data.items[0];
  return {
    id: video.id,
    title: video.snippet.title,
    description: video.snippet.description,
    thumbnails: video.snippet.thumbnails,
    statistics: video.statistics,
    publishedAt: video.snippet.publishedAt
  };
}

async function fetchVideoComments(videoId: string, apiKey: string) {
  const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${apiKey}&maxResults=100`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`YouTube API error: ${data.error?.message || 'Unknown error'}`);
  }

  return data.items || [];
}

async function updateVideoDetails(videoId: string, title: string, description: string, apiKey: string) {
  // Note: This requires OAuth 2.0 authentication, not just API key
  // For demo purposes, we'll simulate success
  console.log(`Updating video ${videoId} with title: ${title}`);
  
  // In a real implementation, you would need to:
  // 1. Store OAuth tokens for the user
  // 2. Use the YouTube Data API v3 videos.update endpoint
  // 3. Handle token refresh
  
  return { success: true, message: 'Video updated (demo mode)' };
}

async function postComment(videoId: string, text: string, apiKey: string, parentCommentId?: string) {
  // Note: This requires OAuth 2.0 authentication, not just API key
  // For demo purposes, we'll simulate success
  console.log(`Posting comment on video ${videoId}: ${text}`);
  
  return { success: true, message: 'Comment posted (demo mode)' };
}

async function deleteComment(commentId: string, apiKey: string) {
  // Note: This requires OAuth 2.0 authentication, not just API key
  // For demo purposes, we'll simulate success
  console.log(`Deleting comment ${commentId}`);
  
  return { success: true, message: 'Comment deleted (demo mode)' };
}