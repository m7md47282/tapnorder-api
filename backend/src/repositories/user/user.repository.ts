import { BaseRepository, IBaseRepository } from '../base.repository';
import { QueryFilter } from '../types';
import { User } from '../../entities/user.entity';

export interface IUserRepository extends IBaseRepository<User> {
  getByFirebaseUid(firebaseUid: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  upsertByFirebaseUid(
    firebaseUid: string,
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<User>;
}

export class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor() {
    super('users');
  }

  async getByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const filters: QueryFilter[] = [
      { field: 'firebaseUid', operator: '==', value: firebaseUid }
    ];
    return this.queryOne(filters);
  }

  async getByEmail(email: string): Promise<User | null> {
    const filters: QueryFilter[] = [
      { field: 'email', operator: '==', value: email }
    ];
    return this.queryOne(filters);
  }

  async upsertByFirebaseUid(
    firebaseUid: string,
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    const existingUser = await this.getByFirebaseUid(firebaseUid);

    if (existingUser) {
      await this.update(existingUser.id, data);
      const updatedUser = await this.getById(existingUser.id);
      if (!updatedUser) {
        throw new Error('Failed to update user record');
      }
      return updatedUser;
    }

    const newUserId = await this.create(data);
    const createdUser = await this.getById(newUserId);

    if (!createdUser) {
      throw new Error('Failed to create user record');
    }

    return createdUser;
  }
}

