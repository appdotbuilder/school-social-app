import { db } from '../db';
import { commentsTable, postsTable, usersTable } from '../db/schema';
import { type CreateCommentInput, type Comment } from '../schema';
import { eq } from 'drizzle-orm';

export const createComment = async (input: CreateCommentInput): Promise<Comment> => {
  try {
    // Verify that the post exists
    const post = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, input.post_id))
      .execute();

    if (post.length === 0) {
      throw new Error(`Post with id ${input.post_id} not found`);
    }

    // Verify that the author exists
    const author = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.author_id))
      .execute();

    if (author.length === 0) {
      throw new Error(`User with id ${input.author_id} not found`);
    }

    // Insert the comment
    const result = await db.insert(commentsTable)
      .values({
        content: input.content,
        post_id: input.post_id,
        author_id: input.author_id
      })
      .returning()
      .execute();

    // Update the post's comment count
    await db.update(postsTable)
      .set({
        comments_count: post[0].comments_count + 1,
        updated_at: new Date()
      })
      .where(eq(postsTable.id, input.post_id))
      .execute();

    return result[0];
  } catch (error) {
    console.error('Comment creation failed:', error);
    throw error;
  }
};