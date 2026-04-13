import { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { auth as firebaseAuth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  OAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { api } from '@/lib/api';
import * as AppleAuthentication from 'expo-apple-authentication';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import { captureEvent, identifyUser } from '@/lib/analytics';
import { HapticManager } from '@/lib/haptics';
import { mapFirebaseAuthError, normalizeAuthEmail } from '@/lib/authErrors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useSignup() {
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [role, setRole] = useState<'user' | 'organizer'>('user');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [globalError, setGlobalError] = useState('');

  const [loading, setLoading] = useState(false);

  const normalizedName = useMemo(() => name.trim().replace(/\s+/g, ' '), [name]);
  const normalizedEmail = useMemo(() => normalizeAuthEmail(email), [email]);

  const isValid = useMemo(() => {
    return normalizedName.length > 1 && EMAIL_RE.test(normalizedEmail) && password.length >= 6 && agreed;
  }, [normalizedName, normalizedEmail, password, agreed]);

  const clearErrors = useCallback(() => {
    if (nameError) setNameError('');
    if (emailError) setEmailError('');
    if (passwordError) setPasswordError('');
    if (globalError) setGlobalError('');
  }, [nameError, emailError, passwordError, globalError]);

  const validate = useCallback(() => {
    let valid = true;
    if (normalizedName.length < 2) {
      setNameError('Please enter your full name.');
      valid = false;
    }
    if (!normalizedEmail) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!EMAIL_RE.test(normalizedEmail)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }
    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    }
    if (!agreed) {
      setGlobalError('You must agree to the Terms of Service to continue.');
      valid = false;
    }
    return valid;
  }, [normalizedName, normalizedEmail, password, agreed]);

  const trackSignup = useCallback((method: string) => {
    const u = firebaseAuth.currentUser;
    if (u) {
      identifyUser(u.uid, { email: u.email, name: u.displayName, role });
      captureEvent('Signup Success', { method, role });
    }
  }, [role]);

  const finalizeSocialSignup = useCallback(async () => {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) return;
    const inferredDisplayName =
      currentUser.displayName?.trim() ||
      normalizedName ||
      currentUser.email?.split('@')[0] ||
      undefined;

    if (inferredDisplayName && inferredDisplayName !== currentUser.displayName) {
      await updateProfile(currentUser, { displayName: inferredDisplayName });
    }

    await currentUser.getIdToken(true);
    await api.auth.register({ displayName: inferredDisplayName, role });
  }, [normalizedName, role]);

  const handleGoogleSignUp = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    clearErrors();
    try {
      if (Platform.OS === 'web') {
        await setPersistence(firebaseAuth, browserLocalPersistence);
        const provider = new GoogleAuthProvider();
        await signInWithPopup(firebaseAuth, provider);
      } else {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });
        await GoogleSignin.hasPlayServices();
        await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();
        const credential = GoogleAuthProvider.credential(tokens.idToken);
        await signInWithCredential(firebaseAuth, credential);
      }
      try {
        await finalizeSocialSignup();
      } catch (syncError) {
        if (__DEV__) {
          console.warn('[signup] social profile sync fallback:', syncError);
        }
      }
      trackSignup('google');
      await HapticManager.success();
      router.replace(routeWithRedirect('/(onboarding)/location', redirectTo) as string);
    } catch (e: unknown) {
      const msg = mapFirebaseAuthError(e, 'Google sign-up failed. Please try again.');
      if (msg) {
        setGlobalError(msg);
        await HapticManager.error();
      }
    } finally {
      setLoading(false);
    }
  }, [clearErrors, finalizeSocialSignup, loading, trackSignup, redirectTo]);

  const handleAppleSignUp = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    if (loading) return;
    setLoading(true);
    clearErrors();
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken ?? '',
        rawNonce: credential.authorizationCode ?? '',
      });
      await signInWithCredential(firebaseAuth, firebaseCredential);
      try {
        await finalizeSocialSignup();
      } catch (syncError) {
        if (__DEV__) {
          console.warn('[signup] apple profile sync fallback:', syncError);
        }
      }
      trackSignup('apple');
      await HapticManager.success();
      router.replace(routeWithRedirect('/(onboarding)/location', redirectTo) as string);
    } catch (e: unknown) {
      const msg = mapFirebaseAuthError(e, 'Apple sign-up failed. Please try again.');
      if (msg) {
        setGlobalError(msg);
        await HapticManager.error();
      }
    } finally {
      setLoading(false);
    }
  }, [clearErrors, finalizeSocialSignup, loading, trackSignup, redirectTo]);

  const handleSignUp = useCallback(async () => {
    if (loading) return;
    clearErrors();
    if (!validate()) {
      await HapticManager.error();
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        await setPersistence(firebaseAuth, browserLocalPersistence);
      }
      const credential = await createUserWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
      await updateProfile(credential.user, { displayName: normalizedName });
      await credential.user.getIdToken(true);
      await api.auth.register({ displayName: normalizedName, role });

      identifyUser(credential.user.uid, { email: normalizedEmail, name: normalizedName, role });
      captureEvent('Signup Success', { method: 'email', role });

      await HapticManager.success();
      router.replace(routeWithRedirect('/(onboarding)/location', redirectTo) as string);
    } catch (e: unknown) {
      const msg = mapFirebaseAuthError(e, 'Registration failed. Please try again.');
      if (msg === 'An account with this email already exists.' || msg === 'Please enter a valid email address.') {
        setEmailError(msg);
      } else if (msg === 'Password must be at least 6 characters.') {
        setPasswordError(msg);
      } else {
        setGlobalError('Registration failed. Please try again.');
      }
      await HapticManager.error();
    } finally {
      setLoading(false);
    }
  }, [clearErrors, validate, normalizedEmail, password, normalizedName, role, redirectTo, loading]);

  return {
    name, setName,
    email, setEmail,
    password, setPassword,
    agreed, setAgreed,
    role, setRole,
    nameError,
    emailError,
    passwordError,
    globalError,
    loading,
    isValid,
    clearErrors,
    handleGoogleSignUp,
    handleAppleSignUp,
    handleSignUp,
    redirectTo
  };
}
