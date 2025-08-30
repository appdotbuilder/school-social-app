import { db } from '../db';
import { postsTable } from '../db/schema';
import { type Post } from '../schema';
import { desc, asc } from 'drizzle-orm';

export const getPosts = async (): Promise<Post[]> => {
  try {
    // Fetch all posts ordered by:
    // 1. Pinned status (pinned posts first) - descending so true comes before false
    // 2. Creation date (newest first) - descending
    const results = await db.select()
      .from(postsTable)
      .orderBy(desc(postsTable.is_pinned), desc(postsTable.created_at))
      .execute();

    // Return results as they match the Post schema exactly
    return results;
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    throw error;
  }
};