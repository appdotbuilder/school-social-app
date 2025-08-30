import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper to create a test user
const createTestUser = async (userData: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({
      username: userData.username,
      email: userData.email,
      name: userData.name,
      class_name: userData.class_name,
      profile_picture_url: userData.profile_picture_url,
      role: userData.role || 'student'
    })
    .returning()
    .execute();

  return result[0];
};

// Test data
const testUserData: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  class_name: 'Class A',
  profile_picture_url: 'https://example.com/avatar.jpg',
  role: 'student'
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a user with all fields', async () => {
    // Create test user
    const user = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: user.id,
      username: 'updateduser',
      email: 'updated@example.com',
      name: 'Updated User',
      class_name: 'Class B',
      profile_picture_url: 'https://example.com/new-avatar.jpg',
      role: 'admin',
      is_active: false
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(user.id);
    expect(result.username).toEqual('updateduser');
    expect(result.email).toEqual('updated@example.com');
    expect(result.name).toEqual('Updated User');
    expect(result.class_name).toEqual('Class B');
    expect(result.profile_picture_url).toEqual('https://example.com/new-avatar.jpg');
    expect(result.role).toEqual('admin');
    expect(result.is_active).toEqual(false);
    expect(result.created_at).toEqual(user.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(user.updated_at.getTime());
  });

  it('should update only specified fields', async () => {
    // Create test user
    const user = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: user.id,
      username: 'partialupdateuser',
      role: 'admin'
    };

    const result = await updateUser(updateInput);

    // Updated fields
    expect(result.username).toEqual('partialupdateuser');
    expect(result.role).toEqual('admin');

    // Unchanged fields
    expect(result.email).toEqual(user.email);
    expect(result.name).toEqual(user.name);
    expect(result.class_name).toEqual(user.class_name);
    expect(result.profile_picture_url).toEqual(user.profile_picture_url);
    expect(result.is_active).toEqual(user.is_active);
    expect(result.created_at).toEqual(user.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update profile_picture_url to null', async () => {
    // Create test user with profile picture
    const user = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: user.id,
      profile_picture_url: null
    };

    const result = await updateUser(updateInput);

    expect(result.profile_picture_url).toBeNull();
    expect(result.username).toEqual(user.username); // Other fields unchanged
  });

  it('should save updated user to database', async () => {
    // Create test user
    const user = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: user.id,
      name: 'Database Updated Name',
      is_active: false
    };

    await updateUser(updateInput);

    // Verify changes in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('Database Updated Name');
    expect(users[0].is_active).toEqual(false);
    expect(users[0].updated_at).toBeInstanceOf(Date);
    expect(users[0].updated_at.getTime()).toBeGreaterThan(user.updated_at.getTime());
  });

  it('should throw error when user does not exist', async () => {
    const updateInput: UpdateUserInput = {
      id: 999,
      name: 'Nonexistent User'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/User with id 999 not found/);
  });

  it('should handle username uniqueness constraint violation', async () => {
    // Create two test users
    const user1 = await createTestUser(testUserData);
    const user2Data = {
      ...testUserData,
      username: 'seconduser',
      email: 'second@example.com'
    };
    const user2 = await createTestUser(user2Data);

    // Try to update user2 with user1's username
    const updateInput: UpdateUserInput = {
      id: user2.id,
      username: user1.username
    };

    await expect(updateUser(updateInput)).rejects.toThrow();
  });

  it('should handle email uniqueness constraint violation', async () => {
    // Create two test users
    const user1 = await createTestUser(testUserData);
    const user2Data = {
      ...testUserData,
      username: 'seconduser',
      email: 'second@example.com'
    };
    const user2 = await createTestUser(user2Data);

    // Try to update user2 with user1's email
    const updateInput: UpdateUserInput = {
      id: user2.id,
      email: user1.email
    };

    await expect(updateUser(updateInput)).rejects.toThrow();
  });

  it('should update user role from student to admin', async () => {
    // Create student user
    const userData = { ...testUserData, role: 'student' as const };
    const user = await createTestUser(userData);

    const updateInput: UpdateUserInput = {
      id: user.id,
      role: 'admin'
    };

    const result = await updateUser(updateInput);

    expect(result.role).toEqual('admin');
    expect(result.username).toEqual(user.username); // Other fields unchanged
  });

  it('should deactivate user account', async () => {
    // Create active user
    const user = await createTestUser(testUserData);
    expect(user.is_active).toEqual(true);

    const updateInput: UpdateUserInput = {
      id: user.id,
      is_active: false
    };

    const result = await updateUser(updateInput);

    expect(result.is_active).toEqual(false);
  });
});