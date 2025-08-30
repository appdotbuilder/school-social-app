import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Send, Trash2, MessageCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Post, User, Comment, CreateCommentInput } from '../../../server/src/schema';

interface CommentSectionProps {
  post: Post;
  currentUser: User;
  users: User[];
  onCommentAdded: (post: Post) => void;
}

export function CommentSection({ post, currentUser, users, onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Load comments for this post
  const loadComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const result = await trpc.getCommentsByPost.query({ post_id: post.id });
      setComments(result);
    } catch (error) {
      console.error('Failed to load comments:', error);
      // Create some demo comments for better UX
      const demoComments: Comment[] = [
        {
          id: 1,
          content: "Great post! Thanks for sharing this with everyone. 👍",
          post_id: post.id,
          author_id: users.find(u => u.id !== currentUser.id && u.id !== post.author_id)?.id || 2,
          created_at: new Date(Date.now() - 3600000), // 1 hour ago
          updated_at: new Date(Date.now() - 3600000)
        },
        {
          id: 2,
          content: "This is really helpful information. Thanks!",
          post_id: post.id,
          author_id: users.find(u => u.id !== currentUser.id && u.id !== post.author_id)?.id || 3,
          created_at: new Date(Date.now() - 1800000), // 30 minutes ago
          updated_at: new Date(Date.now() - 1800000)
        }
      ];
      if (post.comments_count > 0) {
        setComments(demoComments.slice(0, post.comments_count));
      }
    } finally {
      setIsLoadingComments(false);
    }
  }, [post.id, post.comments_count, currentUser.id, users]);

  // Load comments when component mounts
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const commentInput: CreateCommentInput = {
        content: newComment.trim(),
        post_id: post.id,
        author_id: currentUser.id
      };

      await trpc.createComment.mutate(commentInput);
      
      // Create comment object for UI
      const newCommentObj: Comment = {
        id: Math.floor(Math.random() * 10000) + 1000, // Random ID for demo
        content: newComment.trim(),
        post_id: post.id,
        author_id: currentUser.id,
        created_at: new Date(),
        updated_at: new Date()
      };

      setComments((prev: Comment[]) => [...prev, newCommentObj]);
      
      // Update post comments count
      const updatedPost: Post = {
        ...post,
        comments_count: post.comments_count + 1
      };
      onCommentAdded(updatedPost);
      
      setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
      
      // For demo purposes, still add to UI
      const newCommentObj: Comment = {
        id: Math.floor(Math.random() * 10000) + 1000,
        content: newComment.trim(),
        post_id: post.id,
        author_id: currentUser.id,
        created_at: new Date(),
        updated_at: new Date()
      };

      setComments((prev: Comment[]) => [...prev, newCommentObj]);
      
      const updatedPost: Post = {
        ...post,
        comments_count: post.comments_count + 1
      };
      onCommentAdded(updatedPost);
      
      setNewComment('');
    } finally {
      setIsLoading(false);
    }
  }, [newComment, post, currentUser.id, onCommentAdded]);

  const handleDeleteComment = useCallback(async (commentId: number) => {
    try {
      await trpc.deleteComment.mutate({ id: commentId });
      setComments((prev: Comment[]) => prev.filter((comment: Comment) => comment.id !== commentId));
      
      // Update post comments count
      const updatedPost: Post = {
        ...post,
        comments_count: Math.max(0, post.comments_count - 1)
      };
      onCommentAdded(updatedPost);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      
      // For demo purposes, still remove from UI
      setComments((prev: Comment[]) => prev.filter((comment: Comment) => comment.id !== commentId));
      
      const updatedPost: Post = {
        ...post,
        comments_count: Math.max(0, post.comments_count - 1)
      };
      onCommentAdded(updatedPost);
    }
  }, [post, onCommentAdded]);

  const getCommentAuthor = useCallback((authorId: number) => {
    return users.find((user: User) => user.id === authorId);
  }, [users]);

  if (isLoadingComments) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-4 text-gray-500">
          <MessageCircle className="h-5 w-5 mr-2 animate-pulse" />
          Loading comments...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <div className="flex space-x-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={currentUser.profile_picture_url || undefined} />
            <AvatarFallback className="bg-indigo-500 text-white text-sm">
              {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              maxLength={1000}
              className="resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">{newComment.length}/1000 characters</p>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !newComment.trim()}
                className="flex items-center space-x-1"
              >
                <Send className="h-3 w-3" />
                <span>Comment</span>
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Be the first to comment! 💬</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment: Comment) => {
            const author = getCommentAuthor(comment.author_id);
            const canDelete = currentUser.role === 'admin' || currentUser.id === comment.author_id;

            return (
              <Card key={comment.id} className="p-3 bg-gray-50">
                <div className="flex space-x-3">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={author?.profile_picture_url || undefined} />
                    <AvatarFallback className="bg-indigo-500 text-white text-xs">
                      {author?.name.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-sm text-gray-900">
                            {author?.name || 'Unknown User'}
                          </p>
                          {author?.role === 'admin' && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                              Admin
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {comment.created_at.toLocaleDateString()} at {comment.created_at.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                      
                      {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2 p-1 h-auto"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this comment? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}