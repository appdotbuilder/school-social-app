import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable } from '../db/schema';
import { type UpdatePostInput, type CreateUserInput, type CreatePostInput } from '../schema';
import { updatePost } from '../handlers/update_post';
import { eq } from 'drizzle-orm';

// Test user data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  class_name: 'Test Class',
  profile_picture_url: null,
  role: 'student'
};

// Test post data
const testPost: CreatePostInput = {
  title: 'Original Title',
  content: 'Original content for testing',
  media_url: null,
  media_type: null,
  type: 'text',
  author_id: 1, // Will be set after user creation
  is_pinned: false
};

describe('updatePost', () => {
  let userId: number;
  let postId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        name: testUser.name,
        class_name: testUser.class_name,
        profile_picture_url: testUser.profile_picture_url,
        role: testUser.role || 'student'
      })
      .returning()
      .execute();

    userId = userResult[0].id;

    // Create test post
    const postResult = await db.insert(postsTable)
      .values({
        title: testPost.title,
        content: testPost.content,
        media_url: testPost.media_url,
        media_type: testPost.media_type,
        type: testPost.type,
        author_id: userId,
        is_pinned: testPost.is_pinned || false
      })
      .returning()
      .execute();

    postId = postResult[0].id;
  });

  afterEach(resetDB);

  it('should update post title and content', async () => {
    const updateInput: UpdatePostInput = {
      id: postId,
      title: 'Updated Title',
      content: 'Updated content for testing'
    };

    const result = await updatePost(updateInput);

    expect(result.id).toEqual(postId);
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Updated content for testing');
    expect(result.author_id).toEqual(userId);
    expect(result.type).toEqual('text');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdatePostInput = {
      id: postId,
      title: 'Only Title Updated'
    };

    const result = await updatePost(updateInput);

    expect(result.title).toEqual('Only Title Updated');
    expect(result.content).toEqual('Original content for testing'); // Should remain unchanged
    expect(result.media_url).toBeNull();
    expect(result.is_pinned).toEqual(false);
  });

  it('should update media fields', async () => {
    const updateInput: UpdatePostInput = {
      id: postId,
      media_url: 'https://example.com/image.jpg',
      media_type: 'image/jpeg'
    };

    const result = await updatePost(updateInput);

    expect(result.media_url).toEqual('https://example.com/image.jpg');
    expect(result.media_type).toEqual('image/jpeg');
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.content).toEqual('Original content for testing'); // Should remain unchanged
  });

  it('should update pinned status', async () => {
    const updateInput: UpdatePostInput = {
      id: postId,
      is_pinned: true
    };

    const result = await updatePost(updateInput);

    expect(result.is_pinned).toEqual(true);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should set media fields to null', async () => {
    // First set some media data
    await db.update(postsTable)
      .set({
        media_url: 'https://example.com/old.jpg',
        media_type: 'image/jpeg'
      })
      .where(eq(postsTable.id, postId))
      .execute();

    const updateInput: UpdatePostInput = {
      id: postId,
      media_url: null,
      media_type: null
    };

    const result = await updatePost(updateInput);

    expect(result.media_url).toBeNull();
    expect(result.media_type).toBeNull();
  });

  it('should update all fields at once', async () => {
    const updateInput: UpdatePostInput = {
      id: postId,
      title: 'Completely Updated Title',
      content: 'Completely updated content',
      media_url: 'https://example.com/new-media.mp4',
      media_type: 'video/mp4',
      is_pinned: true
    };

    const result = await updatePost(updateInput);

    expect(result.title).toEqual('Completely Updated Title');
    expect(result.content).toEqual('Completely updated content');
    expect(result.media_url).toEqual('https://example.com/new-media.mp4');
    expect(result.media_type).toEqual('video/mp4');
    expect(result.is_pinned).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updates to database', async () => {
    const updateInput: UpdatePostInput = {
      id: postId,
      title: 'Database Update Test',
      content: 'Testing database persistence'
    };

    await updatePost(updateInput);

    // Verify changes were saved to database
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toEqual('Database Update Test');
    expect(posts[0].content).toEqual('Testing database persistence');
    expect(posts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    const originalPost = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    const originalUpdatedAt = originalPost[0].updated_at;

    // Wait a small moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdatePostInput = {
      id: postId,
      title: 'Timestamp Test'
    };

    const result = await updatePost(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error for non-existent post', async () => {
    const updateInput: UpdatePostInput = {
      id: 99999,
      title: 'This should fail'
    };

    await expect(updatePost(updateInput)).rejects.toThrow(/Post with id 99999 not found/i);
  });

  it('should preserve unchanged fields across multiple updates', async () => {
    // First update
    const firstUpdate: UpdatePostInput = {
      id: postId,
      title: 'First Update'
    };

    await updatePost(firstUpdate);

    // Second update - different field
    const secondUpdate: UpdatePostInput = {
      id: postId,
      is_pinned: true
    };

    const result = await updatePost(secondUpdate);

    expect(result.title).toEqual('First Update'); // Should be preserved from first update
    expect(result.is_pinned).toEqual(true); // Should be updated
    expect(result.content).toEqual('Original content for testing'); // Should remain original
  });
});