/**
 * Firestore Service facade — CulturePassAU
 * 
 * This file is now a central re-exporting entry point for the modularized services.
 * Individual services have been split into their own files for better maintainability.
 */
// @ts-nocheck


// Re-export shared base types
export * from './base';

// Re-export individual services and their types
export * from './users';
export * from './events';
export * from './tickets';
export * from './profiles';
export * from './wallets';
export * from './notifications';
export * from './perks';
export * from './activities';
export * from './movies';
export * from './search';
export * from './misc';
