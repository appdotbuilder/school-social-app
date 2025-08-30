import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetUserByIdInput, type User } from '../schema';

export async function getUserById(input: GetUserByIdInput): Promise<User | null> {
  try {
    // Query the database for the user by ID
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    // Return null if no user found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and only) user found
    const user = results[0];
    return user;
  } catch (error) {
    console.error('Get user by ID failed:', error);
    throw error;
  }
}