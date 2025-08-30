import { db } from '../db';
import { commentsTable } from '../db/schema';
import { type GetCommentsByPostInput, type Comment } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getCommentsByPost = async (input: GetCommentsByPostInput): Promise<Comment[]> => {
  try {
    // Query comments for the specific post, ordered by creation date (oldest first)
    const results = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.post_id, input.post_id))
      .orderBy(asc(commentsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get comments by post:', error);
    throw error;
  }
};