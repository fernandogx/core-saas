import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export class HashUtil {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateApiKey(): string {
    const randomPart = crypto.randomBytes(32).toString('hex');
    return `core_sk_${randomPart}`;
  }

  static hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }
}