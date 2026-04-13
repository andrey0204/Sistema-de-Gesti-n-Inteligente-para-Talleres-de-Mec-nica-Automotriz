import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../shared/utils/app-error';

interface TokenPayload {
  id: number;
  email: string;
  role: Role;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginResponse extends AuthTokens {
  user: {
    id: number;
    email: string;
    fullName: string;
    role: Role;
  };
}

function parseExpirationToSeconds(expiration: string): number {
  const match = expiration.match(/^(\d+)([dhms])$/);
  if (!match) throw new Error(`Invalid expiration format: ${expiration}`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { d: 86400, h: 3600, m: 60, s: 1 };
  return value * multipliers[unit];
}

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: parseExpirationToSeconds(env.JWT_ACCESS_EXPIRATION),
  });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

function getRefreshTokenExpiry(): Date {
  const match = env.JWT_REFRESH_EXPIRATION.match(/^(\d+)([dhms])$/);
  if (!match) throw new Error('Invalid JWT_REFRESH_EXPIRATION format');

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms = { d: 86400000, h: 3600000, m: 60000, s: 1000 }[unit]!;

  return new Date(Date.now() + value * ms);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.deletedAt) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const tokenPayload: TokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored) {
    throw AppError.unauthorized('Invalid refresh token');
  }

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw AppError.unauthorized('Refresh token has expired');
  }

  if (stored.user.deletedAt) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw AppError.unauthorized('User account is deactivated');
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const tokenPayload: TokenPayload = {
    id: stored.user.id,
    email: stored.user.email,
    role: stored.user.role,
  };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: stored.user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string): Promise<void> {
  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

  if (stored) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
  }
}
