import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { users } from '../models/users.js';
import { config } from '../config/index.js';
import { AppError } from '../middlewares/error-handler.js';
import { eq } from 'drizzle-orm';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private generateTokens(userId: string, email: string, name: string): AuthTokens {
    const payload = { id: userId, email, name };
    
    const accessToken = (jwt.sign as any)(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });
    
    const refreshToken = (jwt.sign as any)(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN
    });
    
    return { accessToken, refreshToken };
  }

  async register(credentials: RegisterCredentials) {
    const { email, password, name, phone, address } = credentials;
    
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      throw new AppError('User already exists with this email', 400);
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = await db.insert(users).values({
      id: uuidv4(),
      email,
      name,
      phone: phone ?? null,
      address: address ?? null,
      hashedPassword
    }).returning();
    
    const user = newUser[0];
    if (!user) {
      throw new AppError('Failed to create user', 500);
    }
    
    const tokens = this.generateTokens(user.id, user.email, user.name);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      ...tokens
    };
  }

  async login(credentials: LoginCredentials) {
    const { email, password } = credentials;
    
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }
    
    const user = existingUser[0];
    if (!user || !user.hashedPassword) {
      throw new AppError('Invalid email or password', 401);
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }
    
    const tokens = this.generateTokens(user.id, user.email, user.name);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      ...tokens
    };
  }

  async getUserById(userId: string) {
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (existingUser.length === 0) {
      throw new AppError('User not found', 404);
    }
    
    const user = existingUser[0]!;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

export const authService = new AuthService(); 