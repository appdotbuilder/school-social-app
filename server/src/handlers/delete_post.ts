import { db } from '../db';
import { postsTable, usersTable } from '../db/schema';
import { type DeletePostInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deletePost(input: DeletePostInput): Promise<{ success: boolean }> {
  try {
    // First, verify the post exists and get its author_id
    const existingPost = await db.select({
      id: postsTable.id,
      author_id: postsTable.author_id
    })
      .from(postsTable)
      .where(eq(postsTable.id, input.id))
      .execute();

    if (existingPost.length === 0) {
      throw new Error(`Post with id ${input.id} not found`);
    }

    // Delete the post - associated comments and likes will be deleted automatically
    // due to CASCADE foreign key constraints defined in the schema
    const result = await db.delete(postsTable)
      .where(eq(postsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Post deletion failed:', error);
    throw error;
  }
}