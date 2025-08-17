import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, MessageCircle, Edit3, Trash2, Search, Plus, Tag, RefreshCw, Send, Video as VideoIcon, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { useYouTubeAPI } from "@/hooks/useYouTubeAPI";
import { useEventLogger } from "@/hooks/useEventLogger";
import { useSupabaseData, type Video, type Note } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { VideoCard } from "@/components/VideoCard";
import { AddVideoDialog } from "@/components/AddVideoDialog";

interface Comment {
  id: string;
  author_name: string;
  text_display: string;
  like_count: number;
  published_at: string;
}

const Dashboard = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" });
  const [newComment, setNewComment] = useState("");
  const [editingVideo, setEditingVideo] = useState(false);
  const [videoEdit, setVideoEdit] = useState({ title: "", description: "" });
  
  const { 
    isLoading: ytLoading, 
    fetchVideoDetails, 
    fetchVideoComments, 
    updateVideoDetails,
    postComment 
  } = useYouTubeAPI();
  
  const { logUserAction } = useEventLogger();
  const { user, signOut } = useAuth();
  
  const {
    videos,
    notes,
    isLoading: dbLoading,
    fetchVideos,
    fetchNotes,
    addVideo,
    updateVideo,
    addNote,
    deleteNote
  } = useSupabaseData();

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      logUserAction('dashboard_visited');
      await fetchVideos();
    };
    
    initializeDashboard();
  }, [fetchVideos, logUserAction]);

  // Set first video as selected when videos load
  useEffect(() => {
    if (videos.length > 0 && !selectedVideo) {
      setSelectedVideo(videos[0]);
    }
  }, [videos, selectedVideo]);

  // Fetch notes and comments when selected video changes
  useEffect(() => {
    if (selectedVideo) {
      fetchNotes(selectedVideo.id);
      loadComments(selectedVideo.youtube_video_id);
      setVideoEdit({ 
        title: selectedVideo.title, 
        description: selectedVideo.description || "" 
      });
    }
  }, [selectedVideo, fetchNotes]);

  // Filter notes based on search query
  useEffect(() => {
    const filtered = notes.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredNotes(filtered);
  }, [notes, searchQuery]);

  const loadComments = async (youtubeVideoId: string) => {
    const commentsData = await fetchVideoComments(youtubeVideoId);
    const formattedComments = commentsData.map(comment => ({
      id: comment.id,
      author_name: comment.snippet.authorDisplayName,
      text_display: comment.snippet.textDisplay,
      like_count: comment.snippet.likeCount,
      published_at: comment.snippet.publishedAt
    }));
    setComments(formattedComments);
  };

  const handleAddVideo = async (youtubeVideoId: string) => {
    try {
      const videoData = await fetchVideoDetails(youtubeVideoId);
      if (!videoData) {
        throw new Error('Video not found');
      }

      const newVideo = await addVideo({
        youtube_video_id: videoData.id,
        title: videoData.title,
        description: videoData.description,
        thumbnail_url: videoData.thumbnails.maxres?.url || videoData.thumbnails.high.url,
        view_count: parseInt(videoData.statistics.viewCount),
        like_count: parseInt(videoData.statistics.likeCount),
        comment_count: parseInt(videoData.statistics.commentCount),
        published_at: videoData.publishedAt
      });

      setSelectedVideo(newVideo);
    } catch (error) {
      console.error('Error adding video:', error);
      throw error;
    }
  };

  const handleSaveVideo = async () => {
    if (selectedVideo) {
      logUserAction('video_edit_attempted', { videoId: selectedVideo.id });
      
      const success = await updateVideoDetails(
        selectedVideo.youtube_video_id, 
        videoEdit.title, 
        videoEdit.description
      );
      
      if (success) {
        const updatedVideo = await updateVideo(selectedVideo.id, {
          title: videoEdit.title,
          description: videoEdit.description
        });
        setSelectedVideo(updatedVideo);
        setEditingVideo(false);
        toast.success("Video details updated successfully!");
        logUserAction('video_edit_completed', { videoId: selectedVideo.id });
      } else {
        toast.error("Failed to update video details. Please try again.");
        logUserAction('video_edit_failed', { videoId: selectedVideo.id });
      }
    }
  };

  const handleAddNote = async () => {
    if (newNote.title.trim() && newNote.content.trim() && selectedVideo) {
      try {
        await addNote({
          video_id: selectedVideo.id,
          title: newNote.title,
          content: newNote.content,
          tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        });
        setNewNote({ title: "", content: "", tags: "" });
        toast.success("Note added successfully!");
      } catch (error) {
        toast.error("Failed to add note. Please try again.");
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      toast.success("Note deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete note. Please try again.");
    }
  };

  const handlePostComment = async () => {
    if (newComment.trim() && selectedVideo) {
      logUserAction('comment_post_attempted', { videoId: selectedVideo.id });
      
      const success = await postComment(selectedVideo.youtube_video_id, newComment);
      
      if (success) {
        const newCommentObj: Comment = {
          id: Date.now().toString(),
          author_name: "You",
          text_display: newComment,
          like_count: 0,
          published_at: new Date().toISOString()
        };
        setComments([newCommentObj, ...comments]);
        setNewComment("");
        toast.success("Comment posted successfully!");
        logUserAction('comment_posted', { videoId: selectedVideo.id });
      } else {
        toast.error("Failed to post comment. Please try again.");
        logUserAction('comment_post_failed', { videoId: selectedVideo.id });
      }
    }
  };

  const handleRefreshData = async () => {
    if (selectedVideo) {
      logUserAction('data_refresh_requested', { videoId: selectedVideo.id });
      const videoData = await fetchVideoDetails(selectedVideo.youtube_video_id);
      if (videoData) {
        await updateVideo(selectedVideo.id, {
          view_count: parseInt(videoData.statistics.viewCount),
          like_count: parseInt(videoData.statistics.likeCount),
          comment_count: parseInt(videoData.statistics.commentCount)
        });
        toast.success("Data refreshed successfully!");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Successfully signed out!");
    } catch (error) {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  if (dbLoading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              YouTube Companion Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your video content, engage with your audience, and track your insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            <div className="flex gap-2">
              <AddVideoDialog onAddVideo={handleAddVideo} isLoading={ytLoading} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                disabled={ytLoading || !selectedVideo}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${ytLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        {videos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <VideoIcon className="h-5 w-5" />
                Your Videos
              </CardTitle>
              <CardDescription>Select a video to manage its content and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onSelect={setSelectedVideo}
                    isSelected={selectedVideo?.id === video.id}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No videos state */}
        {videos.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <VideoIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first YouTube video to start managing your content
              </p>
              <AddVideoDialog onAddVideo={handleAddVideo} isLoading={ytLoading} />
            </CardContent>
          </Card>
        )}

        {/* Selected Video Details */}
        {selectedVideo && (
          <>
            {/* Video Information Card */}
            <Card className="overflow-hidden shadow-lg">
              <CardHeader className="bg-gradient-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Play className="h-6 w-6 text-primary" />
                    <CardTitle>Video Overview</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingVideo(!editingVideo)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <img 
                      src={selectedVideo.thumbnail_url}
                      alt={selectedVideo.title}
                      className="w-full rounded-lg shadow-md"
                    />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">{selectedVideo.view_count.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Views</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{selectedVideo.like_count.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Likes</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{selectedVideo.comment_count.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Comments</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {editingVideo ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Title</label>
                          <Input
                            value={videoEdit.title}
                            onChange={(e) => setVideoEdit({ ...videoEdit, title: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea
                            value={videoEdit.description}
                            onChange={(e) => setVideoEdit({ ...videoEdit, description: e.target.value })}
                            className="mt-1"
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveVideo} className="flex-1" disabled={ytLoading}>
                            {ytLoading ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingVideo(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{selectedVideo.title}</h3>
                          <p className="text-muted-foreground mt-2 leading-relaxed">{selectedVideo.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for different sections */}
            <Tabs defaultValue="notes" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="notes">Notes & Ideas</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="space-y-4">
                {/* Notes Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Edit3 className="h-5 w-5" />
                          Video Notes
                        </CardTitle>
                        <CardDescription>Jot down ideas and improvements for this video</CardDescription>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Note
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Note</DialogTitle>
                            <DialogDescription>Create a new note with tags for easy searching</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Note title"
                              value={newNote.title}
                              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                            />
                            <Textarea
                              placeholder="Note content"
                              value={newNote.content}
                              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                              rows={4}
                            />
                            <Input
                              placeholder="Tags (comma separated)"
                              value={newNote.tags}
                              onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                            />
                            <Button onClick={handleAddNote} className="w-full">Add Note</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search notes and tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="grid gap-4">
                      {filteredNotes.map((note) => (
                        <Card key={note.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold">{note.title}</h4>
                                <p className="text-muted-foreground mt-1">{note.content}</p>
                                <div className="flex items-center gap-2 mt-3">
                                  <Tag className="h-3 w-3 text-muted-foreground" />
                                  {note.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {filteredNotes.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          {searchQuery ? "No notes found matching your search." : "No notes yet. Add your first note to get started!"}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          Recent Comments
                        </CardTitle>
                        <CardDescription>Manage and respond to your video comments</CardDescription>
                      </div>
                      <Badge variant="secondary">{comments.length} comments</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1"
                        rows={3}
                      />
                      <Button 
                        onClick={handlePostComment}
                        disabled={!newComment.trim() || ytLoading}
                        className="self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <Card key={comment.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium text-sm">{comment.author_name}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.published_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.text_display}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {comment.like_count} likes
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {comments.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No comments yet. Be the first to comment!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;