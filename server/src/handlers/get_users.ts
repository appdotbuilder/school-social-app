import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getUsers = async (): Promise<User[]> => {
  try {
    const result = await db.select()
      .from(usersTable)
      .execute();

    return result.map(user => ({
      ...user,
      created_at: user.created_at || new Date(),
      updated_at: user.updated_at || new Date()
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};