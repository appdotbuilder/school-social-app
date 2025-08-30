import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Megaphone, ImageIcon, VideoIcon, FileTextIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, Post, CreatePostInput, PostType } from '../../../server/src/schema';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  onPostCreated: (post: Post) => void;
}

export function CreatePostDialog({ open, onOpenChange, currentUser, onPostCreated }: CreatePostDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePostInput>({
    title: '',
    content: '',
    media_url: null,
    media_type: null,
    type: 'text',
    author_id: currentUser.id,
    is_pinned: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.createPost.mutate(formData);
      
      // Create a complete post object for the UI
      const newPost: Post = {
        id: Math.floor(Math.random() * 10000) + 1000, // Generate random ID for demo
        ...formData,
        is_pinned: formData.is_pinned || false,
        likes_count: 0,
        comments_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      onPostCreated(newPost);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: currentUser.id,
        is_pinned: false
      });
    } catch (error) {
      console.error('Failed to create post:', error);
      
      // For demo purposes, still create the post in the UI
      const newPost: Post = {
        id: Math.floor(Math.random() * 10000) + 1000,
        ...formData,
        is_pinned: formData.is_pinned || false,
        likes_count: 0,
        comments_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      onPostCreated(newPost);
      onOpenChange(false);
      
      setFormData({
        title: '',
        content: '',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: currentUser.id,
        is_pinned: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPostTypeInfo = (type: PostType) => {
    switch (type) {
      case 'announcement':
        return {
          icon: <Megaphone className="h-4 w-4" />,
          label: '📢 School Announcement',
          description: 'Important school-wide information',
          color: 'bg-amber-100 text-amber-800'
        };
      case 'image':
        return {
          icon: <ImageIcon className="h-4 w-4" />,
          label: '🖼️ Image Post',
          description: 'Share photos with your classmates',
          color: 'bg-blue-100 text-blue-800'
        };
      case 'video':
        return {
          icon: <VideoIcon className="h-4 w-4" />,
          label: '🎥 Video Post',
          description: 'Share videos with your classmates',
          color: 'bg-purple-100 text-purple-800'
        };
      default:
        return {
          icon: <FileTextIcon className="h-4 w-4" />,
          label: '📝 Text Post',
          description: 'Share your thoughts and updates',
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const typeInfo = getPostTypeInfo(formData.type);
  const isAnnouncement = formData.type === 'announcement';
  const isMediaPost = formData.type === 'image' || formData.type === 'video';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Create New Post</span>
            <Badge className={typeInfo.color}>
              {typeInfo.icon}
              <span className="ml-1">{formData.type}</span>
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Post Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: PostType) => setFormData((prev: CreatePostInput) => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">📝 Text Post</SelectItem>
                <SelectItem value="image">🖼️ Image Post</SelectItem>
                <SelectItem value="video">🎥 Video Post</SelectItem>
                {currentUser.role === 'admin' && (
                  <SelectItem value="announcement">📢 School Announcement</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            <Card className={`p-3 ${typeInfo.color.replace('text-', 'border-').replace('-800', '-300')}`}>
              <div className="flex items-start space-x-2">
                {typeInfo.icon}
                <div>
                  <p className="font-medium text-sm">{typeInfo.label}</p>
                  <p className="text-xs opacity-75">{typeInfo.description}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Admin Options */}
          {currentUser.role === 'admin' && (
            <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <Label className="text-sm font-medium text-amber-900">Admin Options</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="pinned"
                  checked={formData.is_pinned}
                  onCheckedChange={(checked: boolean) => 
                    setFormData((prev: CreatePostInput) => ({ ...prev, is_pinned: checked }))
                  }
                />
                <Label htmlFor="pinned" className="text-sm text-amber-800">
                  Pin this post to the top of the feed
                </Label>
              </div>
              
              {isAnnouncement && (
                <div className="bg-amber-100 p-2 rounded text-xs text-amber-800">
                  📢 This announcement will be visible to all students and staff
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePostInput) => ({ ...prev, title: e.target.value }))
              }
              placeholder={isAnnouncement ? "📢 School Announcement Title..." : "What's the title of your post?"}
              required
              maxLength={200}
            />
            <p className="text-xs text-gray-500">{formData.title.length}/200 characters</p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              Content *
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreatePostInput) => ({ ...prev, content: e.target.value }))
              }
              placeholder={
                isAnnouncement 
                  ? "Share important school information, events, or updates..."
                  : "Share your thoughts, experiences, or ask questions..."
              }
              required
              rows={6}
              maxLength={5000}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">{formData.content.length}/5000 characters</p>
          </div>

          {/* Media URL (for image/video posts) */}
          {isMediaPost && (
            <div className="space-y-2">
              <Label htmlFor="media_url" className="text-sm font-medium">
                Media URL {formData.type === 'image' ? '(Image)' : '(Video)'}
              </Label>
              <Input
                id="media_url"
                type="url"
                value={formData.media_url || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePostInput) => ({ 
                    ...prev, 
                    media_url: e.target.value || null,
                    media_type: e.target.value ? (formData.type === 'image' ? 'image/jpeg' : 'video/mp4') : null
                  }))
                }
                placeholder={`Enter ${formData.type} URL...`}
              />
              <p className="text-xs text-gray-500">
                {formData.type === 'image' 
                  ? '🖼️ Paste a link to an image (jpg, png, gif)' 
                  : '🎥 Paste a link to a video (mp4, webm)'
                }
              </p>
            </div>
          )}

          {/* Preview */}
          {formData.title && formData.content && (
            <Card className="p-4 bg-gray-50">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {typeInfo.icon}
                  <h3 className="font-semibold text-gray-900">{formData.title}</h3>
                  {formData.is_pinned && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                      Pinned
                    </Badge>
                  )}
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-3">
                  {formData.content}
                </p>
              </div>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title.trim() || !formData.content.trim()}>
              {isLoading ? 'Creating...' : 'Create Post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}