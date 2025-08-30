import { db } from '../db';
import { postsTable } from '../db/schema';
import { type UpdatePostInput, type Post } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePost = async (input: UpdatePostInput): Promise<Post> => {
  try {
    // First check if the post exists
    const existingPost = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, input.id))
      .execute();

    if (existingPost.length === 0) {
      throw new Error(`Post with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    
    if (input.media_url !== undefined) {
      updateData.media_url = input.media_url;
    }
    
    if (input.media_type !== undefined) {
      updateData.media_type = input.media_type;
    }
    
    if (input.is_pinned !== undefined) {
      updateData.is_pinned = input.is_pinned;
    }

    // Update the post
    const result = await db.update(postsTable)
      .set(updateData)
      .where(eq(postsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Post update failed:', error);
    throw error;
  }
};