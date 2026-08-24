// src/hooks/useRememberMe.ts
// Screen-facing state machine for biometric-gated Remember Me, built on top of
// src/utils/rememberMe.ts. Keeps app/(auth)/sign-in.tsx focused on rendering —
// there is still exactly one place that calls AuthContext's signIn().
import { useEffect, useRef, useState } from 'react';
import {
  BiometricCapability,
  getBiometricCapability,
  getSavedAccounts,
  isAccountSaved,
  saveRememberedCredentials,
  confirmSavedCredentials,
  loadCredentialsForAccount,
  removeAccount,
} from '@/src/utils/rememberMe';

export function useRememberMe() {
  const [rememberMe, setRememberMe] = useState(false);
  const [isSavedAccount, setIsSavedAccount] = useState(false);
  const [hasSavedAccounts, setHasSavedAccounts] = useState(false);
  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability | null>(null);
  const [biometricChecked, setBiometricChecked] = useState(false);

  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [pickerAccounts, setPickerAccounts] = useState<string[]>([]);
  const [pickerSelectionMode, setPickerSelectionMode] = useState(false);
  const [pickerSelectedForRemoval, setPickerSelectedForRemoval] = useState<string[]>([]);

  const canRememberMe = biometricChecked && biometricCapability !== null;
  const emailCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getBiometricCapability()
      .then(setBiometricCapability)
      .catch(() => setBiometricCapability(null))
      .finally(() => setBiometricChecked(true));
  }, []);

  useEffect(() => {
    getSavedAccounts().then(accounts => {
      if (accounts.length > 0) setHasSavedAccounts(true);
    }).catch(() => {});
  }, []);

  // Debounced check: does the typed email match a saved account?
  const onEmailChange = (email: string) => {
    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);

    if (!email.trim()) {
      setIsSavedAccount(false);
      setRememberMe(false);
      return;
    }
    emailCheckTimer.current = setTimeout(async () => {
      const saved = await isAccountSaved(email);
      setIsSavedAccount(saved);
      setRememberMe(saved);
    }, 300);
  };

  const refreshHasSavedAccounts = async () => {
    const remaining = await getSavedAccounts();
    setHasSavedAccounts(remaining.length > 0);
    return remaining;
  };

  // Checking → save + confirm via biometric. Unchecking → remove.
  const toggleRememberMe = async (
    email: string,
    password: string,
    onInlineError: (message: string) => void,
  ) => {
    try {
      if (rememberMe) {
        setRememberMe(false);
        if (isSavedAccount) {
          await removeAccount(email);
          setIsSavedAccount(false);
          await refreshHasSavedAccounts();
        }
        return;
      }

      if (!email.trim() || !password.trim()) {
        onInlineError('Please enter your email and password before enabling Remember Me.');
        return;
      }

      const saved = await saveRememberedCredentials(email, password);
      if (!saved) return;

      const confirmResult = await confirmSavedCredentials(email);
      if (!confirmResult.ok) {
        await removeAccount(email);
        await refreshHasSavedAccounts();
        if (confirmResult.reason === 'lockout') {
          onInlineError('Biometric authentication is temporarily locked. Please try again later.');
        } else if (confirmResult.reason === 'cancelled') {
          onInlineError('Confirmation was cancelled, so Remember Me was not enabled. Try again.');
        } else {
          onInlineError('Could not confirm your identity, so Remember Me was not enabled. Try again.');
        }
        return;
      }

      setRememberMe(true);
      setIsSavedAccount(true);
      setHasSavedAccounts(true);
    } catch {
      // Swallow native auth/storage errors to avoid crashing the screen
    }
  };

  // Called right after AuthContext.signIn() settles, so a saved credential
  // that no longer works (rotated password, deactivated account) is purged.
  const onSignInSettled = async (success: boolean, email: string) => {
    if (!success && isSavedAccount) {
      await removeAccount(email);
      setIsSavedAccount(false);
      setRememberMe(false);
      await refreshHasSavedAccounts();
    }
  };

  const fillAndSignIn = async (
    targetEmail: string,
    onFill: (email: string, password: string) => Promise<void>,
    onInlineError: (message: string) => void,
  ) => {
    const result = await loadCredentialsForAccount(targetEmail);
    if (!result.ok) {
      if (result.reason === 'lockout') {
        onInlineError('Biometric authentication is temporarily locked. Please try again later.');
      } else if (result.reason === 'no_authenticator' || result.reason === 'not_found') {
        await removeAccount(targetEmail);
        await refreshHasSavedAccounts();
        onInlineError('That saved sign-in is no longer available. Please sign in again.');
      } else if (result.reason === 'unknown') {
        onInlineError('Could not confirm your identity. Please try again.');
      }
      // 'cancelled' stays silent — the user backed out of the prompt on purpose.
      return;
    }
    await onFill(result.email, result.password);
  };

  const handleBiometricLogin = async (
    onFill: (email: string, password: string) => Promise<void>,
    onInlineError: (message: string) => void,
  ) => {
    try {
      const accounts = await getSavedAccounts();
      if (accounts.length === 0) return;

      if (accounts.length === 1) {
        await fillAndSignIn(accounts[0], onFill, onInlineError);
      } else {
        setPickerAccounts(accounts);
        setShowAccountPicker(true);
      }
    } catch {
      // ignore
    }
  };

  const handlePickAccount = async (
    pickedEmail: string,
    onFill: (email: string, password: string) => Promise<void>,
    onInlineError: (message: string) => void,
  ) => {
    setShowAccountPicker(false);
    await fillAndSignIn(pickedEmail, onFill, onInlineError);
  };

  const dismissAccountPicker = () => {
    setShowAccountPicker(false);
    setPickerSelectionMode(false);
    setPickerSelectedForRemoval([]);
  };

  const togglePickerSelectionMode = () => {
    setPickerSelectionMode(prev => !prev);
    setPickerSelectedForRemoval([]);
  };

  const togglePickerSelectedForRemoval = (acctEmail: string) => {
    setPickerSelectedForRemoval(prev =>
      prev.includes(acctEmail) ? prev.filter(e => e !== acctEmail) : [...prev, acctEmail],
    );
  };

  const removePickerSelected = async () => {
    await Promise.all(pickerSelectedForRemoval.map(acctEmail => removeAccount(acctEmail)));
    const remaining = pickerAccounts.filter(a => !pickerSelectedForRemoval.includes(a));
    setPickerAccounts(remaining);
    setPickerSelectionMode(false);
    setPickerSelectedForRemoval([]);
    setHasSavedAccounts(remaining.length > 0);
    if (remaining.length === 0) setShowAccountPicker(false);
  };

  return {
    rememberMe,
    canRememberMe,
    isSavedAccount,
    hasSavedAccounts,
    biometricLabel: biometricCapability?.label ?? 'Biometric',
    onEmailChange,
    toggleRememberMe,
    onSignInSettled,
    handleBiometricLogin,
    showAccountPicker,
    pickerAccounts,
    pickerSelectionMode,
    pickerSelectedForRemoval,
    handlePickAccount,
    dismissAccountPicker,
    togglePickerSelectionMode,
    togglePickerSelectedForRemoval,
    removePickerSelected,
  };
}
