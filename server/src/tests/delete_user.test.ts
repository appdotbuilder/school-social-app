import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, commentsTable, likesTable } from '../db/schema';
import { type DeleteUserInput, type CreateUserInput, type CreatePostInput, type CreateCommentInput, type CreateLikeInput } from '../schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

// Test user data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  class_name: '10A',
  profile_picture_url: null,
  role: 'student'
};

const adminUser: CreateUserInput = {
  username: 'adminuser',
  email: 'admin@example.com',
  name: 'Admin User',
  class_name: '12B',
  profile_picture_url: null,
  role: 'admin'
};

const otherUser: CreateUserInput = {
  username: 'otheruser',
  email: 'other@example.com',
  name: 'Other User',
  class_name: '11C',
  profile_picture_url: null,
  role: 'student'
};

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a user successfully', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        name: testUser.name,
        class_name: testUser.class_name,
        profile_picture_url: testUser.profile_picture_url,
        role: testUser.role || 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Delete the user
    const deleteInput: DeleteUserInput = { id: userId };
    const result = await deleteUser(deleteInput);

    expect(result.success).toBe(true);

    // Verify user is deleted from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should throw error when user does not exist', async () => {
    const deleteInput: DeleteUserInput = { id: 999 };

    await expect(deleteUser(deleteInput)).rejects.toThrow(/User with ID 999 not found/i);
  });

  it('should delete user and all associated posts', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        name: testUser.name,
        class_name: testUser.class_name,
        profile_picture_url: testUser.profile_picture_url,
        role: testUser.role || 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create posts for the user
    const postInput: CreatePostInput = {
      title: 'Test Post',
      content: 'This is a test post',
      media_url: null,
      media_type: null,
      type: 'text',
      author_id: userId,
      is_pinned: false
    };

    await db.insert(postsTable)
      .values({
        title: postInput.title,
        content: postInput.content,
        media_url: postInput.media_url,
        media_type: postInput.media_type,
        type: postInput.type,
        author_id: postInput.author_id,
        is_pinned: postInput.is_pinned || false
      })
      .execute();

    await db.insert(postsTable)
      .values({
        title: 'Another Test Post',
        content: 'This is another test post',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: userId,
        is_pinned: false
      })
      .execute();

    // Delete the user
    const deleteInput: DeleteUserInput = { id: userId };
    await deleteUser(deleteInput);

    // Verify user is deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);

    // Verify posts are deleted
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.author_id, userId))
      .execute();

    expect(posts).toHaveLength(0);
  });

  it('should delete user and all associated comments', async () => {
    // Create two users - one to be deleted, one to keep posts
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        name: testUser.name,
        class_name: testUser.class_name,
        profile_picture_url: testUser.profile_picture_url,
        role: testUser.role || 'student'
      })
      .returning()
      .execute();

    const otherUserResult = await db.insert(usersTable)
      .values({
        username: otherUser.username,
        email: otherUser.email,
        name: otherUser.name,
        class_name: otherUser.class_name,
        profile_picture_url: otherUser.profile_picture_url,
        role: otherUser.role || 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const otherUserId = otherUserResult[0].id;

    // Create a post by the other user
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Other User Post',
        content: 'This is a post by other user',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: otherUserId,
        is_pinned: false
      })
      .returning()
      .execute();

    const postId = postResult[0].id;

    // Create comments by the user to be deleted
    await db.insert(commentsTable)
      .values({
        content: 'This is a test comment',
        post_id: postId,
        author_id: userId
      })
      .execute();

    await db.insert(commentsTable)
      .values({
        content: 'This is another test comment',
        post_id: postId,
        author_id: userId
      })
      .execute();

    // Delete the user
    const deleteInput: DeleteUserInput = { id: userId };
    await deleteUser(deleteInput);

    // Verify user is deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);

    // Verify comments are deleted
    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.author_id, userId))
      .execute();

    expect(comments).toHaveLength(0);

    // Verify post still exists (was not authored by deleted user)
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    expect(posts).toHaveLength(1);
  });

  it('should delete user and all associated likes', async () => {
    // Create two users - one to be deleted, one to keep posts
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        name: testUser.name,
        class_name: testUser.class_name,
        profile_picture_url: testUser.profile_picture_url,
        role: testUser.role || 'student'
      })
      .returning()
      .execute();

    const otherUserResult = await db.insert(usersTable)
      .values({
        username: otherUser.username,
        email: otherUser.email,
        name: otherUser.name,
        class_name: otherUser.class_name,
        profile_picture_url: otherUser.profile_picture_url,
        role: otherUser.role || 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const otherUserId = otherUserResult[0].id;

    // Create a post by the other user
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Other User Post',
        content: 'This is a post by other user',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: otherUserId,
        is_pinned: false
      })
      .returning()
      .execute();

    const postId = postResult[0].id;

    // Create likes by the user to be deleted
    await db.insert(likesTable)
      .values({
        post_id: postId,
        user_id: userId
      })
      .execute();

    // Delete the user
    const deleteInput: DeleteUserInput = { id: userId };
    await deleteUser(deleteInput);

    // Verify user is deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);

    // Verify likes are deleted
    const likes = await db.select()
      .from(likesTable)
      .where(eq(likesTable.user_id, userId))
      .execute();

    expect(likes).toHaveLength(0);

    // Verify post still exists
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    expect(posts).toHaveLength(1);
  });

  it('should handle cascading deletes correctly', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        name: testUser.name,
        class_name: testUser.class_name,
        profile_picture_url: testUser.profile_picture_url,
        role: testUser.role || 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create another user for interaction
    const otherUserResult = await db.insert(usersTable)
      .values({
        username: otherUser.username,
        email: otherUser.email,
        name: otherUser.name,
        class_name: otherUser.class_name,
        profile_picture_url: otherUser.profile_picture_url,
        role: otherUser.role || 'student'
      })
      .returning()
      .execute();

    const otherUserId = otherUserResult[0].id;

    // Create a post by the user to be deleted
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Test Post',
        content: 'This is a test post',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: userId,
        is_pinned: false
      })
      .returning()
      .execute();

    const postId = postResult[0].id;

    // Create comments on the post (by other user)
    await db.insert(commentsTable)
      .values({
        content: 'Comment by other user',
        post_id: postId,
        author_id: otherUserId
      })
      .execute();

    // Create likes on the post (by other user)
    await db.insert(likesTable)
      .values({
        post_id: postId,
        user_id: otherUserId
      })
      .execute();

    // Delete the user
    const deleteInput: DeleteUserInput = { id: userId };
    await deleteUser(deleteInput);

    // Verify user is deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);

    // Verify post is deleted (cascading should delete associated comments and likes)
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    expect(posts).toHaveLength(0);

    // Verify comments are deleted due to cascade
    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.post_id, postId))
      .execute();

    expect(comments).toHaveLength(0);

    // Verify likes are deleted due to cascade
    const likes = await db.select()
      .from(likesTable)
      .where(eq(likesTable.post_id, postId))
      .execute();

    expect(likes).toHaveLength(0);

    // Verify other user still exists
    const otherUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, otherUserId))
      .execute();

    expect(otherUsers).toHaveLength(1);
  });
});