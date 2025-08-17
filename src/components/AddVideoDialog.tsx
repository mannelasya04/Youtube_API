import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddVideoDialogProps {
  onAddVideo: (videoId: string) => Promise<void>;
  isLoading?: boolean;
}

export const AddVideoDialog = ({ onAddVideo, isLoading }: AddVideoDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const handleAddVideo = async () => {
    if (!videoUrl.trim()) {
      toast.error("Please enter a YouTube video URL or ID");
      return;
    }

    const videoId = extractVideoId(videoUrl.trim());
    if (!videoId) {
      toast.error("Invalid YouTube URL format. Please enter a valid YouTube video URL or ID.");
      return;
    }

    try {
      await onAddVideo(videoId);
      setVideoUrl("");
      setIsOpen(false);
      toast.success("Video added successfully!");
    } catch (error) {
      toast.error("Failed to add video. Please check the URL and try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Video
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add YouTube Video</DialogTitle>
          <DialogDescription>
            Enter a YouTube video URL or video ID to add it to your dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              placeholder="https://www.youtube.com/watch?v=... or video ID"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Examples: youtube.com/watch?v=dQw4w9WgXcQ or just dQw4w9WgXcQ
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleAddVideo} 
              className="flex-1" 
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Video"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};