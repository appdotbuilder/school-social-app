import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
  });

  it('should return all users from database', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          username: 'student1',
          email: 'student1@example.com',
          name: 'John Doe',
          class_name: 'CS101',
          role: 'student'
        },
        {
          username: 'admin1',
          email: 'admin@example.com',
          name: 'Admin User',
          class_name: 'Staff',
          role: 'admin'
        },
        {
          username: 'student2',
          email: 'student2@example.com',
          name: 'Jane Smith',
          class_name: 'CS102',
          profile_picture_url: 'https://example.com/profile.jpg',
          role: 'student'
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Verify first user
    const student1 = result.find(u => u.username === 'student1');
    expect(student1).toBeDefined();
    expect(student1!.email).toEqual('student1@example.com');
    expect(student1!.name).toEqual('John Doe');
    expect(student1!.class_name).toEqual('CS101');
    expect(student1!.role).toEqual('student');
    expect(student1!.is_active).toBe(true);
    expect(student1!.profile_picture_url).toBeNull();
    expect(student1!.created_at).toBeInstanceOf(Date);
    expect(student1!.updated_at).toBeInstanceOf(Date);
    expect(student1!.id).toBeDefined();

    // Verify admin user
    const admin = result.find(u => u.username === 'admin1');
    expect(admin).toBeDefined();
    expect(admin!.role).toEqual('admin');
    expect(admin!.name).toEqual('Admin User');
    expect(admin!.class_name).toEqual('Staff');

    // Verify user with profile picture
    const student2 = result.find(u => u.username === 'student2');
    expect(student2).toBeDefined();
    expect(student2!.profile_picture_url).toEqual('https://example.com/profile.jpg');
    expect(student2!.name).toEqual('Jane Smith');
  });

  it('should include all required user fields', async () => {
    await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        class_name: 'TestClass',
        role: 'student',
        is_active: false
      })
      .execute();

    const result = await getUsers();
    
    expect(result).toHaveLength(1);
    
    const user = result[0];
    expect(user.id).toBeDefined();
    expect(user.username).toEqual('testuser');
    expect(user.email).toEqual('test@example.com');
    expect(user.name).toEqual('Test User');
    expect(user.class_name).toEqual('TestClass');
    expect(user.profile_picture_url).toBeNull();
    expect(user.role).toEqual('student');
    expect(user.is_active).toBe(false);
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('should return users in insertion order', async () => {
    const usernames = ['alice', 'bob', 'charlie'];
    
    for (let i = 0; i < usernames.length; i++) {
      await db.insert(usersTable)
        .values({
          username: usernames[i],
          email: `${usernames[i]}@example.com`,
          name: usernames[i].charAt(0).toUpperCase() + usernames[i].slice(1),
          class_name: 'CS101',
          role: 'student'
        })
        .execute();
    }

    const result = await getUsers();
    
    expect(result).toHaveLength(3);
    expect(result[0].username).toEqual('alice');
    expect(result[1].username).toEqual('bob');
    expect(result[2].username).toEqual('charlie');
  });

  it('should handle users with different active status', async () => {
    await db.insert(usersTable)
      .values([
        {
          username: 'active_user',
          email: 'active@example.com',
          name: 'Active User',
          class_name: 'CS101',
          role: 'student',
          is_active: true
        },
        {
          username: 'inactive_user',
          email: 'inactive@example.com',
          name: 'Inactive User',
          class_name: 'CS102',
          role: 'student',
          is_active: false
        }
      ])
      .execute();

    const result = await getUsers();
    
    expect(result).toHaveLength(2);
    
    const activeUser = result.find(u => u.username === 'active_user');
    const inactiveUser = result.find(u => u.username === 'inactive_user');
    
    expect(activeUser!.is_active).toBe(true);
    expect(inactiveUser!.is_active).toBe(false);
  });
});