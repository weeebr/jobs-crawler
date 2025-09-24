import { isBrowser } from "./clientStorage/types";
import { z } from "zod";

/**
 * Centralized localStorage operations with error handling
 */
export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  if (!isBrowser()) {
    return defaultValue;
  }
  
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    console.warn(`[storageUtils] failed to load ${key}:`, error);
    return defaultValue;
  }
}

export function safeLocalStorageSet<T>(key: string, value: T): boolean {
  if (!isBrowser()) {
    return false;
  }
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[storageUtils] failed to save ${key}:`, error);
    return false;
  }
}

export function safeLocalStorageRemove(key: string): boolean {
  if (!isBrowser()) {
    return false;
  }
  
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[storageUtils] failed to remove ${key}:`, error);
    return false;
  }
}

/**
 * Centralized data loading with schema validation
 */
export function loadDataWithValidation<T>(
  key: string,
  schema: z.ZodType<T>,
  defaultValue: T
): T {
  const raw = safeLocalStorageGet(key, null);
  if (!raw) return defaultValue;
  
  try {
    const validated = schema.parse(raw);
    return validated;
  } catch (error) {
    console.warn(`[storageUtils] validation failed for ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Centralized data persistence with validation
 */
export function saveDataWithValidation<T>(
  key: string,
  data: T,
  schema: z.ZodType<T>
): boolean {
  try {
    const validated = schema.parse(data);
    return safeLocalStorageSet(key, validated);
  } catch (error) {
    console.warn(`[storageUtils] validation failed before saving ${key}:`, error);
    return false;
  }
}
