import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, usersTable } from '../db/schema';
import { type CreatePostInput } from '../schema';
import { createPost } from '../handlers/create_post';
import { eq } from 'drizzle-orm';

describe('createPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test user
  const createTestUser = async (role: 'student' | 'admin' = 'student') => {
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'Class A',
        role: role
      })
      .returning()
      .execute();
    return result[0];
  };

  const testTextInput: CreatePostInput = {
    title: 'Test Post',
    content: 'This is a test post content',
    media_url: null,
    media_type: null,
    type: 'text',
    author_id: 1,
    is_pinned: false
  };

  it('should create a text post successfully', async () => {
    const user = await createTestUser();
    const input = { ...testTextInput, author_id: user.id };

    const result = await createPost(input);

    expect(result.title).toEqual('Test Post');
    expect(result.content).toEqual('This is a test post content');
    expect(result.media_url).toBeNull();
    expect(result.media_type).toBeNull();
    expect(result.type).toEqual('text');
    expect(result.author_id).toEqual(user.id);
    expect(result.likes_count).toEqual(0);
    expect(result.comments_count).toEqual(0);
    expect(result.is_pinned).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an image post with media URL', async () => {
    const user = await createTestUser();
    const input: CreatePostInput = {
      title: 'Image Post',
      content: 'Check out this image!',
      media_url: 'https://example.com/image.jpg',
      media_type: 'image/jpeg',
      type: 'image',
      author_id: user.id,
      is_pinned: false
    };

    const result = await createPost(input);

    expect(result.title).toEqual('Image Post');
    expect(result.content).toEqual('Check out this image!');
    expect(result.media_url).toEqual('https://example.com/image.jpg');
    expect(result.media_type).toEqual('image/jpeg');
    expect(result.type).toEqual('image');
  });

  it('should create a pinned post when specified', async () => {
    const user = await createTestUser();
    const input = { ...testTextInput, author_id: user.id, is_pinned: true };

    const result = await createPost(input);

    expect(result.is_pinned).toEqual(true);
  });

  it('should save post to database', async () => {
    const user = await createTestUser();
    const input = { ...testTextInput, author_id: user.id };

    const result = await createPost(input);

    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, result.id))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toEqual('Test Post');
    expect(posts[0].content).toEqual('This is a test post content');
    expect(posts[0].author_id).toEqual(user.id);
    expect(posts[0].type).toEqual('text');
    expect(posts[0].created_at).toBeInstanceOf(Date);
    expect(posts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should allow admin to create announcements', async () => {
    const adminUser = await createTestUser('admin');
    const input: CreatePostInput = {
      title: 'Important Announcement',
      content: 'This is an important school announcement',
      media_url: null,
      media_type: null,
      type: 'announcement',
      author_id: adminUser.id,
      is_pinned: true
    };

    const result = await createPost(input);

    expect(result.type).toEqual('announcement');
    expect(result.title).toEqual('Important Announcement');
    expect(result.is_pinned).toEqual(true);
  });

  it('should reject announcement creation by non-admin users', async () => {
    const studentUser = await createTestUser('student');
    const input: CreatePostInput = {
      title: 'Attempted Announcement',
      content: 'Student trying to create announcement',
      media_url: null,
      media_type: null,
      type: 'announcement',
      author_id: studentUser.id,
      is_pinned: false
    };

    await expect(createPost(input)).rejects.toThrow(/only admin users can create announcements/i);
  });

  it('should reject post creation with non-existent author', async () => {
    const input = { ...testTextInput, author_id: 9999 };

    await expect(createPost(input)).rejects.toThrow(/author with id 9999 not found/i);
  });

  it('should create video post successfully', async () => {
    const user = await createTestUser();
    const input: CreatePostInput = {
      title: 'Video Tutorial',
      content: 'Watch this educational video',
      media_url: 'https://example.com/video.mp4',
      media_type: 'video/mp4',
      type: 'video',
      author_id: user.id,
      is_pinned: false
    };

    const result = await createPost(input);

    expect(result.type).toEqual('video');
    expect(result.media_url).toEqual('https://example.com/video.mp4');
    expect(result.media_type).toEqual('video/mp4');
  });

  it('should handle optional is_pinned field correctly', async () => {
    const user = await createTestUser();
    const inputWithoutPinned: CreatePostInput = {
      title: 'Test Post',
      content: 'Test content',
      media_url: null,
      media_type: null,
      type: 'text',
      author_id: user.id
      // is_pinned is optional and not provided
    };

    const result = await createPost(inputWithoutPinned);

    expect(result.is_pinned).toEqual(false);
  });
});