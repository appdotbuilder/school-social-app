import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, likesTable } from '../db/schema';
import { type RemoveLikeInput } from '../schema';
import { removeLike } from '../handlers/remove_like';
import { eq, and } from 'drizzle-orm';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  class_name: 'Test Class',
  profile_picture_url: null,
  role: 'student' as const
};

const testPost = {
  title: 'Test Post',
  content: 'This is a test post content',
  media_url: null,
  media_type: null,
  type: 'text' as const,
  author_id: 1,
  is_pinned: false
};

const testInput: RemoveLikeInput = {
  post_id: 1,
  user_id: 1
};

describe('removeLike', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully remove an existing like', async () => {
    // Create prerequisite user and post
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    const postResult = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: user.id
      })
      .returning()
      .execute();
    const post = postResult[0];

    // Create a like first
    await db.insert(likesTable)
      .values({
        post_id: post.id,
        user_id: user.id
      })
      .execute();

    // Update post likes count
    await db.update(postsTable)
      .set({ likes_count: 1 })
      .where(eq(postsTable.id, post.id))
      .execute();

    const input: RemoveLikeInput = {
      post_id: post.id,
      user_id: user.id
    };

    const result = await removeLike(input);

    expect(result.success).toBe(true);

    // Verify the like was removed from database
    const remainingLikes = await db.select()
      .from(likesTable)
      .where(
        and(
          eq(likesTable.post_id, post.id),
          eq(likesTable.user_id, user.id)
        )
      )
      .execute();

    expect(remainingLikes).toHaveLength(0);

    // Verify the post's like count was decremented
    const updatedPost = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, post.id))
      .execute();

    expect(updatedPost[0].likes_count).toBe(0);
    expect(updatedPost[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return success when like does not exist (idempotent)', async () => {
    // Create prerequisite user and post
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    const postResult = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: user.id
      })
      .returning()
      .execute();
    const post = postResult[0];

    const input: RemoveLikeInput = {
      post_id: post.id,
      user_id: user.id
    };

    const result = await removeLike(input);

    expect(result.success).toBe(true);

    // Verify no likes exist
    const likes = await db.select()
      .from(likesTable)
      .where(
        and(
          eq(likesTable.post_id, post.id),
          eq(likesTable.user_id, user.id)
        )
      )
      .execute();

    expect(likes).toHaveLength(0);

    // Verify post like count remains unchanged
    const updatedPost = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, post.id))
      .execute();

    expect(updatedPost[0].likes_count).toBe(0);
  });

  it('should only remove the specific user-post like combination', async () => {
    // Create multiple users and posts
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user1 = user1Result[0];

    const user2Result = await db.insert(usersTable)
      .values({
        ...testUser,
        username: 'testuser2',
        email: 'test2@example.com'
      })
      .returning()
      .execute();
    const user2 = user2Result[0];

    const post1Result = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: user1.id
      })
      .returning()
      .execute();
    const post1 = post1Result[0];

    const post2Result = await db.insert(postsTable)
      .values({
        ...testPost,
        title: 'Test Post 2',
        author_id: user2.id
      })
      .returning()
      .execute();
    const post2 = post2Result[0];

    // Create multiple likes
    await db.insert(likesTable)
      .values([
        { post_id: post1.id, user_id: user1.id },
        { post_id: post1.id, user_id: user2.id },
        { post_id: post2.id, user_id: user1.id }
      ])
      .execute();

    // Update posts' like counts
    await db.update(postsTable)
      .set({ likes_count: 2 })
      .where(eq(postsTable.id, post1.id))
      .execute();

    await db.update(postsTable)
      .set({ likes_count: 1 })
      .where(eq(postsTable.id, post2.id))
      .execute();

    // Remove only user1's like from post1
    const input: RemoveLikeInput = {
      post_id: post1.id,
      user_id: user1.id
    };

    const result = await removeLike(input);

    expect(result.success).toBe(true);

    // Verify only the specific like was removed
    const user1Post1Likes = await db.select()
      .from(likesTable)
      .where(
        and(
          eq(likesTable.post_id, post1.id),
          eq(likesTable.user_id, user1.id)
        )
      )
      .execute();
    expect(user1Post1Likes).toHaveLength(0);

    // Verify other likes still exist
    const user2Post1Likes = await db.select()
      .from(likesTable)
      .where(
        and(
          eq(likesTable.post_id, post1.id),
          eq(likesTable.user_id, user2.id)
        )
      )
      .execute();
    expect(user2Post1Likes).toHaveLength(1);

    const user1Post2Likes = await db.select()
      .from(likesTable)
      .where(
        and(
          eq(likesTable.post_id, post2.id),
          eq(likesTable.user_id, user1.id)
        )
      )
      .execute();
    expect(user1Post2Likes).toHaveLength(1);

    // Verify post1's like count was decremented but post2's remains
    const updatedPost1 = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, post1.id))
      .execute();
    expect(updatedPost1[0].likes_count).toBe(1);

    const updatedPost2 = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, post2.id))
      .execute();
    expect(updatedPost2[0].likes_count).toBe(1);
  });

  it('should handle multiple remove operations gracefully', async () => {
    // Create prerequisite user and post
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    const postResult = await db.insert(postsTable)
      .values({
        ...testPost,
        author_id: user.id
      })
      .returning()
      .execute();
    const post = postResult[0];

    // Create a like first
    await db.insert(likesTable)
      .values({
        post_id: post.id,
        user_id: user.id
      })
      .execute();

    // Update post likes count
    await db.update(postsTable)
      .set({ likes_count: 1 })
      .where(eq(postsTable.id, post.id))
      .execute();

    const input: RemoveLikeInput = {
      post_id: post.id,
      user_id: user.id
    };

    // First removal should succeed
    const result1 = await removeLike(input);
    expect(result1.success).toBe(true);

    // Second removal should also succeed (idempotent)
    const result2 = await removeLike(input);
    expect(result2.success).toBe(true);

    // Verify no likes exist and count is still 0
    const likes = await db.select()
      .from(likesTable)
      .where(
        and(
          eq(likesTable.post_id, post.id),
          eq(likesTable.user_id, user.id)
        )
      )
      .execute();
    expect(likes).toHaveLength(0);

    const finalPost = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, post.id))
      .execute();
    expect(finalPost[0].likes_count).toBe(0);
  });
});