import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Users, Settings, Home, PlusCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
// Import types from server
import type { User, Post } from '../../server/src/schema';
import { PostFeed } from '@/components/PostFeed';
import { CreatePostDialog } from '@/components/CreatePostDialog';
import { UserManagement } from '@/components/UserManagement';
import { ProfileCard } from '@/components/ProfileCard';

function App() {
  // Current user state - in a real app, this would come from auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [createPostOpen, setCreatePostOpen] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [postsResult, usersResult] = await Promise.all([
        trpc.getPosts.query(),
        trpc.getUsers.query()
      ]);
      
      setPosts(postsResult);
      setUsers(usersResult);
      
      // Set first admin as current user for demo purposes
      // In real app, this would be handled by authentication
      const adminUser = usersResult.find((user: User) => user.role === 'admin');
      if (adminUser) {
        setCurrentUser(adminUser);
      } else if (usersResult.length > 0) {
        setCurrentUser(usersResult[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // Since server handlers are stubs, we'll create demo data
      createDemoData();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create demo data when server returns empty results
  const createDemoData = useCallback(() => {
    const demoUsers: User[] = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@school.edu',
        name: 'School Administrator',
        class_name: 'Staff',
        profile_picture_url: null,
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        username: 'alice_johnson',
        email: 'alice@school.edu',
        name: 'Alice Johnson',
        class_name: 'Grade 10A',
        profile_picture_url: null,
        role: 'student',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        username: 'bob_smith',
        email: 'bob@school.edu',
        name: 'Bob Smith',
        class_name: 'Grade 11B',
        profile_picture_url: null,
        role: 'student',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const demoPosts: Post[] = [
      {
        id: 1,
        title: '📢 Welcome to School Year 2024!',
        content: 'Welcome everyone to our new school social platform! Here you can share updates, connect with classmates, and stay informed about school events. Let\'s make this year amazing! 🎓✨',
        media_url: null,
        media_type: null,
        type: 'announcement',
        author_id: 1,
        likes_count: 15,
        comments_count: 8,
        is_pinned: true,
        created_at: new Date(Date.now() - 86400000), // 1 day ago
        updated_at: new Date(Date.now() - 86400000)
      },
      {
        id: 2,
        title: 'Science Fair Coming Up! 🔬',
        content: 'Hey everyone! The annual science fair is next month. Start thinking about your projects now. Can\'t wait to see all the amazing experiments and innovations! #ScienceFair2024',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: 2,
        likes_count: 7,
        comments_count: 3,
        is_pinned: false,
        created_at: new Date(Date.now() - 43200000), // 12 hours ago
        updated_at: new Date(Date.now() - 43200000)
      },
      {
        id: 3,
        title: 'Basketball Team Victory! 🏀',
        content: 'Amazing game yesterday! Our school basketball team won 85-72 against Riverside High. So proud of our players! 🎉 #SchoolPride #Basketball',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: 3,
        likes_count: 23,
        comments_count: 12,
        is_pinned: false,
        created_at: new Date(Date.now() - 21600000), // 6 hours ago
        updated_at: new Date(Date.now() - 21600000)
      }
    ];

    setUsers(demoUsers);
    setPosts(demoPosts);
    setCurrentUser(demoUsers[0]); // Set admin as current user
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePostCreated = useCallback((newPost: Post) => {
    setPosts((prev: Post[]) => [newPost, ...prev]);
  }, []);

  const handlePostUpdated = useCallback((updatedPost: Post) => {
    setPosts((prev: Post[]) => 
      prev.map((post: Post) => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  }, []);

  const handlePostDeleted = useCallback((postId: number) => {
    setPosts((prev: Post[]) => prev.filter((post: Post) => post.id !== postId));
  }, []);

  const handleUserUpdated = useCallback((updatedUser: User) => {
    setUsers((prev: User[]) => 
      prev.map((user: User) => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  }, [currentUser]);

  const handleUserDeleted = useCallback((userId: number) => {
    setUsers((prev: User[]) => prev.filter((user: User) => user.id !== userId));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading School Social...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-6 text-center">
          <BookOpen className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Welcome to School Social</h2>
          <p className="text-gray-600">Please wait while we set up your account...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">School Social</h1>
              <Badge variant="outline" className="hidden sm:inline-flex">
                📚 Learning Together
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatePostOpen(true)}
                className="flex items-center space-x-1"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Create Post</span>
              </Button>
              
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.profile_picture_url || undefined} />
                  <AvatarFallback className="bg-indigo-500 text-white">
                    {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.class_name}</p>
                </div>
                {currentUser.role === 'admin' && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-md mx-auto">
            <TabsTrigger value="home" className="flex items-center space-x-1">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-1">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-xs">Me</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            {currentUser.role === 'admin' && (
              <>
                <TabsTrigger value="users" className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center space-x-1">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <PostFeed
                  posts={posts}
                  users={users}
                  currentUser={currentUser}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                />
              </div>
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Class Overview
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Students</span>
                      <Badge variant="outline">{users.filter(u => u.role === 'student').length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Posts</span>
                      <Badge variant="outline">{posts.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Announcements</span>
                      <Badge variant="outline">{posts.filter(p => p.type === 'announcement').length}</Badge>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Activity</h3>
                  <div className="space-y-3 text-sm">
                    {posts.slice(0, 3).map((post: Post) => {
                      const author = users.find((user: User) => user.id === post.author_id);
                      return (
                        <div key={post.id} className="flex items-start space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-indigo-100">
                              {author?.name.split(' ').map(n => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-gray-900 font-medium">{author?.name}</p>
                            <p className="text-gray-600 text-xs truncate max-w-40">
                              {post.title}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <ProfileCard user={currentUser} posts={posts.filter(p => p.author_id === currentUser.id)} />
          </TabsContent>

          {currentUser.role === 'admin' && (
            <>
              <TabsContent value="users">
                <UserManagement 
                  users={users}
                  currentUser={currentUser}
                  onUserUpdated={handleUserUpdated}
                  onUserDeleted={handleUserDeleted}
                />
              </TabsContent>
              
              <TabsContent value="admin">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Admin Dashboard
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="p-4 bg-blue-50">
                      <h3 className="font-semibold text-blue-900">Total Users</h3>
                      <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                    </Card>
                    <Card className="p-4 bg-green-50">
                      <h3 className="font-semibold text-green-900">Total Posts</h3>
                      <p className="text-2xl font-bold text-green-600">{posts.length}</p>
                    </Card>
                    <Card className="p-4 bg-purple-50">
                      <h3 className="font-semibold text-purple-900">Announcements</h3>
                      <p className="text-2xl font-bold text-purple-600">
                        {posts.filter(p => p.type === 'announcement').length}
                      </p>
                    </Card>
                  </div>
                  <p className="text-gray-600">
                    🚀 Welcome to the admin dashboard! From here you can manage users, 
                    monitor posts, and create school-wide announcements. Use the other tabs 
                    to access specific management features.
                  </p>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        currentUser={currentUser}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}

export default App;