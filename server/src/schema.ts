import { z } from 'zod';

// User role enum
export const userRoleEnum = z.enum(['student', 'admin']);
export type UserRole = z.infer<typeof userRoleEnum>;

// Post type enum
export const postTypeEnum = z.enum(['text', 'image', 'video', 'announcement']);
export type PostType = z.infer<typeof postTypeEnum>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  name: z.string(),
  class_name: z.string(),
  profile_picture_url: z.string().nullable(),
  role: userRoleEnum,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Post schema
export const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  media_url: z.string().nullable(),
  media_type: z.string().nullable(),
  type: postTypeEnum,
  author_id: z.number(),
  likes_count: z.number(),
  comments_count: z.number(),
  is_pinned: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Post = z.infer<typeof postSchema>;

// Comment schema
export const commentSchema = z.object({
  id: z.number(),
  content: z.string(),
  post_id: z.number(),
  author_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Comment = z.infer<typeof commentSchema>;

// Like schema
export const likeSchema = z.object({
  id: z.number(),
  post_id: z.number(),
  user_id: z.number(),
  created_at: z.coerce.date()
});

export type Like = z.infer<typeof likeSchema>;

// Input schemas for creating users
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  class_name: z.string().min(1).max(50),
  profile_picture_url: z.string().url().nullable(),
  role: userRoleEnum.optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for updating users
export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).max(100).optional(),
  class_name: z.string().min(1).max(50).optional(),
  profile_picture_url: z.string().url().nullable().optional(),
  role: userRoleEnum.optional(),
  is_active: z.boolean().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Input schema for creating posts
export const createPostInputSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  media_url: z.string().url().nullable(),
  media_type: z.string().nullable(),
  type: postTypeEnum,
  author_id: z.number(),
  is_pinned: z.boolean().optional()
});

export type CreatePostInput = z.infer<typeof createPostInputSchema>;

// Input schema for updating posts
export const updatePostInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000).optional(),
  media_url: z.string().url().nullable().optional(),
  media_type: z.string().nullable().optional(),
  is_pinned: z.boolean().optional()
});

export type UpdatePostInput = z.infer<typeof updatePostInputSchema>;

// Input schema for creating comments
export const createCommentInputSchema = z.object({
  content: z.string().min(1).max(1000),
  post_id: z.number(),
  author_id: z.number()
});

export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;

// Input schema for updating comments
export const updateCommentInputSchema = z.object({
  id: z.number(),
  content: z.string().min(1).max(1000)
});

export type UpdateCommentInput = z.infer<typeof updateCommentInputSchema>;

// Input schema for creating likes
export const createLikeInputSchema = z.object({
  post_id: z.number(),
  user_id: z.number()
});

export type CreateLikeInput = z.infer<typeof createLikeInputSchema>;

// Input schema for removing likes
export const removeLikeInputSchema = z.object({
  post_id: z.number(),
  user_id: z.number()
});

export type RemoveLikeInput = z.infer<typeof removeLikeInputSchema>;

// Query input schemas
export const getUserByIdInputSchema = z.object({
  id: z.number()
});

export type GetUserByIdInput = z.infer<typeof getUserByIdInputSchema>;

export const getPostByIdInputSchema = z.object({
  id: z.number()
});

export type GetPostByIdInput = z.infer<typeof getPostByIdInputSchema>;

export const getPostsByAuthorInputSchema = z.object({
  author_id: z.number()
});

export type GetPostsByAuthorInput = z.infer<typeof getPostsByAuthorInputSchema>;

export const getCommentsByPostInputSchema = z.object({
  post_id: z.number()
});

export type GetCommentsByPostInput = z.infer<typeof getCommentsByPostInputSchema>;

export const deletePostInputSchema = z.object({
  id: z.number()
});

export type DeletePostInput = z.infer<typeof deletePostInputSchema>;

export const deleteUserInputSchema = z.object({
  id: z.number()
});

export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;

export const deleteCommentInputSchema = z.object({
  id: z.number()
});

export type DeleteCommentInput = z.infer<typeof deleteCommentInputSchema>;