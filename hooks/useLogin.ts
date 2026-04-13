import { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { auth as firebaseAuth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  OAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { routeWithRedirect } from '@/lib/routes';
import { captureEvent, identifyUser } from '@/lib/analytics';
import { mapFirebaseAuthError, normalizeAuthEmail } from '@/lib/authErrors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useLogin(redirectTo: string | null) {
  const { state: onboardingState } = useOnboarding();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const normalizedEmail = useMemo(() => normalizeAuthEmail(email), [email]);

  const isValid = useMemo(
    () => EMAIL_RE.test(normalizedEmail) && password.length >= 6,
    [normalizedEmail, password],
  );

  const validate = useCallback(() => {
    let valid = true;
    if (!normalizedEmail) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!EMAIL_RE.test(normalizedEmail)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    } else {
      setEmailError('');
    }
    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  }, [normalizedEmail, password]);

  const clearErrors = useCallback(() => {
    if (emailError) setEmailError('');
    if (passwordError) setPasswordError('');
    if (globalError) setGlobalError('');
  }, [emailError, passwordError, globalError]);

  const postAuthRoute = useCallback(() => {
    if (!onboardingState.isComplete) {
      router.replace(routeWithRedirect('/(onboarding)/location', redirectTo) as string);
      return;
    }
    if (redirectTo) {
      router.replace(redirectTo);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [onboardingState.isComplete, redirectTo]);

  const trackLogin = useCallback((method: string) => {
    const u = firebaseAuth.currentUser;
    if (u) {
      identifyUser(u.uid, { email: u.email, name: u.displayName });
      captureEvent('Login Success', { method });
    }
  }, []);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    clearErrors();
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(firebaseAuth, provider);
      } else {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        });
        await GoogleSignin.hasPlayServices();
        await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();
        const credential = GoogleAuthProvider.credential(tokens.idToken);
        await signInWithCredential(firebaseAuth, credential);
      }
      trackLogin('google');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      postAuthRoute();
    } catch (e: unknown) {
      const errorMsg = mapFirebaseAuthError(e, 'Google sign-in failed. Please try again.');
      if (errorMsg) setGlobalError(errorMsg);
      if (Platform.OS !== 'web' && errorMsg) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
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
      trackLogin('apple');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      postAuthRoute();
    } catch (e: unknown) {
      const err = e as Record<string, unknown>;
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        const errorMsg = mapFirebaseAuthError(e, 'Apple sign-in failed. Please try again.');
        if (errorMsg) setGlobalError(errorMsg);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (loading) return;
    clearErrors();
    if (!validate()) {
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        await setPersistence(firebaseAuth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      }
      await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
      trackLogin('email');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      postAuthRoute();
    } catch (e: unknown) {
      const errorMsg = mapFirebaseAuthError(e, 'Sign in failed. Please try again.');
      if (errorMsg) setGlobalError(errorMsg);
      if (Platform.OS !== 'web' && errorMsg) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    email, setEmail,
    password, setPassword,
    emailError, passwordError, globalError,
    loading, rememberMe, setRememberMe,
    isValid,
    clearErrors,
    handleGoogleSignIn, handleAppleSignIn, handleLogin
  };
}
