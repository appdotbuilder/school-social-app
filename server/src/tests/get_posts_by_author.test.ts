import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable } from '../db/schema';
import { type GetPostsByAuthorInput } from '../schema';
import { getPostsByAuthor } from '../handlers/get_posts_by_author';

describe('getPostsByAuthor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return posts by specific author ordered by creation date (newest first)', async () => {
    // Create test users
    const usersResult = await db.insert(usersTable)
      .values([
        {
          username: 'author1',
          email: 'author1@test.com',
          name: 'Author One',
          class_name: '12A'
        },
        {
          username: 'author2',
          email: 'author2@test.com',
          name: 'Author Two',
          class_name: '12B'
        }
      ])
      .returning()
      .execute();

    const author1Id = usersResult[0].id;
    const author2Id = usersResult[1].id;

    // Create posts with specific timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    await db.insert(postsTable)
      .values([
        {
          title: 'First Post by Author1',
          content: 'Content of first post',
          type: 'text',
          author_id: author1Id,
          created_at: twoHoursAgo,
          updated_at: twoHoursAgo
        },
        {
          title: 'Post by Author2',
          content: 'Content by different author',
          type: 'text',
          author_id: author2Id,
          created_at: oneHourAgo,
          updated_at: oneHourAgo
        },
        {
          title: 'Second Post by Author1',
          content: 'Content of second post',
          type: 'announcement',
          author_id: author1Id,
          created_at: now,
          updated_at: now
        }
      ])
      .execute();

    const input: GetPostsByAuthorInput = {
      author_id: author1Id
    };

    const result = await getPostsByAuthor(input);

    // Should return only posts by author1, ordered by creation date (newest first)
    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Second Post by Author1');
    expect(result[0].author_id).toEqual(author1Id);
    expect(result[0].type).toEqual('announcement');
    
    expect(result[1].title).toEqual('First Post by Author1');
    expect(result[1].author_id).toEqual(author1Id);
    expect(result[1].type).toEqual('text');

    // Verify ordering (newest first)
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should return empty array when author has no posts', async () => {
    // Create a user with no posts
    const userResult = await db.insert(usersTable)
      .values({
        username: 'nopostauthor',
        email: 'nopost@test.com',
        name: 'No Post Author',
        class_name: '11A'
      })
      .returning()
      .execute();

    const input: GetPostsByAuthorInput = {
      author_id: userResult[0].id
    };

    const result = await getPostsByAuthor(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent author', async () => {
    const input: GetPostsByAuthorInput = {
      author_id: 99999 // Non-existent author ID
    };

    const result = await getPostsByAuthor(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all post fields correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'test@test.com',
        name: 'Test Author',
        class_name: '10A'
      })
      .returning()
      .execute();

    const authorId = userResult[0].id;

    // Create a post with all possible fields
    await db.insert(postsTable)
      .values({
        title: 'Complete Post',
        content: 'This post has all fields populated',
        media_url: 'https://example.com/image.jpg',
        media_type: 'image/jpeg',
        type: 'image',
        author_id: authorId,
        likes_count: 5,
        comments_count: 3,
        is_pinned: true
      })
      .execute();

    const input: GetPostsByAuthorInput = {
      author_id: authorId
    };

    const result = await getPostsByAuthor(input);

    expect(result).toHaveLength(1);
    const post = result[0];

    // Verify all fields are present and correct
    expect(post.id).toBeDefined();
    expect(post.title).toEqual('Complete Post');
    expect(post.content).toEqual('This post has all fields populated');
    expect(post.media_url).toEqual('https://example.com/image.jpg');
    expect(post.media_type).toEqual('image/jpeg');
    expect(post.type).toEqual('image');
    expect(post.author_id).toEqual(authorId);
    expect(post.likes_count).toEqual(5);
    expect(post.comments_count).toEqual(3);
    expect(post.is_pinned).toEqual(true);
    expect(post.created_at).toBeInstanceOf(Date);
    expect(post.updated_at).toBeInstanceOf(Date);
  });

  it('should handle posts with null media fields', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'textauthor',
        email: 'textauthor@test.com',
        name: 'Text Author',
        class_name: '9A'
      })
      .returning()
      .execute();

    const authorId = userResult[0].id;

    // Create a text post with null media fields
    await db.insert(postsTable)
      .values({
        title: 'Text Only Post',
        content: 'This is a text-only post',
        media_url: null,
        media_type: null,
        type: 'text',
        author_id: authorId
      })
      .execute();

    const input: GetPostsByAuthorInput = {
      author_id: authorId
    };

    const result = await getPostsByAuthor(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Text Only Post');
    expect(result[0].media_url).toBeNull();
    expect(result[0].media_type).toBeNull();
    expect(result[0].type).toEqual('text');
  });

  it('should return posts in correct chronological order for multiple posts', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'prolificauthor',
        email: 'prolific@test.com',
        name: 'Prolific Author',
        class_name: '12C'
      })
      .returning()
      .execute();

    const authorId = userResult[0].id;

    // Create 5 posts with different timestamps
    const timestamps = [
      new Date('2024-01-01T10:00:00Z'),
      new Date('2024-01-01T12:00:00Z'),
      new Date('2024-01-01T08:00:00Z'),
      new Date('2024-01-01T15:00:00Z'),
      new Date('2024-01-01T11:00:00Z')
    ];

    const postsData = timestamps.map((timestamp, index) => ({
      title: `Post ${index + 1}`,
      content: `Content for post ${index + 1}`,
      type: 'text' as const,
      author_id: authorId,
      created_at: timestamp,
      updated_at: timestamp
    }));

    await db.insert(postsTable)
      .values(postsData)
      .execute();

    const input: GetPostsByAuthorInput = {
      author_id: authorId
    };

    const result = await getPostsByAuthor(input);

    expect(result).toHaveLength(5);

    // Verify posts are ordered by creation date (newest first)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }

    // Verify the actual order
    expect(result[0].title).toEqual('Post 4'); // 15:00
    expect(result[1].title).toEqual('Post 2'); // 12:00
    expect(result[2].title).toEqual('Post 5'); // 11:00
    expect(result[3].title).toEqual('Post 1'); // 10:00
    expect(result[4].title).toEqual('Post 3'); // 08:00
  });
});