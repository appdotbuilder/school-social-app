import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { Separator } from '@/components/ui/separator';
import { Calendar, Mail, MapPin, Shield, GraduationCap, MessageCircle, Heart, FileText, Megaphone, ImageIcon, VideoIcon } from 'lucide-react';
import type { User, Post } from '../../../server/src/schema';

interface ProfileCardProps {
  user: User;
  posts: Post[];
}

export function ProfileCard({ user, posts }: ProfileCardProps) {
  // Calculate user stats
  const totalLikes = posts.reduce((sum: number, post: Post) => sum + post.likes_count, 0);
  const totalComments = posts.reduce((sum: number, post: Post) => sum + post.comments_count, 0);

  const getPostTypeStats = () => {
    const stats = {
      text: posts.filter(p => p.type === 'text').length,
      image: posts.filter(p => p.type === 'image').length,
      video: posts.filter(p => p.type === 'video').length,
      announcement: posts.filter(p => p.type === 'announcement').length,
    };
    return stats;
  };

  const postTypeStats = getPostTypeStats();

  const getPostTypeIcon = (type: string) => {
    const iconProps = { className: "h-4 w-4" };
    switch (type) {
      case 'text':
        return <FileText {...iconProps} className="h-4 w-4 text-gray-600" />;
      case 'image':
        return <ImageIcon {...iconProps} className="h-4 w-4 text-blue-600" />;
      case 'video':
        return <VideoIcon {...iconProps} className="h-4 w-4 text-purple-600" />;
      case 'announcement':
        return <Megaphone {...iconProps} className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const recentPosts = posts.slice(0, 3).sort((a: Post, b: Post) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Information */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader className="text-center pb-4">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarImage src={user.profile_picture_url || undefined} />
              <AvatarFallback className="bg-indigo-500 text-white text-2xl">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">@{user.username}</p>
              <div className="flex justify-center mt-2">
                {user.role === 'admin' ? (
                  <Badge className="bg-amber-100 text-amber-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrator
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Student
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{user.class_name}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Joined {user.created_at.toLocaleDateString()}</span>
              </div>
            </div>

            <Separator />

            {/* Activity Stats */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Activity</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{posts.length}</p>
                  <p className="text-xs text-blue-800">Posts</p>
                </div>
                
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{totalLikes}</p>
                  <p className="text-xs text-red-800">Likes Received</p>
                </div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{totalComments}</p>
                <p className="text-xs text-green-800">Comments Received</p>
              </div>
            </div>

            {/* Post Type Breakdown */}
            {posts.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Content Types</h3>
                  <div className="space-y-2">
                    {Object.entries(postTypeStats).map(([type, count]) => (
                      count > 0 && (
                        <div key={type} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            {getPostTypeIcon(type)}
                            <span className="capitalize">{type === 'text' ? 'Text Posts' : 
                              type === 'image' ? 'Images' : 
                              type === 'video' ? 'Videos' : 'Announcements'}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{count}</Badge>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Status */}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Account Status</span>
              <Badge variant={user.is_active ? "default" : "secondary"}>
                {user.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts and Activity */}
      <div className="lg:col-span-2 space-y-4">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Recent Posts</span>
              <Badge variant="outline">{posts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No posts yet</h3>
                <p className="text-sm">
                  {user.role === 'admin' 
                    ? "Create your first announcement or post to engage with the school community!" 
                    : "Share your first post to connect with classmates!"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPosts.map((post: Post) => (
                  <Card key={post.id} className="p-4 bg-gray-50">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {post.type === 'announcement' && <Megaphone className="h-4 w-4 text-amber-600" />}
                          {post.type === 'image' && <ImageIcon className="h-4 w-4 text-blue-600" />}
                          {post.type === 'video' && <VideoIcon className="h-4 w-4 text-purple-600" />}
                          {post.type === 'text' && <FileText className="h-4 w-4 text-gray-600" />}
                          <h4 className="font-medium text-gray-900 line-clamp-1">{post.title}</h4>
                          {post.is_pinned && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {post.created_at.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3 w-3" />
                          <span>{post.likes_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{post.comments_count}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {post.type}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {posts.length > 3 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-500">
                      And {posts.length - 3} more posts...
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Member Since</Label>
                <p className="text-sm text-gray-900">
                  {user.created_at.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Last Updated</Label>
                <p className="text-sm text-gray-900">
                  {user.updated_at.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">User ID</Label>
                <p className="text-sm text-gray-900 font-mono">{user.id}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Role</Label>
                <p className="text-sm text-gray-900 capitalize">{user.role}</p>
              </div>
            </div>

            {user.role === 'admin' && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">Administrator Privileges</span>
                </div>
                <ul className="text-xs text-amber-800 space-y-1">
                  <li>• Can manage all users and their accounts</li>
                  <li>• Can create and manage school-wide announcements</li>
                  <li>• Can moderate and delete any posts or comments</li>
                  <li>• Has access to admin dashboard and analytics</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Label({ className, children, ...props }: { className?: string; children: React.ReactNode }) {
  return <label className={className} {...props}>{children}</label>;
}