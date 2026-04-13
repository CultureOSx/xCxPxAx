import { FirebaseError } from 'firebase/app';

const AUTH_CANCEL_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'ERR_REQUEST_CANCELED',
  '-5',
]);

export function normalizeAuthEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isAuthCancellation(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';
  return AUTH_CANCEL_CODES.has(code);
}

export function mapFirebaseAuthError(error: unknown, fallback: string): string {
  if (isAuthCancellation(error)) return '';

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      default:
        return error.message || fallback;
    }
  }

  return fallback;
}
