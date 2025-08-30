import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['student', 'admin']);
export const postTypeEnum = pgEnum('post_type', ['text', 'image', 'video', 'announcement']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  class_name: text('class_name').notNull(),
  profile_picture_url: text('profile_picture_url'), // Nullable by default
  role: userRoleEnum('role').notNull().default('student'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Posts table
export const postsTable = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  media_url: text('media_url'), // Nullable by default
  media_type: text('media_type'), // Nullable by default
  type: postTypeEnum('type').notNull(),
  author_id: integer('author_id').notNull().references(() => usersTable.id),
  likes_count: integer('likes_count').notNull().default(0),
  comments_count: integer('comments_count').notNull().default(0),
  is_pinned: boolean('is_pinned').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Comments table
export const commentsTable = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  post_id: integer('post_id').notNull().references(() => postsTable.id, { onDelete: 'cascade' }),
  author_id: integer('author_id').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Likes table
export const likesTable = pgTable('likes', {
  id: serial('id').primaryKey(),
  post_id: integer('post_id').notNull().references(() => postsTable.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  posts: many(postsTable),
  comments: many(commentsTable),
  likes: many(likesTable),
}));

export const postsRelations = relations(postsTable, ({ one, many }) => ({
  author: one(usersTable, {
    fields: [postsTable.author_id],
    references: [usersTable.id],
  }),
  comments: many(commentsTable),
  likes: many(likesTable),
}));

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [commentsTable.post_id],
    references: [postsTable.id],
  }),
  author: one(usersTable, {
    fields: [commentsTable.author_id],
    references: [usersTable.id],
  }),
}));

export const likesRelations = relations(likesTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [likesTable.post_id],
    references: [postsTable.id],
  }),
  user: one(usersTable, {
    fields: [likesTable.user_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Post = typeof postsTable.$inferSelect;
export type NewPost = typeof postsTable.$inferInsert;
export type Comment = typeof commentsTable.$inferSelect;
export type NewComment = typeof commentsTable.$inferInsert;
export type Like = typeof likesTable.$inferSelect;
export type NewLike = typeof likesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  users: usersTable,
  posts: postsTable,
  comments: commentsTable,
  likes: likesTable
};