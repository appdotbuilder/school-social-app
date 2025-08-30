import { db } from '../db';
import { postsTable, usersTable } from '../db/schema';
import { type CreatePostInput, type Post } from '../schema';
import { eq } from 'drizzle-orm';

export const createPost = async (input: CreatePostInput): Promise<Post> => {
  try {
    // First, verify the author exists and get their role for announcement validation
    const author = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.author_id))
      .execute();

    if (!author.length) {
      throw new Error(`Author with id ${input.author_id} not found`);
    }

    // Check if user is trying to create an announcement without admin role
    if (input.type === 'announcement' && author[0].role !== 'admin') {
      throw new Error('Only admin users can create announcements');
    }

    // Insert the post
    const result = await db.insert(postsTable)
      .values({
        title: input.title,
        content: input.content,
        media_url: input.media_url,
        media_type: input.media_type,
        type: input.type,
        author_id: input.author_id,
        is_pinned: input.is_pinned ?? false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Post creation failed:', error);
    throw error;
  }
};