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

// OTP routes
router.post('/send-otp', validateBody(z.object({
  email: z.string().email(),
  type: z.string().optional().default('email_verification')
})), AuthController.sendOtp);

router.post('/verify-otp', validateBody(z.object({
  email: z.string().email(),
  code: z.string().length(6),
  type: z.string().optional().default('email_verification')
})), AuthController.verifyOtp);

export default router;