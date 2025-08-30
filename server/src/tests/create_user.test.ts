import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateUserInput = {
  username: 'testuser123',
  email: 'test@example.com',
  name: 'Test User',
  class_name: '10A',
  profile_picture_url: 'https://example.com/avatar.jpg',
  role: 'student'
};

const adminInput: CreateUserInput = {
  username: 'adminuser',
  email: 'admin@example.com',
  name: 'Admin User',
  class_name: '12B',
  profile_picture_url: null,
  role: 'admin'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with student role', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser123');
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.class_name).toEqual('10A');
    expect(result.profile_picture_url).toEqual('https://example.com/avatar.jpg');
    expect(result.role).toEqual('student');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user with admin role', async () => {
    const result = await createUser(adminInput);

    expect(result.username).toEqual('adminuser');
    expect(result.email).toEqual('admin@example.com');
    expect(result.name).toEqual('Admin User');
    expect(result.class_name).toEqual('12B');
    expect(result.profile_picture_url).toBeNull();
    expect(result.role).toEqual('admin');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should default to student role when role is not specified', async () => {
    const inputWithoutRole: CreateUserInput = {
      username: 'defaultuser',
      email: 'default@example.com',
      name: 'Default User',
      class_name: '9C',
      profile_picture_url: null
    };

    const result = await createUser(inputWithoutRole);

    expect(result.role).toEqual('student');
    expect(result.username).toEqual('defaultuser');
    expect(result.email).toEqual('default@example.com');
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser123');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].class_name).toEqual('10A');
    expect(users[0].profile_picture_url).toEqual('https://example.com/avatar.jpg');
    expect(users[0].role).toEqual('student');
    expect(users[0].is_active).toEqual(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null profile picture URL', async () => {
    const inputWithNullAvatar: CreateUserInput = {
      username: 'noavatar',
      email: 'noavatar@example.com',
      name: 'No Avatar User',
      class_name: '11D',
      profile_picture_url: null,
      role: 'student'
    };

    const result = await createUser(inputWithNullAvatar);

    expect(result.profile_picture_url).toBeNull();
    expect(result.username).toEqual('noavatar');
    
    // Verify in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users[0].profile_picture_url).toBeNull();
  });

  it('should throw error for duplicate username', async () => {
    // Create first user
    await createUser(testInput);

    // Attempt to create user with same username
    const duplicateInput: CreateUserInput = {
      username: 'testuser123', // Same username
      email: 'different@example.com',
      name: 'Different User',
      class_name: '11A',
      profile_picture_url: null,
      role: 'student'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate/i);
  });

  it('should throw error for duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Attempt to create user with same email
    const duplicateInput: CreateUserInput = {
      username: 'differentuser',
      email: 'test@example.com', // Same email
      name: 'Different User',
      class_name: '11A',
      profile_picture_url: null,
      role: 'student'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate/i);
  });

  it('should create multiple users with unique usernames and emails', async () => {
    const user1 = await createUser(testInput);
    const user2 = await createUser(adminInput);

    expect(user1.id).not.toEqual(user2.id);
    expect(user1.username).toEqual('testuser123');
    expect(user2.username).toEqual('adminuser');
    expect(user1.role).toEqual('student');
    expect(user2.role).toEqual('admin');

    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });
});