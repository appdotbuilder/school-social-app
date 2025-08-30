import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, commentsTable } from '../db/schema';
import { type GetCommentsByPostInput } from '../schema';
import { getCommentsByPost } from '../handlers/get_comments_by_post';

describe('getCommentsByPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return comments for a specific post', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'Class A'
      })
      .returning()
      .execute();

    // Create test post
    const [post] = await db.insert(postsTable)
      .values({
        title: 'Test Post',
        content: 'This is a test post',
        type: 'text',
        author_id: user.id
      })
      .returning()
      .execute();

    // Create test comments
    const comment1 = await db.insert(commentsTable)
      .values({
        content: 'First comment',
        post_id: post.id,
        author_id: user.id
      })
      .returning()
      .execute();

    // Add delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const comment2 = await db.insert(commentsTable)
      .values({
        content: 'Second comment',
        post_id: post.id,
        author_id: user.id
      })
      .returning()
      .execute();

    const input: GetCommentsByPostInput = {
      post_id: post.id
    };

    const result = await getCommentsByPost(input);

    expect(result).toHaveLength(2);
    expect(result[0].content).toEqual('First comment');
    expect(result[1].content).toEqual('Second comment');
    expect(result[0].post_id).toEqual(post.id);
    expect(result[1].post_id).toEqual(post.id);
    expect(result[0].author_id).toEqual(user.id);
    expect(result[1].author_id).toEqual(user.id);
    expect(result[0].id).toBeDefined();
    expect(result[1].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return comments ordered by creation date (oldest first)', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'Class A'
      })
      .returning()
      .execute();

    // Create test post
    const [post] = await db.insert(postsTable)
      .values({
        title: 'Test Post',
        content: 'This is a test post',
        type: 'text',
        author_id: user.id
      })
      .returning()
      .execute();

    // Create multiple comments with delays to ensure different timestamps
    const [comment1] = await db.insert(commentsTable)
      .values({
        content: 'First comment (oldest)',
        post_id: post.id,
        author_id: user.id
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 20));

    const [comment2] = await db.insert(commentsTable)
      .values({
        content: 'Second comment (middle)',
        post_id: post.id,
        author_id: user.id
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 20));

    const [comment3] = await db.insert(commentsTable)
      .values({
        content: 'Third comment (newest)',
        post_id: post.id,
        author_id: user.id
      })
      .returning()
      .execute();

    const input: GetCommentsByPostInput = {
      post_id: post.id
    };

    const result = await getCommentsByPost(input);

    expect(result).toHaveLength(3);
    
    // Verify order by creation date (oldest first)
    expect(result[0].content).toEqual('First comment (oldest)');
    expect(result[1].content).toEqual('Second comment (middle)');
    expect(result[2].content).toEqual('Third comment (newest)');

    // Verify timestamps are in ascending order
    expect(result[0].created_at.getTime()).toBeLessThan(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeLessThan(result[2].created_at.getTime());
  });

  it('should return empty array for post with no comments', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'Class A'
      })
      .returning()
      .execute();

    // Create test post without any comments
    const [post] = await db.insert(postsTable)
      .values({
        title: 'Post Without Comments',
        content: 'This post has no comments',
        type: 'text',
        author_id: user.id
      })
      .returning()
      .execute();

    const input: GetCommentsByPostInput = {
      post_id: post.id
    };

    const result = await getCommentsByPost(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent post', async () => {
    const input: GetCommentsByPostInput = {
      post_id: 99999 // Non-existent post ID
    };

    const result = await getCommentsByPost(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return comments for the specified post', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'Class A'
      })
      .returning()
      .execute();

    // Create two test posts
    const [post1] = await db.insert(postsTable)
      .values({
        title: 'First Post',
        content: 'This is the first post',
        type: 'text',
        author_id: user.id
      })
      .returning()
      .execute();

    const [post2] = await db.insert(postsTable)
      .values({
        title: 'Second Post',
        content: 'This is the second post',
        type: 'text',
        author_id: user.id
      })
      .returning()
      .execute();

    // Create comments for both posts
    await db.insert(commentsTable)
      .values([
        {
          content: 'Comment on first post',
          post_id: post1.id,
          author_id: user.id
        },
        {
          content: 'Another comment on first post',
          post_id: post1.id,
          author_id: user.id
        },
        {
          content: 'Comment on second post',
          post_id: post2.id,
          author_id: user.id
        }
      ])
      .execute();

    const input: GetCommentsByPostInput = {
      post_id: post1.id
    };

    const result = await getCommentsByPost(input);

    expect(result).toHaveLength(2);
    expect(result.every(comment => comment.post_id === post1.id)).toBe(true);
    expect(result[0].content).toEqual('Comment on first post');
    expect(result[1].content).toEqual('Another comment on first post');
  });
});