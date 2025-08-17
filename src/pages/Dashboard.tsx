import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, MessageCircle, Edit3, Trash2, Search, Plus, Tag, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { useYouTubeAPI } from "@/hooks/useYouTubeAPI";
import { useEventLogger } from "@/hooks/useEventLogger";

interface Video {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
}

interface Comment {
  id: string;
  author_name: string;
  text_display: string;
  like_count: number;
  published_at: string;
}

const Dashboard = () => {
  const [video, setVideo] = useState<Video | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
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

  // Initialize with sample video
  useEffect(() => {
    const initializeDashboard = async () => {
      logUserAction('dashboard_visited');
      
      // Mock video ID - in real app, this would come from user's videos
      const sampleVideoId = "dQw4w9WgXcQ";
      
      const videoData = await fetchVideoDetails(sampleVideoId);
      if (videoData) {
        const videoInfo: Video = {
          id: "1",
          youtube_video_id: videoData.id,
          title: videoData.title,
          description: videoData.description,
          thumbnail_url: videoData.thumbnails.maxres.url,
          view_count: parseInt(videoData.statistics.viewCount),
          like_count: parseInt(videoData.statistics.likeCount),
          comment_count: parseInt(videoData.statistics.commentCount)
        };
        
        setVideo(videoInfo);
        setVideoEdit({ title: videoInfo.title, description: videoInfo.description });
        
        // Fetch comments
        const commentsData = await fetchVideoComments(sampleVideoId);
        const formattedComments = commentsData.map(comment => ({
          id: comment.id,
          author_name: comment.snippet.authorDisplayName,
          text_display: comment.snippet.textDisplay,
          like_count: comment.snippet.likeCount,
          published_at: comment.snippet.publishedAt
        }));
        setComments(formattedComments);
      }
      
      // Load sample notes
      const mockNotes: Note[] = [
        {
          id: "1",
          title: "Improvement Ideas",
          content: "Consider adding better lighting setup and improving audio quality for next recording.",
          tags: ["improvement", "technical", "audio"],
          created_at: "2025-01-15T10:00:00Z"
        },
        {
          id: "2", 
          title: "Audience Feedback",
          content: "Viewers requested more detailed examples in the tutorial section.",
          tags: ["feedback", "content", "tutorial"],
          created_at: "2025-01-14T15:30:00Z"
        }
      ];
      
      setNotes(mockNotes);
    };
    
    initializeDashboard();
  }, [fetchVideoDetails, fetchVideoComments, logUserAction]);

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveVideo = async () => {
    if (video) {
      logUserAction('video_edit_attempted', { videoId: video.id });
      
      const success = await updateVideoDetails(
        video.youtube_video_id, 
        videoEdit.title, 
        videoEdit.description
      );
      
      if (success) {
        setVideo({ ...video, title: videoEdit.title, description: videoEdit.description });
        setEditingVideo(false);
        toast.success("Video details updated successfully!");
        logUserAction('video_edit_completed', { videoId: video.id });
      } else {
        toast.error("Failed to update video details. Please try again.");
        logUserAction('video_edit_failed', { videoId: video.id });
      }
    }
  };

  const handleAddNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        created_at: new Date().toISOString()
      };
      setNotes([note, ...notes]);
      setNewNote({ title: "", content: "", tags: "" });
      toast.success("Note added successfully!");
      logUserAction('note_created', { noteId: note.id, tags: note.tags });
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
    toast.success("Note deleted successfully!");
    logUserAction('note_deleted', { noteId });
  };

  const handlePostComment = async () => {
    if (newComment.trim() && video) {
      logUserAction('comment_post_attempted', { videoId: video.id });
      
      const success = await postComment(video.youtube_video_id, newComment);
      
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
        logUserAction('comment_posted', { videoId: video.id });
      } else {
        toast.error("Failed to post comment. Please try again.");
        logUserAction('comment_post_failed', { videoId: video.id });
      }
    }
  };

  const handleRefreshData = async () => {
    if (video) {
      logUserAction('data_refresh_requested', { videoId: video.id });
      const videoData = await fetchVideoDetails(video.youtube_video_id);
      if (videoData) {
        setVideo(prev => prev ? {
          ...prev,
          view_count: parseInt(videoData.statistics.viewCount),
          like_count: parseInt(videoData.statistics.likeCount),
          comment_count: parseInt(videoData.statistics.commentCount)
        } : null);
        toast.success("Data refreshed successfully!");
      }
    }
  };

  if (!video) {
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={ytLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${ytLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

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
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full rounded-lg shadow-md"
                />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{video.view_count.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Views</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{video.like_count.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Likes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{video.comment_count.toLocaleString()}</p>
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
                      <h3 className="font-semibold text-lg">{video.title}</h3>
                      <p className="text-muted-foreground mt-2 leading-relaxed">{video.description}</p>
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
                    <CardDescription>Jot down ideas and improvements for your video</CardDescription>
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
                {/* Add Comment Form */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Write a comment on your video..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={handlePostComment}
                          disabled={!newComment.trim() || ytLoading}
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {ytLoading ? "Posting..." : "Post Comment"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Comments List */}
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{comment.author_name}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(comment.published_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{comment.text_display}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-sm text-muted-foreground">
                              {comment.like_count} likes
                            </span>
                            <Button variant="ghost" size="sm">Reply</Button>
                            {comment.author_name === "You" && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;