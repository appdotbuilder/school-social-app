import { db } from '../db';
import { postsTable } from '../db/schema';
import { type GetPostsByAuthorInput, type Post } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getPostsByAuthor(input: GetPostsByAuthorInput): Promise<Post[]> {
  try {
    const result = await db.select()
      .from(postsTable)
      .where(eq(postsTable.author_id, input.author_id))
      .orderBy(desc(postsTable.created_at))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to get posts by author:', error);
    throw error;
  }
}