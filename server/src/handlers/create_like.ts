import { db } from '../db';
import { likesTable, postsTable } from '../db/schema';
import { type CreateLikeInput, type Like } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createLike = async (input: CreateLikeInput): Promise<Like> => {
  try {
    // Check if the post exists
    const existingPost = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, input.post_id))
      .execute();

    if (existingPost.length === 0) {
      throw new Error(`Post with id ${input.post_id} does not exist`);
    }

    // Check if the user has already liked this post
    const existingLike = await db.select()
      .from(likesTable)
      .where(and(
        eq(likesTable.post_id, input.post_id),
        eq(likesTable.user_id, input.user_id)
      ))
      .execute();

    if (existingLike.length > 0) {
      throw new Error('User has already liked this post');
    }

    // Create the like record
    const result = await db.insert(likesTable)
      .values({
        post_id: input.post_id,
        user_id: input.user_id
      })
      .returning()
      .execute();

    // Update the post's like count
    await db.update(postsTable)
      .set({
        likes_count: existingPost[0].likes_count + 1,
        updated_at: new Date()
      })
      .where(eq(postsTable.id, input.post_id))
      .execute();

    return result[0];
  } catch (error) {
    console.error('Like creation failed:', error);
    throw error;
  }
};