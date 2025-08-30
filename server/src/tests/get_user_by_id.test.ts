import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type GetUserByIdInput, type CreateUserInput } from '../schema';
import { getUserById } from '../handlers/get_user_by_id';

// Test user input
const testUserInput: CreateUserInput = {
  username: 'testuser123',
  email: 'test@example.com',
  name: 'Test User',
  class_name: 'CS101',
  profile_picture_url: 'https://example.com/profile.jpg',
  role: 'student'
};

const testAdminInput: CreateUserInput = {
  username: 'admin123',
  email: 'admin@example.com',
  name: 'Admin User',
  class_name: 'ADMIN',
  profile_picture_url: null,
  role: 'admin'
};

describe('getUserById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when found', async () => {
    // Create a test user first
    const createResult = await db.insert(usersTable)
      .values({
        username: testUserInput.username,
        email: testUserInput.email,
        name: testUserInput.name,
        class_name: testUserInput.class_name,
        profile_picture_url: testUserInput.profile_picture_url,
        role: testUserInput.role || 'student'
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    // Test the handler
    const input: GetUserByIdInput = { id: createdUser.id };
    const result = await getUserById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.username).toEqual('testuser123');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.name).toEqual('Test User');
    expect(result!.class_name).toEqual('CS101');
    expect(result!.profile_picture_url).toEqual('https://example.com/profile.jpg');
    expect(result!.role).toEqual('student');
    expect(result!.is_active).toEqual(true); // Default value
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user not found', async () => {
    const input: GetUserByIdInput = { id: 999 };
    const result = await getUserById(input);

    expect(result).toBeNull();
  });

  it('should handle admin users correctly', async () => {
    // Create an admin user
    const createResult = await db.insert(usersTable)
      .values({
        username: testAdminInput.username,
        email: testAdminInput.email,
        name: testAdminInput.name,
        class_name: testAdminInput.class_name,
        profile_picture_url: testAdminInput.profile_picture_url,
        role: testAdminInput.role || 'student'
      })
      .returning()
      .execute();

    const createdAdmin = createResult[0];

    // Test the handler
    const input: GetUserByIdInput = { id: createdAdmin.id };
    const result = await getUserById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.role).toEqual('admin');
    expect(result!.profile_picture_url).toBeNull();
  });

  it('should handle inactive users correctly', async () => {
    // Create an inactive user
    const createResult = await db.insert(usersTable)
      .values({
        username: testUserInput.username,
        email: testUserInput.email,
        name: testUserInput.name,
        class_name: testUserInput.class_name,
        profile_picture_url: testUserInput.profile_picture_url,
        role: testUserInput.role || 'student',
        is_active: false
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    // Test the handler
    const input: GetUserByIdInput = { id: createdUser.id };
    const result = await getUserById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.is_active).toEqual(false);
    expect(result!.username).toEqual('testuser123');
  });

  it('should return correct user when multiple users exist', async () => {
    // Create multiple users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        name: 'User One',
        class_name: 'CS101',
        profile_picture_url: null,
        role: 'student'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        name: 'User Two',
        class_name: 'CS102',
        profile_picture_url: null,
        role: 'admin'
      })
      .returning()
      .execute();

    const user1 = user1Result[0];
    const user2 = user2Result[0];

    // Test retrieving the first user
    const input1: GetUserByIdInput = { id: user1.id };
    const result1 = await getUserById(input1);

    expect(result1).not.toBeNull();
    expect(result1!.id).toEqual(user1.id);
    expect(result1!.username).toEqual('user1');
    expect(result1!.role).toEqual('student');

    // Test retrieving the second user
    const input2: GetUserByIdInput = { id: user2.id };
    const result2 = await getUserById(input2);

    expect(result2).not.toBeNull();
    expect(result2!.id).toEqual(user2.id);
    expect(result2!.username).toEqual('user2');
    expect(result2!.role).toEqual('admin');
  });

  it('should handle database query correctly', async () => {
    // Create a test user
    const createResult = await db.insert(usersTable)
      .values({
        username: testUserInput.username,
        email: testUserInput.email,
        name: testUserInput.name,
        class_name: testUserInput.class_name,
        profile_picture_url: testUserInput.profile_picture_url,
        role: testUserInput.role || 'student'
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    // Test the handler
    const input: GetUserByIdInput = { id: createdUser.id };
    const result = await getUserById(input);

    // Verify all fields are properly retrieved
    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.username).toBe('string');
    expect(typeof result!.email).toBe('string');
    expect(typeof result!.name).toBe('string');
    expect(typeof result!.class_name).toBe('string');
    expect(typeof result!.is_active).toBe('boolean');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify enum fields
    expect(['student', 'admin']).toContain(result!.role);
  });
});