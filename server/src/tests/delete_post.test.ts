import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, commentsTable, likesTable } from '../db/schema';
import { type DeletePostInput, type CreateUserInput, type CreatePostInput, type CreateCommentInput, type CreateLikeInput } from '../schema';
import { deletePost } from '../handlers/delete_post';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  class_name: 'Test Class',
  profile_picture_url: null,
  role: 'student'
};

const testAdmin: CreateUserInput = {
  username: 'admin',
  email: 'admin@example.com',
  name: 'Admin User',
  class_name: 'Admin Class',
  profile_picture_url: null,
  role: 'admin'
};

const testPost: CreatePostInput = {
  title: 'Test Post',
  content: 'This is a test post',
  media_url: null,
  media_type: null,
  type: 'text',
  author_id: 1, // Will be updated with actual user ID
  is_pinned: false
};

describe('deletePost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a post successfully', async () => {
    // Create test user
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

    // Create test post
    const postResult = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: userId
      })
      .returning()
      .execute();

    const postId = postResult[0].id;

    // Delete the post
    const deleteInput: DeletePostInput = { id: postId };
    const result = await deletePost(deleteInput);

    expect(result.success).toBe(true);

    // Verify post is deleted
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    expect(posts).toHaveLength(0);
  });

  it('should delete post and cascade delete associated comments and likes', async () => {
    // Create test user
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

    // Create test post
    const postResult = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: userId
      })
      .returning()
      .execute();

    const postId = postResult[0].id;

    // Create test comment
    await db.insert(commentsTable)
      .values({
        content: 'Test comment',
        post_id: postId,
        author_id: userId
      })
      .execute();

    // Create test like
    await db.insert(likesTable)
      .values({
        post_id: postId,
        user_id: userId
      })
      .execute();

    // Verify comment and like exist before deletion
    const commentsBefore = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.post_id, postId))
      .execute();

    const likesBefore = await db.select()
      .from(likesTable)
      .where(eq(likesTable.post_id, postId))
      .execute();

    expect(commentsBefore).toHaveLength(1);
    expect(likesBefore).toHaveLength(1);

    // Delete the post
    const deleteInput: DeletePostInput = { id: postId };
    const result = await deletePost(deleteInput);

    expect(result.success).toBe(true);

    // Verify post is deleted
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    expect(posts).toHaveLength(0);

    // Verify associated comments are cascade deleted
    const commentsAfter = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.post_id, postId))
      .execute();

    expect(commentsAfter).toHaveLength(0);

    // Verify associated likes are cascade deleted
    const likesAfter = await db.select()
      .from(likesTable)
      .where(eq(likesTable.post_id, postId))
      .execute();

    expect(likesAfter).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent post', async () => {
    const deleteInput: DeletePostInput = { id: 999 };

    await expect(deletePost(deleteInput)).rejects.toThrow(/Post with id 999 not found/i);
  });

  it('should handle database constraints properly', async () => {
    // Create test user
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

    // Create multiple posts
    const post1Result = await db.insert(postsTable)
      .values({
        ...testPost,
        title: 'Post 1',
        author_id: userId
      })
      .returning()
      .execute();

    const post2Result = await db.insert(postsTable)
      .values({
        ...testPost,
        title: 'Post 2',
        author_id: userId
      })
      .returning()
      .execute();

    const post1Id = post1Result[0].id;
    const post2Id = post2Result[0].id;

    // Delete first post
    const deleteInput1: DeletePostInput = { id: post1Id };
    const result1 = await deletePost(deleteInput1);

    expect(result1.success).toBe(true);

    // Verify only first post is deleted
    const remainingPosts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.author_id, userId))
      .execute();

    expect(remainingPosts).toHaveLength(1);
    expect(remainingPosts[0].id).toBe(post2Id);
    expect(remainingPosts[0].title).toBe('Post 2');
  });

  it('should work with posts that have no comments or likes', async () => {
    // Create test user
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

    // Create test post with no associated data
    const postResult = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: userId
      })
      .returning()
      .execute();

    const postId = postResult[0].id;

    // Delete the post
    const deleteInput: DeletePostInput = { id: postId };
    const result = await deletePost(deleteInput);

    expect(result.success).toBe(true);

    // Verify post is deleted
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    expect(posts).toHaveLength(0);
  });
});