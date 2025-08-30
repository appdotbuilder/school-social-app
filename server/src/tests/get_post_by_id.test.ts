import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable } from '../db/schema';
import { type GetPostByIdInput } from '../schema';
import { getPostById } from '../handlers/get_post_by_id';

describe('getPostById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a post when it exists', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: '10A',
        role: 'student'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a test post
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Test Post',
        content: 'This is a test post content',
        media_url: 'https://example.com/media.jpg',
        media_type: 'image',
        type: 'image',
        author_id: user.id,
        likes_count: 5,
        comments_count: 3,
        is_pinned: true
      })
      .returning()
      .execute();

    const createdPost = postResult[0];

    // Test the handler
    const input: GetPostByIdInput = {
      id: createdPost.id
    };

    const result = await getPostById(input);

    // Verify all fields are returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPost.id);
    expect(result!.title).toEqual('Test Post');
    expect(result!.content).toEqual('This is a test post content');
    expect(result!.media_url).toEqual('https://example.com/media.jpg');
    expect(result!.media_type).toEqual('image');
    expect(result!.type).toEqual('image');
    expect(result!.author_id).toEqual(user.id);
    expect(result!.likes_count).toEqual(5);
    expect(result!.comments_count).toEqual(3);
    expect(result!.is_pinned).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when post does not exist', async () => {
    const input: GetPostByIdInput = {
      id: 999999 // Non-existent ID
    };

    const result = await getPostById(input);

    expect(result).toBeNull();
  });

  it('should return post with minimal data (nulls and defaults)', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com',
        name: 'Test User 2',
        class_name: '10B',
        role: 'student'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a post with minimal data (nulls and default values)
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Minimal Post',
        content: 'Basic content',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: user.id
        // likes_count, comments_count, is_pinned will use defaults
      })
      .returning()
      .execute();

    const createdPost = postResult[0];

    // Test the handler
    const input: GetPostByIdInput = {
      id: createdPost.id
    };

    const result = await getPostById(input);

    // Verify defaults and nulls are handled correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPost.id);
    expect(result!.title).toEqual('Minimal Post');
    expect(result!.content).toEqual('Basic content');
    expect(result!.media_url).toBeNull();
    expect(result!.media_type).toBeNull();
    expect(result!.type).toEqual('text');
    expect(result!.author_id).toEqual(user.id);
    expect(result!.likes_count).toEqual(0); // Default value
    expect(result!.comments_count).toEqual(0); // Default value
    expect(result!.is_pinned).toEqual(false); // Default value
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different post types correctly', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'admin_user',
        email: 'admin@example.com',
        name: 'Admin User',
        class_name: 'Staff',
        role: 'admin'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create an announcement post
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Important Announcement',
        content: 'This is an important announcement for all students',
        type: 'announcement',
        author_id: user.id,
        is_pinned: true
      })
      .returning()
      .execute();

    const createdPost = postResult[0];

    // Test the handler
    const input: GetPostByIdInput = {
      id: createdPost.id
    };

    const result = await getPostById(input);

    // Verify announcement type is handled correctly
    expect(result).not.toBeNull();
    expect(result!.type).toEqual('announcement');
    expect(result!.title).toEqual('Important Announcement');
    expect(result!.is_pinned).toEqual(true);
    expect(result!.author_id).toEqual(user.id);
  });
});