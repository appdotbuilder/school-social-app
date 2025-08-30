import { db } from '../db';
import { usersTable, postsTable, commentsTable, likesTable } from '../db/schema';
import { type DeleteUserInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteUser(input: DeleteUserInput): Promise<{ success: boolean }> {
  try {
    // Check if user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with ID ${input.id} not found`);
    }

    // Delete user's likes first (no cascading foreign key constraints)
    await db.delete(likesTable)
      .where(eq(likesTable.user_id, input.id))
      .execute();

    // Delete user's comments (no cascading foreign key constraints for author)
    await db.delete(commentsTable)
      .where(eq(commentsTable.author_id, input.id))
      .execute();

    // Delete user's posts (this will cascade delete associated comments and likes)
    await db.delete(postsTable)
      .where(eq(postsTable.author_id, input.id))
      .execute();

    // Finally, delete the user
    await db.delete(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
}