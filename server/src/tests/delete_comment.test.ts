import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, commentsTable } from '../db/schema';
import { type DeleteCommentInput } from '../schema';
import { deleteComment } from '../handlers/delete_comment';
import { eq } from 'drizzle-orm';

describe('deleteComment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: any;
  let testPost: any;
  let testComment: any;

  beforeEach(async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'Test Class',
        profile_picture_url: null,
        role: 'student'
      })
      .returning()
      .execute();
    testUser = users[0];

    // Create test post
    const posts = await db.insert(postsTable)
      .values({
        title: 'Test Post',
        content: 'This is a test post',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: testUser.id,
        comments_count: 1 // Start with 1 comment
      })
      .returning()
      .execute();
    testPost = posts[0];

    // Create test comment
    const comments = await db.insert(commentsTable)
      .values({
        content: 'This is a test comment',
        post_id: testPost.id,
        author_id: testUser.id
      })
      .returning()
      .execute();
    testComment = comments[0];
  });

  it('should delete a comment successfully', async () => {
    const input: DeleteCommentInput = {
      id: testComment.id
    };

    const result = await deleteComment(input);

    expect(result.success).toBe(true);

    // Verify comment is deleted
    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, testComment.id))
      .execute();

    expect(comments).toHaveLength(0);
  });

  it('should update post comment count after deletion', async () => {
    const input: DeleteCommentInput = {
      id: testComment.id
    };

    await deleteComment(input);

    // Verify post comment count is decremented
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, testPost.id))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].comments_count).toBe(0);
  });

  it('should update post updated_at timestamp', async () => {
    const originalUpdatedAt = testPost.updated_at;
    
    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: DeleteCommentInput = {
      id: testComment.id
    };

    await deleteComment(input);

    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, testPost.id))
      .execute();

    expect(posts[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should handle multiple comments correctly', async () => {
    // Create additional comment
    const additionalComments = await db.insert(commentsTable)
      .values({
        content: 'Another test comment',
        post_id: testPost.id,
        author_id: testUser.id
      })
      .returning()
      .execute();

    // Update post comment count to reflect 2 comments
    await db.update(postsTable)
      .set({ comments_count: 2 })
      .where(eq(postsTable.id, testPost.id))
      .execute();

    const input: DeleteCommentInput = {
      id: testComment.id
    };

    await deleteComment(input);

    // Verify comment count is decremented correctly
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, testPost.id))
      .execute();

    expect(posts[0].comments_count).toBe(1);

    // Verify only the correct comment was deleted
    const remainingComments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.post_id, testPost.id))
      .execute();

    expect(remainingComments).toHaveLength(1);
    expect(remainingComments[0].id).toBe(additionalComments[0].id);
  });

  it('should handle comment count never going below zero', async () => {
    // Set comment count to 0 (edge case)
    await db.update(postsTable)
      .set({ comments_count: 0 })
      .where(eq(postsTable.id, testPost.id))
      .execute();

    const input: DeleteCommentInput = {
      id: testComment.id
    };

    await deleteComment(input);

    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, testPost.id))
      .execute();

    expect(posts[0].comments_count).toBe(0);
  });

  it('should throw error when comment does not exist', async () => {
    const input: DeleteCommentInput = {
      id: 99999 // Non-existent comment ID
    };

    await expect(deleteComment(input)).rejects.toThrow(/comment not found/i);
  });

  it('should throw error when associated post does not exist', async () => {
    // Delete the post first - this will cascade delete the comment due to foreign key constraint
    await db.delete(postsTable)
      .where(eq(postsTable.id, testPost.id))
      .execute();

    const input: DeleteCommentInput = {
      id: testComment.id
    };

    // The comment should be gone due to cascade delete, so we expect "Comment not found"
    await expect(deleteComment(input)).rejects.toThrow(/comment not found/i);
  });

  it('should handle cascading deletion properly', async () => {
    // Create multiple comments for the post
    await db.insert(commentsTable)
      .values([
        {
          content: 'Comment 2',
          post_id: testPost.id,
          author_id: testUser.id
        },
        {
          content: 'Comment 3',
          post_id: testPost.id,
          author_id: testUser.id
        }
      ])
      .execute();

    // Update comment count
    await db.update(postsTable)
      .set({ comments_count: 3 })
      .where(eq(postsTable.id, testPost.id))
      .execute();

    // Delete one specific comment
    const input: DeleteCommentInput = {
      id: testComment.id
    };

    await deleteComment(input);

    // Verify only the targeted comment was deleted
    const remainingComments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.post_id, testPost.id))
      .execute();

    expect(remainingComments).toHaveLength(2);
    
    // Verify comment count was updated correctly
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, testPost.id))
      .execute();

    expect(posts[0].comments_count).toBe(2);
  });
});