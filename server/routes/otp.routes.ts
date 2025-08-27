import { Router, Request, Response } from 'express';
import { validateBody } from '../middlewares';
import { catchAsync } from '../middlewares';
import { z } from 'zod';
import { smsService } from '../integrations';
import crypto from 'crypto';

const router = Router();

// In-memory store for OTP codes (in production, use Redis or database)
const otpStore = new Map<string, {
  code: string;
  phone: string;
  expires: Date;
  attempts: number;
  verified: boolean;
}>();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [key, otp] of Array.from(otpStore.entries())) {
    if (otp.expires < now) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Schema for sending OTP
const sendOTPSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{10,14}$/, 'Invalid phone number format'),
  purpose: z.enum(['login', 'registration', 'password_reset']).optional().default('login')
});

// Schema for verifying OTP
const verifyOTPSchema = z.object({
  phone: z.string(),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  otpId: z.string().optional()
});

// Generate 6-digit OTP code
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP code via SMS
router.post('/send', validateBody(sendOTPSchema), catchAsync(async (req: Request, res: Response) => {
  const { phone, purpose } = req.body;

  try {
    // Check if there's already an active OTP for this phone
    const existingOTP = Array.from(otpStore.values()).find(otp => 
      otp.phone === phone && otp.expires > new Date() && !otp.verified
    );

    if (existingOTP) {
      return res.status(429).json({
        success: false,
        error: 'OTP já enviado. Aguarde antes de solicitar um novo código.'
      });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otpId = crypto.randomUUID();
    const expiresIn = 5 * 60 * 1000; // 5 minutes
    
    // Store OTP
    otpStore.set(otpId, {
      code: otpCode,
      phone,
      expires: new Date(Date.now() + expiresIn),
      attempts: 0,
      verified: false
    });

    // Send SMS
    const smsSuccess = await smsService.sendOTPSMS(phone, otpCode);
    
    if (smsSuccess) {
      console.log(`📱 OTP sent successfully to ${phone}`);
      res.json({
        success: true,
        otpId,
        expiresIn,
        message: 'Código OTP enviado com sucesso'
      });
    } else {
      // Remove from store if SMS failed
      otpStore.delete(otpId);
      
      // In development, return the OTP code for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 [DEV] OTP code for ${phone}: ${otpCode}`);
        res.json({
          success: true,
          otpId,
          expiresIn,
          message: 'Código OTP enviado (modo desenvolvimento)',
          devCode: otpCode // Only in development
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Falha ao enviar SMS. Tente novamente.'
        });
      }
    }

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}));

// Verify OTP code
router.post('/verify', validateBody(verifyOTPSchema), catchAsync(async (req: Request, res: Response) => {
  const { phone, code, otpId } = req.body;

  try {
    // Find OTP by ID or phone
    let otpRecord;
    let recordKey;

    if (otpId && otpStore.has(otpId)) {
      otpRecord = otpStore.get(otpId);
      recordKey = otpId;
    } else {
      // Fallback: find by phone
      for (const [key, otp] of Array.from(otpStore.entries())) {
        if (otp.phone === phone && !otp.verified && otp.expires > new Date()) {
          otpRecord = otp;
          recordKey = key;
          break;
        }
      }
    }

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'Código OTP não encontrado ou expirado'
      });
    }

    // Check if expired
    if (otpRecord.expires < new Date()) {
      otpStore.delete(recordKey!);
      return res.status(400).json({
        success: false,
        error: 'Código OTP expirado'
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      otpStore.delete(recordKey!);
      return res.status(429).json({
        success: false,
        error: 'Muitas tentativas. Solicite um novo código.'
      });
    }

    // Verify code
    if (otpRecord.code !== code) {
      otpRecord.attempts += 1;
      return res.status(400).json({
        success: false,
        error: 'Código OTP inválido',
        attemptsRemaining: 3 - otpRecord.attempts
      });
    }

    // Success - mark as verified
    otpRecord.verified = true;
    console.log(`✅ OTP verified successfully for ${phone}`);

    // Generate temporary token for authenticated session
    const tempToken = crypto.randomBytes(32).toString('hex');
    
    res.json({
      success: true,
      message: 'Código OTP verificado com sucesso',
      tempToken, // Can be used for temporary authenticated operations
      phone: otpRecord.phone
    });

    // Clean up after some time
    setTimeout(() => {
      otpStore.delete(recordKey!);
    }, 30000); // 30 seconds

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}));

// Check OTP status
router.get('/status/:otpId', catchAsync(async (req: Request, res: Response) => {
  const { otpId } = req.params;

  const otpRecord = otpStore.get(otpId);
  
  if (!otpRecord) {
    return res.status(404).json({
      success: false,
      error: 'OTP não encontrado'
    });
  }

  const now = new Date();
  const timeRemaining = Math.max(0, Math.floor((otpRecord.expires.getTime() - now.getTime()) / 1000));

  res.json({
    success: true,
    status: {
      expired: otpRecord.expires < now,
      verified: otpRecord.verified,
      attempts: otpRecord.attempts,
      maxAttempts: 3,
      timeRemaining
    }
  });
}));

// Resend OTP (with rate limiting)
router.post('/resend', validateBody(z.object({
  phone: z.string(),
  otpId: z.string()
})), catchAsync(async (req: Request, res: Response) => {
  const { phone, otpId } = req.body;

  const otpRecord = otpStore.get(otpId);
  
  if (!otpRecord || otpRecord.phone !== phone) {
    return res.status(404).json({
      success: false,
      error: 'OTP não encontrado'
    });
  }

  // Check if minimum time has passed (60 seconds)
  const timeSinceCreated = Date.now() - (otpRecord.expires.getTime() - 5 * 60 * 1000);
  if (timeSinceCreated < 60000) {
    return res.status(429).json({
      success: false,
      error: 'Aguarde pelo menos 60 segundos antes de reenviar',
      waitTime: Math.ceil((60000 - timeSinceCreated) / 1000)
    });
  }

  // Generate new code and extend expiration
  const newCode = generateOTP();
  otpRecord.code = newCode;
  otpRecord.expires = new Date(Date.now() + 5 * 60 * 1000);
  otpRecord.attempts = 0;
  otpRecord.verified = false;

  // Send new SMS
  const smsSuccess = await smsService.sendOTPSMS(phone, newCode);
  
  if (smsSuccess || process.env.NODE_ENV === 'development') {
    console.log(`📱 OTP resent to ${phone}`);
    
    const response: any = {
      success: true,
      message: 'Código OTP reenviado com sucesso'
    };

    // In development, include the code
    if (process.env.NODE_ENV === 'development') {
      response.devCode = newCode;
    }

    res.json(response);
  } else {
    res.status(500).json({
      success: false,
      error: 'Falha ao reenviar SMS'
    });
  }
}));

export default router;