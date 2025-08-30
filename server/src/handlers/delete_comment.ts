import { db } from '../db';
import { commentsTable, postsTable, usersTable } from '../db/schema';
import { type DeleteCommentInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteComment(input: DeleteCommentInput): Promise<{ success: boolean }> {
  try {
    // First, get the comment to validate it exists and get author info
    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, input.id))
      .execute();

    if (comments.length === 0) {
      throw new Error('Comment not found');
    }

    const comment = comments[0];

    // Get the post to update the comment count
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, comment.post_id))
      .execute();

    if (posts.length === 0) {
      throw new Error('Associated post not found');
    }

    const post = posts[0];

    // Delete the comment
    await db.delete(commentsTable)
      .where(eq(commentsTable.id, input.id))
      .execute();

    // Update the post's comment count (decrement by 1)
    const newCommentCount = Math.max(0, post.comments_count - 1);
    await db.update(postsTable)
      .set({ 
        comments_count: newCommentCount,
        updated_at: new Date()
      })
      .where(eq(postsTable.id, comment.post_id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Comment deletion failed:', error);
    throw error;
  }
}