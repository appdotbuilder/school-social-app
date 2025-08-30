import { db } from '../db';
import { likesTable, postsTable } from '../db/schema';
import { type RemoveLikeInput } from '../schema';
import { eq, and, sql } from 'drizzle-orm';

export async function removeLike(input: RemoveLikeInput): Promise<{ success: boolean }> {
  try {
    // Check if the like exists before attempting to remove it
    const existingLike = await db.select()
      .from(likesTable)
      .where(
        and(
          eq(likesTable.post_id, input.post_id),
          eq(likesTable.user_id, input.user_id)
        )
      )
      .limit(1)
      .execute();

    if (existingLike.length === 0) {
      // Like doesn't exist, return success (idempotent operation)
      return { success: true };
    }

    // Delete the like
    await db.delete(likesTable)
      .where(
        and(
          eq(likesTable.post_id, input.post_id),
          eq(likesTable.user_id, input.user_id)
        )
      )
      .execute();

    // Update the post's like count by decrementing it
    await db.update(postsTable)
      .set({
        likes_count: sql`${postsTable.likes_count} - 1`,
        updated_at: new Date()
      })
      .where(eq(postsTable.id, input.post_id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Remove like failed:', error);
    throw error;
  }
}