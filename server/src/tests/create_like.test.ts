import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, likesTable } from '../db/schema';
import { type CreateLikeInput } from '../schema';
import { createLike } from '../handlers/create_like';
import { eq, and } from 'drizzle-orm';

// Test data setup
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  class_name: '10A',
  profile_picture_url: null,
  role: 'student' as const
};

const testPost = {
  title: 'Test Post',
  content: 'This is a test post',
  media_url: null,
  media_type: null,
  type: 'text' as const,
  author_id: 1, // Will be set after user creation
  is_pinned: false
};

const testInput: CreateLikeInput = {
  post_id: 1, // Will be set after post creation
  user_id: 1  // Will be set after user creation
};

describe('createLike', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a like for a post', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: userId
      })
      .returning()
      .execute();
    const postId = postResult[0].id;

    // Create like
    const result = await createLike({
      post_id: postId,
      user_id: userId
    });

    // Validate like record
    expect(result.id).toBeDefined();
    expect(result.post_id).toEqual(postId);
    expect(result.user_id).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save like to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: userId
      })
      .returning()
      .execute();
    const postId = postResult[0].id;

    // Create like
    const result = await createLike({
      post_id: postId,
      user_id: userId
    });

    // Verify like exists in database
    const likes = await db.select()
      .from(likesTable)
      .where(eq(likesTable.id, result.id))
      .execute();

    expect(likes).toHaveLength(1);
    expect(likes[0].post_id).toEqual(postId);
    expect(likes[0].user_id).toEqual(userId);
    expect(likes[0].created_at).toBeInstanceOf(Date);
  });

  it('should increment post like count', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: userId
      })
      .returning()
      .execute();
    const postId = postResult[0].id;
    const initialLikeCount = postResult[0].likes_count;

    // Create like
    await createLike({
      post_id: postId,
      user_id: userId
    });

    // Verify post like count was incremented
    const updatedPost = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    expect(updatedPost[0].likes_count).toEqual(initialLikeCount + 1);
    expect(updatedPost[0].updated_at).toBeInstanceOf(Date);
  });

  it('should prevent duplicate likes', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: userId
      })
      .returning()
      .execute();
    const postId = postResult[0].id;

    // Create first like
    await createLike({
      post_id: postId,
      user_id: userId
    });

    // Attempt to create duplicate like
    await expect(createLike({
      post_id: postId,
      user_id: userId
    })).rejects.toThrow(/already liked/i);
  });

  it('should throw error when post does not exist', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Attempt to like non-existent post
    await expect(createLike({
      post_id: 999,
      user_id: userId
    })).rejects.toThrow(/does not exist/i);
  });

  it('should handle multiple users liking the same post', async () => {
    // Create multiple users
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        ...testUser,
        username: 'testuser2',
        email: 'test2@example.com'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: user1Id
      })
      .returning()
      .execute();
    const postId = postResult[0].id;

    // Both users like the post
    await createLike({
      post_id: postId,
      user_id: user1Id
    });

    await createLike({
      post_id: postId,
      user_id: user2Id
    });

    // Verify both likes exist
    const likes = await db.select()
      .from(likesTable)
      .where(eq(likesTable.post_id, postId))
      .execute();

    expect(likes).toHaveLength(2);

    // Verify post like count is correct
    const updatedPost = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    expect(updatedPost[0].likes_count).toEqual(2);
  });

  it('should verify like uniqueness constraint', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: userId
      })
      .returning()
      .execute();
    const postId = postResult[0].id;

    // Create like
    await createLike({
      post_id: postId,
      user_id: userId
    });

    // Verify only one like exists for this user-post combination
    const likes = await db.select()
      .from(likesTable)
      .where(and(
        eq(likesTable.post_id, postId),
        eq(likesTable.user_id, userId)
      ))
      .execute();

    expect(likes).toHaveLength(1);
    expect(likes[0].post_id).toEqual(postId);
    expect(likes[0].user_id).toEqual(userId);
  });
});