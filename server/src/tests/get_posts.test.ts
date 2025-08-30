import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable } from '../db/schema';
import { getPosts } from '../handlers/get_posts';

describe('getPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no posts exist', async () => {
    const result = await getPosts();
    expect(result).toEqual([]);
  });

  it('should return posts ordered by creation date (newest first)', async () => {
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

    // Create posts with different creation times
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    await db.insert(postsTable)
      .values([
        {
          title: 'First Post',
          content: 'This was posted first',
          type: 'text',
          author_id: user.id,
          created_at: twoHoursAgo,
          updated_at: twoHoursAgo
        },
        {
          title: 'Second Post',
          content: 'This was posted second',
          type: 'text',
          author_id: user.id,
          created_at: oneHourAgo,
          updated_at: oneHourAgo
        },
        {
          title: 'Third Post',
          content: 'This was posted most recently',
          type: 'text',
          author_id: user.id,
          created_at: now,
          updated_at: now
        }
      ])
      .execute();

    const result = await getPosts();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Third Post');
    expect(result[1].title).toEqual('Second Post');
    expect(result[2].title).toEqual('First Post');
  });

  it('should return pinned posts first, then regular posts by creation date', async () => {
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

    // Create posts with different pinned status and creation times
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    await db.insert(postsTable)
      .values([
        {
          title: 'Regular Post - Newest',
          content: 'Regular post created most recently',
          type: 'text',
          author_id: user.id,
          is_pinned: false,
          created_at: now,
          updated_at: now
        },
        {
          title: 'Pinned Post - Older',
          content: 'Pinned post created earlier',
          type: 'announcement',
          author_id: user.id,
          is_pinned: true,
          created_at: twoHoursAgo,
          updated_at: twoHoursAgo
        },
        {
          title: 'Regular Post - Middle',
          content: 'Regular post created in middle',
          type: 'text',
          author_id: user.id,
          is_pinned: false,
          created_at: oneHourAgo,
          updated_at: oneHourAgo
        },
        {
          title: 'Pinned Post - Newer',
          content: 'Pinned post created more recently',
          type: 'announcement',
          author_id: user.id,
          is_pinned: true,
          created_at: oneHourAgo,
          updated_at: oneHourAgo
        }
      ])
      .execute();

    const result = await getPosts();

    expect(result).toHaveLength(4);

    // First two should be pinned posts, ordered by creation date (newest first)
    expect(result[0].title).toEqual('Pinned Post - Newer');
    expect(result[0].is_pinned).toBe(true);
    expect(result[1].title).toEqual('Pinned Post - Older');
    expect(result[1].is_pinned).toBe(true);

    // Next two should be regular posts, ordered by creation date (newest first)
    expect(result[2].title).toEqual('Regular Post - Newest');
    expect(result[2].is_pinned).toBe(false);
    expect(result[3].title).toEqual('Regular Post - Middle');
    expect(result[3].is_pinned).toBe(false);
  });

  it('should return posts with all required fields', async () => {
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

    // Create test post with all fields
    await db.insert(postsTable)
      .values({
        title: 'Test Post',
        content: 'This is test content',
        media_url: 'https://example.com/image.jpg',
        media_type: 'image/jpeg',
        type: 'image',
        author_id: user.id,
        likes_count: 5,
        comments_count: 3,
        is_pinned: true
      })
      .execute();

    const result = await getPosts();

    expect(result).toHaveLength(1);
    const post = result[0];

    expect(post.id).toBeDefined();
    expect(post.title).toEqual('Test Post');
    expect(post.content).toEqual('This is test content');
    expect(post.media_url).toEqual('https://example.com/image.jpg');
    expect(post.media_type).toEqual('image/jpeg');
    expect(post.type).toEqual('image');
    expect(post.author_id).toEqual(user.id);
    expect(post.likes_count).toEqual(5);
    expect(post.comments_count).toEqual(3);
    expect(post.is_pinned).toBe(true);
    expect(post.created_at).toBeInstanceOf(Date);
    expect(post.updated_at).toBeInstanceOf(Date);
  });

  it('should handle posts with different types', async () => {
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

    // Create posts with different types
    await db.insert(postsTable)
      .values([
        {
          title: 'Text Post',
          content: 'Just text content',
          type: 'text',
          author_id: user.id
        },
        {
          title: 'Image Post',
          content: 'Post with image',
          media_url: 'https://example.com/image.jpg',
          media_type: 'image/jpeg',
          type: 'image',
          author_id: user.id
        },
        {
          title: 'Video Post',
          content: 'Post with video',
          media_url: 'https://example.com/video.mp4',
          media_type: 'video/mp4',
          type: 'video',
          author_id: user.id
        },
        {
          title: 'Announcement',
          content: 'Important announcement',
          type: 'announcement',
          author_id: user.id,
          is_pinned: true
        }
      ])
      .execute();

    const result = await getPosts();

    expect(result).toHaveLength(4);

    // Check that all post types are returned
    const postTypes = result.map(post => post.type);
    expect(postTypes).toContain('text');
    expect(postTypes).toContain('image');
    expect(postTypes).toContain('video');
    expect(postTypes).toContain('announcement');

    // Announcement should be first (pinned)
    expect(result[0].type).toEqual('announcement');
    expect(result[0].is_pinned).toBe(true);
  });
});