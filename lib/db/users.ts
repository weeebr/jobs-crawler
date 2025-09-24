import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';
import type { User, NewUser } from './schema';

/**
 * Hash an API key using SHA-256 for secure user identification
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey.trim()).digest('hex');
}

/**
 * Get or create a user based on their API key hash
 */
export async function getOrCreateUser(apiKey: string): Promise<User> {
  const apiKeyHash = hashApiKey(apiKey);
  console.info('[db-users] looking for user with API key hash:', apiKeyHash.substring(0, 8) + '...');

  // Try to find existing user
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.apiKeyHash, apiKeyHash))
    .limit(1);

  console.info('[db-users] found', existingUser.length, 'users with this hash');

  if (existingUser.length > 0) {
    // Update last active time
    const user = existingUser[0];
    console.info('[db-users] returning existing user ID:', user.id);
    await db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, user.id));

    return user;
  }

  console.info('[db-users] creating new user for API key hash:', apiKeyHash.substring(0, 8) + '...');

  // Create new user
  const newUser: NewUser = {
    apiKeyHash,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    totalAnalyses: 0,
    preferredModel: 'gpt-4o-mini',
  };

  const result = await db.insert(users).values(newUser).returning();
  console.info('[db-users] created new user ID:', result[0].id);
  return result[0];
}

/**
 * Get user by API key hash
 */
export async function getUserByApiKey(apiKey: string): Promise<User | null> {
  const apiKeyHash = hashApiKey(apiKey);

  const result = await db
    .select()
    .from(users)
    .where(eq(users.apiKeyHash, apiKeyHash))
    .limit(1);

  return result[0] || null;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  apiKey: string,
  preferences: { preferredModel?: string; totalAnalyses?: number }
): Promise<User | null> {
  const user = await getUserByApiKey(apiKey);
  if (!user) return null;

  const result = await db
    .update(users)
    .set({
      ...preferences,
      lastActiveAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  return result[0] || null;
}

/**
 * Increment user's analysis count
 */
export async function incrementUserAnalysisCount(apiKey: string): Promise<void> {
  const user = await getUserByApiKey(apiKey);
  if (!user) return;

  await db
    .update(users)
    .set({
      totalAnalyses: user.totalAnalyses + 1,
      lastActiveAt: new Date(),
    })
    .where(eq(users.id, user.id));
}

/**
 * Get user statistics
 */
export async function getUserStats(apiKey: string) {
  const user = await getUserByApiKey(apiKey);
  if (!user) return null;

  // This would need to be implemented with proper queries
  // For now, return basic user info
  return {
    userId: user.id,
    totalAnalyses: user.totalAnalyses,
    memberSince: user.createdAt,
    lastActive: user.lastActiveAt,
    preferredModel: user.preferredModel,
  };
}

/**
 * Validate API key format (basic validation)
 */
export function isValidApiKey(apiKey: string): boolean {
  // Basic validation - OpenAI API keys start with 'sk-'
  return apiKey.trim().startsWith('sk-') && apiKey.trim().length > 20;
}

/**
 * Anonymize API key for logging (show only first/last few characters)
 */
export function anonymizeApiKey(apiKey: string): string {
  if (!isValidApiKey(apiKey)) return '[INVALID_KEY]';
  const key = apiKey.trim();
  return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
}
