import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, commentsTable } from '../db/schema';
import { type CreateCommentInput } from '../schema';
import { createComment } from '../handlers/create_comment';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateCommentInput = {
  content: 'This is a test comment',
  post_id: 1,
  author_id: 1
};

describe('createComment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a comment successfully', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'Class A',
        profile_picture_url: null,
        role: 'student'
      })
      .execute();

    // Create prerequisite post
    await db.insert(postsTable)
      .values({
        title: 'Test Post',
        content: 'This is a test post',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: 1,
        is_pinned: false
      })
      .execute();

    const result = await createComment(testInput);

    // Basic field validation
    expect(result.content).toEqual('This is a test comment');
    expect(result.post_id).toEqual(1);
    expect(result.author_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save comment to database', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'Class A',
        profile_picture_url: null,
        role: 'student'
      })
      .execute();

    // Create prerequisite post
    await db.insert(postsTable)
      .values({
        title: 'Test Post',
        content: 'This is a test post',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: 1,
        is_pinned: false
      })
      .execute();

    const result = await createComment(testInput);

    // Query comment from database
    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, result.id))
      .execute();

    expect(comments).toHaveLength(1);
    expect(comments[0].content).toEqual('This is a test comment');
    expect(comments[0].post_id).toEqual(1);
    expect(comments[0].author_id).toEqual(1);
    expect(comments[0].created_at).toBeInstanceOf(Date);
    expect(comments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should increment post comment count', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'Class A',
        profile_picture_url: null,
        role: 'student'
      })
      .execute();

    // Create prerequisite post with initial comment count of 0
    await db.insert(postsTable)
      .values({
        title: 'Test Post',
        content: 'This is a test post',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: 1,
        is_pinned: false
      })
      .execute();

    // Verify initial comment count is 0
    let post = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 1))
      .execute();

    expect(post[0].comments_count).toEqual(0);

    // Create comment
    await createComment(testInput);

    // Verify comment count was incremented
    post = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 1))
      .execute();

    expect(post[0].comments_count).toEqual(1);
    expect(post[0].updated_at).toBeInstanceOf(Date);
  });

  it('should increment comment count for multiple comments', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'Class A',
        profile_picture_url: null,
        role: 'student'
      })
      .execute();

    // Create prerequisite post
    await db.insert(postsTable)
      .values({
        title: 'Test Post',
        content: 'This is a test post',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: 1,
        is_pinned: false
      })
      .execute();

    // Create first comment
    await createComment(testInput);

    // Create second comment
    await createComment({
      ...testInput,
      content: 'This is another test comment'
    });

    // Verify comment count is 2
    const post = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 1))
      .execute();

    expect(post[0].comments_count).toEqual(2);
  });

  it('should throw error when post does not exist', async () => {
    // Create prerequisite user but no post
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'Class A',
        profile_picture_url: null,
        role: 'student'
      })
      .execute();

    await expect(createComment(testInput)).rejects.toThrow(/post with id 1 not found/i);
  });

  it('should throw error when author does not exist', async () => {
    // Create prerequisite post but no user
    await db.insert(usersTable)
      .values({
        username: 'postauthor',
        email: 'author@example.com',
        name: 'Post Author',
        class_name: 'Class B',
        profile_picture_url: null,
        role: 'student'
      })
      .execute();

    await db.insert(postsTable)
      .values({
        title: 'Test Post',
        content: 'This is a test post',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: 1,
        is_pinned: false
      })
      .execute();

    // Try to create comment with non-existent author_id
    const invalidInput: CreateCommentInput = {
      ...testInput,
      author_id: 999
    };

    await expect(createComment(invalidInput)).rejects.toThrow(/user with id 999 not found/i);
  });

  it('should handle long comment content', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'Class A',
        profile_picture_url: null,
        role: 'student'
      })
      .execute();

    // Create prerequisite post
    await db.insert(postsTable)
      .values({
        title: 'Test Post',
        content: 'This is a test post',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: 1,
        is_pinned: false
      })
      .execute();

    const longContent = 'This is a very long comment that tests the maximum length handling. '.repeat(10);
    const longCommentInput: CreateCommentInput = {
      ...testInput,
      content: longContent
    };

    const result = await createComment(longCommentInput);

    expect(result.content).toEqual(longContent);
    expect(result.content.length).toBeGreaterThan(100);
  });
});