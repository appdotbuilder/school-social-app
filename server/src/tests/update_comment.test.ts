import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, commentsTable } from '../db/schema';
import { type UpdateCommentInput } from '../schema';
import { updateComment } from '../handlers/update_comment';
import { eq } from 'drizzle-orm';

// Test inputs
const testUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  class_name: 'Test Class',
  profile_picture_url: null,
  role: 'student' as const
};

const testPostInput = {
  title: 'Test Post',
  content: 'This is a test post',
  media_url: null,
  media_type: null,
  type: 'text' as const,
  author_id: 0, // Will be set after creating user
  is_pinned: false
};

const testCommentInput = {
  content: 'This is a test comment',
  post_id: 0, // Will be set after creating post
  author_id: 0 // Will be set after creating user
};

describe('updateComment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update comment content', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values({
        ...testPostInput,
        author_id: userId
      })
      .returning()
      .execute();
    const postId = postResult[0].id;

    // Create test comment
    const commentResult = await db.insert(commentsTable)
      .values({
        ...testCommentInput,
        post_id: postId,
        author_id: userId
      })
      .returning()
      .execute();
    const commentId = commentResult[0].id;

    // Update comment
    const updateInput: UpdateCommentInput = {
      id: commentId,
      content: 'Updated comment content'
    };

    const result = await updateComment(updateInput);

    // Verify result
    expect(result.id).toEqual(commentId);
    expect(result.content).toEqual('Updated comment content');
    expect(result.post_id).toEqual(postId);
    expect(result.author_id).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > result.created_at).toBe(true);
  });

  it('should save updated comment to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values({
        ...testPostInput,
        author_id: userId
      })
      .returning()
      .execute();
    const postId = postResult[0].id;

    // Create test comment
    const commentResult = await db.insert(commentsTable)
      .values({
        ...testCommentInput,
        post_id: postId,
        author_id: userId
      })
      .returning()
      .execute();
    const commentId = commentResult[0].id;

    // Update comment
    const updateInput: UpdateCommentInput = {
      id: commentId,
      content: 'Updated comment content'
    };

    await updateComment(updateInput);

    // Query database to verify update
    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, commentId))
      .execute();

    expect(comments).toHaveLength(1);
    expect(comments[0].content).toEqual('Updated comment content');
    expect(comments[0].post_id).toEqual(postId);
    expect(comments[0].author_id).toEqual(userId);
    expect(comments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent comment', async () => {
    const updateInput: UpdateCommentInput = {
      id: 99999,
      content: 'This should fail'
    };

    await expect(updateComment(updateInput))
      .rejects.toThrow(/Comment with id 99999 not found/i);
  });

  it('should handle very long content', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values({
        ...testPostInput,
        author_id: userId
      })
      .returning()
      .execute();
    const postId = postResult[0].id;

    // Create test comment
    const commentResult = await db.insert(commentsTable)
      .values({
        ...testCommentInput,
        post_id: postId,
        author_id: userId
      })
      .returning()
      .execute();
    const commentId = commentResult[0].id;

    // Update with long content
    const longContent = 'A'.repeat(1000); // Max length based on schema
    const updateInput: UpdateCommentInput = {
      id: commentId,
      content: longContent
    };

    const result = await updateComment(updateInput);

    expect(result.content).toEqual(longContent);
    expect(result.content.length).toEqual(1000);
  });

  it('should preserve other comment fields when updating', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values({
        ...testPostInput,
        author_id: userId
      })
      .returning()
      .execute();
    const postId = postResult[0].id;

    // Create test comment
    const commentResult = await db.insert(commentsTable)
      .values({
        ...testCommentInput,
        post_id: postId,
        author_id: userId
      })
      .returning()
      .execute();
    const originalComment = commentResult[0];

    // Update only content
    const updateInput: UpdateCommentInput = {
      id: originalComment.id,
      content: 'New content only'
    };

    const result = await updateComment(updateInput);

    // Verify other fields are preserved
    expect(result.id).toEqual(originalComment.id);
    expect(result.post_id).toEqual(originalComment.post_id);
    expect(result.author_id).toEqual(originalComment.author_id);
    expect(result.created_at).toEqual(originalComment.created_at);
    expect(result.content).toEqual('New content only');
  });
});