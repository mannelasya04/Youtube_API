import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Eye, ThumbsUp, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { type Video } from "@/hooks/useSupabaseData";

interface VideoCardProps {
  video: Video;
  onSelect: (video: Video) => void;
  isSelected?: boolean;
}

export const VideoCard = ({ video, onSelect, isSelected }: VideoCardProps) => {
  const handleWatch = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={() => onSelect(video)}
    >
      <CardContent className="p-4">
        <div className="relative">
          <img 
            src={video.thumbnail_url} 
            alt={video.title}
            className="w-full aspect-video object-cover rounded-lg"
          />
          
          {/* Watch Video Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="absolute inset-0 w-full h-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg"
                onClick={handleWatch}
              >
                <Play className="h-8 w-8 text-white" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full">
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mt-3">
          <h3 className="font-semibold text-sm line-clamp-2 mb-2">
            {video.title}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{video.view_count.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                <span>{video.like_count.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{video.comment_count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};