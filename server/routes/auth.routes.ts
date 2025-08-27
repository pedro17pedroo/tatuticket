import { Router } from 'express';
import { AuthController } from '../controllers';
import { validateBody } from '../middlewares';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Auth routes
router.post('/register', validateBody(insertUserSchema), AuthController.register);

router.post('/login', validateBody(z.object({
  email: z.string().email(),
  password: z.string().min(1)
})), AuthController.login);

router.get('/demo-credentials', AuthController.getDemoCredentials);

// OTP routes with SMS support
router.post('/send-otp', validateBody(z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  type: z.string().optional().default('email_verification'),
  method: z.enum(['email', 'sms']).optional().default('email')
})), AuthController.sendOtp);

router.post('/verify-otp', validateBody(z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  code: z.string().length(6),
  type: z.string().optional().default('email_verification')
})), AuthController.verifyOtp);

export default router;