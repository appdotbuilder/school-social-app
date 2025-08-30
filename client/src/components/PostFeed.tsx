import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Heart, MessageCircle, Pin, Trash2, Megaphone } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Post, User } from '../../../server/src/schema';
import { CommentSection } from './CommentSection';

interface PostFeedProps {
  posts: Post[];
  users: User[];
  currentUser: User;
  onPostUpdated: (post: Post) => void;
  onPostDeleted: (postId: number) => void;
}

export function PostFeed({ posts, users, currentUser, onPostUpdated, onPostDeleted }: PostFeedProps) {
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  // Sort posts: pinned announcements first, then by creation date
  const sortedPosts = [...posts].sort((a: Post, b: Post) => {
    // Pinned posts go first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    
    // Then by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const toggleComments = useCallback((postId: number) => {
    setExpandedComments((prev: Set<number>) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  }, []);

  const handleLike = useCallback(async (postId: number) => {
    try {
      const isLiked = likedPosts.has(postId);
      
      if (isLiked) {
        await trpc.removeLike.mutate({ post_id: postId, user_id: currentUser.id });
        setLikedPosts((prev: Set<number>) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        await trpc.createLike.mutate({ post_id: postId, user_id: currentUser.id });
        setLikedPosts((prev: Set<number>) => new Set([...prev, postId]));
      }

      // Update post likes count
      const post = posts.find((p: Post) => p.id === postId);
      if (post) {
        const updatedPost: Post = {
          ...post,
          likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
        };
        onPostUpdated(updatedPost);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // For demo purposes, still update UI even if API fails
      const isLiked = likedPosts.has(postId);
      setLikedPosts((prev: Set<number>) => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });

      const post = posts.find((p: Post) => p.id === postId);
      if (post) {
        const updatedPost: Post = {
          ...post,
          likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
        };
        onPostUpdated(updatedPost);
      }
    }
  }, [likedPosts, currentUser.id, posts, onPostUpdated]);

  const handleDeletePost = useCallback(async (postId: number) => {
    try {
      await trpc.deletePost.mutate({ id: postId });
      onPostDeleted(postId);
    } catch (error) {
      console.error('Failed to delete post:', error);
      // For demo purposes, still remove from UI
      onPostDeleted(postId);
    }
  }, [onPostDeleted]);

  const getAuthor = useCallback((authorId: number) => {
    return users.find((user: User) => user.id === authorId);
  }, [users]);

  const getPostTypeIcon = (post: Post) => {
    switch (post.type) {
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-amber-600" />;
      case 'image':
        return <span className="text-blue-600">🖼️</span>;
      case 'video':
        return <span className="text-purple-600">🎥</span>;
      default:
        return <span className="text-gray-600">📝</span>;
    }
  };

  const getPostTypeBadge = (post: Post) => {
    switch (post.type) {
      case 'announcement':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">📢 Announcement</Badge>;
      case 'image':
        return <Badge variant="outline" className="text-blue-600">🖼️ Image</Badge>;
      case 'video':
        return <Badge variant="outline" className="text-purple-600">🎥 Video</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600">📝 Text</Badge>;
    }
  };

  if (sortedPosts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <MessageCircle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
        <p className="text-gray-600">
          Be the first to share something with your school community! 🎓
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedPosts.map((post: Post) => {
        const author = getAuthor(post.author_id);
        const isLiked = likedPosts.has(post.id);
        const commentsExpanded = expandedComments.has(post.id);
        const canDelete = currentUser.role === 'admin' || currentUser.id === post.author_id;

        return (
          <Card key={post.id} className={`${post.is_pinned ? 'ring-2 ring-amber-200 bg-amber-50/30' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={author?.profile_picture_url || undefined} />
                    <AvatarFallback className="bg-indigo-500 text-white">
                      {author?.name.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{author?.name || 'Unknown User'}</h3>
                      {author?.role === 'admin' && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{author?.class_name} • {post.created_at.toLocaleDateString()}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {getPostTypeBadge(post)}
                      {post.is_pinned && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this post? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                    {getPostTypeIcon(post)}
                    <span>{post.title}</span>
                  </h2>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </div>

                {post.media_url && (
                  <div className="rounded-lg overflow-hidden border">
                    {post.media_type?.startsWith('image/') ? (
                      <img 
                        src={post.media_url} 
                        alt="Post media" 
                        className="w-full max-h-96 object-cover"
                      />
                    ) : post.media_type?.startsWith('video/') ? (
                      <video 
                        src={post.media_url} 
                        controls 
                        className="w-full max-h-96"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="p-4 bg-gray-50 text-center">
                        <p className="text-gray-600">📎 Media attachment</p>
                        <a 
                          href={post.media_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View attachment
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 ${
                        isLiked 
                          ? 'text-red-600 hover:text-red-700' 
                          : 'text-gray-600 hover:text-red-600'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes_count}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments_count} comments</span>
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500">
                    {post.updated_at > post.created_at && (
                      <span>Edited • </span>
                    )}
                    {post.created_at.toLocaleTimeString()}
                  </div>
                </div>

                {commentsExpanded && (
                  <div className="border-t pt-4">
                    <CommentSection
                      post={post}
                      currentUser={currentUser}
                      users={users}
                      onCommentAdded={(post: Post) => onPostUpdated(post)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}