import { z } from 'zod';

// Validation schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().default('fallback-secret'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().default('noreply@tatuticket.com'),
  
  // SMS Configuration (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // Payment Configuration
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // AI Configuration
  OPENAI_API_KEY: z.string().optional(),
  
  // File Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  
  // External APIs
  SLACK_WEBHOOK_URL: z.string().optional(),
  TEAMS_WEBHOOK_URL: z.string().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

class AppConfig {
  private static instance: AppConfig;
  private config: EnvConfig;

  private constructor() {
    try {
      this.config = envSchema.parse(process.env);
    } catch (error) {
      console.error('❌ Invalid environment configuration:', error);
      throw new Error('Environment configuration validation failed');
    }
  }

  static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  // Server Configuration
  get server() {
    return {
      port: parseInt(this.config.PORT),
      env: this.config.NODE_ENV,
      isDevelopment: this.config.NODE_ENV === 'development',
      isProduction: this.config.NODE_ENV === 'production',
    };
  }

  // Database Configuration
  get database() {
    return {
      url: this.config.DATABASE_URL,
    };
  }

  // JWT Configuration
  get jwt() {
    return {
      secret: this.config.JWT_SECRET,
      expiresIn: this.config.JWT_EXPIRES_IN,
    };
  }

  // Email Configuration
  get email() {
    return {
      smtp: {
        host: this.config.SMTP_HOST,
        port: this.config.SMTP_PORT ? parseInt(this.config.SMTP_PORT) : undefined,
        user: this.config.SMTP_USER,
        pass: this.config.SMTP_PASS,
      },
      from: this.config.FROM_EMAIL,
      enabled: !!(this.config.SMTP_HOST && this.config.SMTP_USER && this.config.SMTP_PASS),
    };
  }

  // SMS Configuration
  get sms() {
    return {
      twilio: {
        accountSid: this.config.TWILIO_ACCOUNT_SID,
        authToken: this.config.TWILIO_AUTH_TOKEN,
        phoneNumber: this.config.TWILIO_PHONE_NUMBER,
      },
      enabled: !!(this.config.TWILIO_ACCOUNT_SID && this.config.TWILIO_AUTH_TOKEN),
    };
  }

  // Payment Configuration
  get payment() {
    return {
      stripe: {
        secretKey: this.config.STRIPE_SECRET_KEY,
        webhookSecret: this.config.STRIPE_WEBHOOK_SECRET,
      },
      enabled: !!this.config.STRIPE_SECRET_KEY,
    };
  }

  // AI Configuration
  get ai() {
    return {
      openai: {
        apiKey: this.config.OPENAI_API_KEY,
      },
      enabled: !!this.config.OPENAI_API_KEY,
    };
  }

  // File Storage Configuration
  get storage() {
    return {
      aws: {
        accessKeyId: this.config.AWS_ACCESS_KEY_ID,
        secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
        region: this.config.AWS_REGION,
        bucket: this.config.AWS_S3_BUCKET,
      },
      enabled: !!(this.config.AWS_ACCESS_KEY_ID && this.config.AWS_SECRET_ACCESS_KEY),
    };
  }

  // External Integrations
  get integrations() {
    return {
      slack: {
        webhookUrl: this.config.SLACK_WEBHOOK_URL,
        enabled: !!this.config.SLACK_WEBHOOK_URL,
      },
      teams: {
        webhookUrl: this.config.TEAMS_WEBHOOK_URL,
        enabled: !!this.config.TEAMS_WEBHOOK_URL,
      },
    };
  }
}

export const config = AppConfig.getInstance();