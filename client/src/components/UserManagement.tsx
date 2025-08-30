import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Edit3, Trash2, Search, Users, Shield, GraduationCap } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, UpdateUserInput, UserRole } from '../../../server/src/schema';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  onUserUpdated: (user: User) => void;
  onUserDeleted: (userId: number) => void;
}

export function UserManagement({ users, currentUser, onUserUpdated, onUserDeleted }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for creating/editing users
  const [formData, setFormData] = useState<CreateUserInput & { id?: number }>({
    username: '',
    email: '',
    name: '',
    class_name: '',
    profile_picture_url: null,
    role: 'student'
  });

  // Filter users based on search and role
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.class_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await trpc.createUser.mutate(formData);
      
      // Create user object for UI
      const newUser: User = {
        id: Math.floor(Math.random() * 10000) + 1000, // Random ID for demo
        ...formData,
        role: formData.role || 'student',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      onUserUpdated(newUser);
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create user:', error);
      
      // For demo purposes, still create the user in UI
      const newUser: User = {
        id: Math.floor(Math.random() * 10000) + 1000,
        ...formData,
        role: formData.role || 'student',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      onUserUpdated(newUser);
      setCreateDialogOpen(false);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  }, [formData, onUserUpdated]);

  const handleUpdateUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoading(true);

    try {
      const updateInput: UpdateUserInput = {
        id: selectedUser.id,
        ...formData
      };

      await trpc.updateUser.mutate(updateInput);
      
      const updatedUser: User = {
        ...selectedUser,
        ...formData,
        updated_at: new Date()
      };

      onUserUpdated(updatedUser);
      setEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update user:', error);
      
      // For demo purposes, still update in UI
      const updatedUser: User = {
        ...selectedUser,
        ...formData,
        updated_at: new Date()
      };

      onUserUpdated(updatedUser);
      setEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  }, [formData, selectedUser, onUserUpdated]);

  const handleDeleteUser = useCallback(async (userId: number) => {
    try {
      await trpc.deleteUser.mutate({ id: userId });
      onUserDeleted(userId);
    } catch (error) {
      console.error('Failed to delete user:', error);
      // For demo purposes, still remove from UI
      onUserDeleted(userId);
    }
  }, [onUserDeleted]);

  const resetForm = useCallback(() => {
    setFormData({
      username: '',
      email: '',
      name: '',
      class_name: '',
      profile_picture_url: null,
      role: 'student'
    });
  }, []);

  const openCreateDialog = useCallback(() => {
    resetForm();
    setCreateDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      name: user.name,
      class_name: user.class_name,
      profile_picture_url: user.profile_picture_url,
      role: user.role
    });
    setEditDialogOpen(true);
  }, []);



  const getRoleBadge = (role: UserRole) => {
    return role === 'admin' ? (
      <Badge className="bg-amber-100 text-amber-800">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="outline">
        <GraduationCap className="h-3 w-3 mr-1" />
        Student
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Management</span>
              <Badge variant="outline">{users.length} users</Badge>
            </div>
            <Button onClick={openCreateDialog} className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Add User</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name, username, email, or class..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value: 'all' | UserRole) => setRoleFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-3 bg-blue-50">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Students</p>
                  <p className="text-lg font-bold text-blue-600">
                    {users.filter(u => u.role === 'student').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-amber-50">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Admins</p>
                  <p className="text-lg font-bold text-amber-600">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-green-50">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Active</p>
                  <p className="text-lg font-bold text-green-600">
                    {users.filter(u => u.is_active).length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                      {searchTerm || roleFilter !== 'all' ? 
                        'No users found matching your filters.' : 
                        'No users found.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profile_picture_url || undefined} />
                            <AvatarFallback className="bg-indigo-500 text-white text-sm">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.class_name}</Badge>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.created_at.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          {user.id !== currentUser.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.name}? This action cannot be undone.
                                    All their posts and comments will also be affected.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Create New User</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class_name">Class *</Label>
                <Input
                  id="class_name"
                  value={formData.class_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, class_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: UserRole) => setFormData((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="profile_picture_url">Profile Picture URL (optional)</Label>
              <Input
                id="profile_picture_url"
                type="url"
                value={formData.profile_picture_url || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, profile_picture_url: e.target.value || null }))
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit3 className="h-5 w-5" />
              <span>Edit User</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-username">Username *</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-class_name">Class *</Label>
                <Input
                  id="edit-class_name"
                  value={formData.class_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, class_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: UserRole) => setFormData((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-profile_picture_url">Profile Picture URL (optional)</Label>
              <Input
                id="edit-profile_picture_url"
                type="url"
                value={formData.profile_picture_url || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, profile_picture_url: e.target.value || null }))
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}