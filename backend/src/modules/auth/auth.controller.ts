import { Request, Response } from 'express';
import * as authService from './auth.service';
import { LoginInput, RefreshInput } from './auth.validator';
import { sendSuccess } from '../../shared/utils/api-response';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginInput;
  const result = await authService.login(email, password);
  sendSuccess(res, result, 'Login successful');
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as RefreshInput;
  const tokens = await authService.refresh(refreshToken);
  sendSuccess(res, tokens, 'Token refreshed successfully');
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as RefreshInput;
  await authService.logout(refreshToken);
  sendSuccess(res, null, 'Logged out successfully');
}
