import { db } from '../db';
import { postsTable } from '../db/schema';
import { type GetPostByIdInput, type Post } from '../schema';
import { eq } from 'drizzle-orm';

export const getPostById = async (input: GetPostByIdInput): Promise<Post | null> => {
  try {
    const result = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const post = result[0];
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      media_url: post.media_url,
      media_type: post.media_type,
      type: post.type,
      author_id: post.author_id,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      is_pinned: post.is_pinned,
      created_at: post.created_at,
      updated_at: post.updated_at
    };
  } catch (error) {
    console.error('Get post by ID failed:', error);
    throw error;
  }
};