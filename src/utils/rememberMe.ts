// src/utils/rememberMe.ts
// Biometric-gated "Remember Me" credential vault. Storage uses expo-secure-store
// (OS keychain/keystore backed) instead of react-native-keychain, and every read
// is explicitly gated behind an expo-local-authentication prompt, since Expo Go
// (this project's dev environment) can't run react-native-keychain's native code.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const ACCOUNTS_LIST_KEY = 'ali_academy_accounts_list';

function accountKey(email: string): string {
  // SecureStore keys must be alphanumeric/./-/_ only — hash-free but safe encoding.
  return `ali_academy_account_${email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}`;
}

export async function getSavedAccounts(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_LIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

async function persistAccountsList(accounts: string[]): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_LIST_KEY, JSON.stringify(accounts));
}

export async function isAccountSaved(email: string): Promise<boolean> {
  const accounts = await getSavedAccounts();
  return accounts.includes(email.toLowerCase().trim());
}

// Write is silent (no biometric at save time) — the confirm step right after
// (confirmSavedCredentials) is what proves the device owner can read it back.
export async function saveRememberedCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  const key = email.toLowerCase().trim();
  try {
    await SecureStore.setItemAsync(accountKey(key), JSON.stringify({ email: key, password }));

    const accounts = await getSavedAccounts();
    if (!accounts.includes(key)) {
      await persistAccountsList([...accounts, key]);
    }
    return true;
  } catch {
    await SecureStore.deleteItemAsync(accountKey(key)).catch(() => {});
    return false;
  }
}

export type AuthFailureReason = 'cancelled' | 'lockout' | 'no_authenticator' | 'not_found' | 'unknown';

function classifyAuthResult(result: LocalAuthentication.LocalAuthenticationResult): AuthFailureReason {
  if (result.success) return 'unknown'; // unused when success
  switch (result.error) {
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return 'cancelled';
    case 'lockout':
      return 'lockout';
    case 'not_available':
    case 'not_enrolled':
    case 'passcode_not_set':
      return 'no_authenticator';
    default:
      return 'unknown';
  }
}

export type ConfirmResult = { ok: true } | { ok: false; reason: AuthFailureReason };

// Asks the device for whatever it has configured — Face ID, fingerprint, or a
// plain device passcode — same as Sanid. We never pre-check what's enrolled;
// we just ask the OS and let it pick the right prompt for that specific
// phone. If the device has nothing configured at all, the OS call fails
// immediately with 'no_authenticator' and we treat that as an automatic pass
// (nothing to gate against, so Remember Me just works with no prompt).
export async function confirmSavedCredentials(email: string): Promise<ConfirmResult> {
  try {
    const stored = await SecureStore.getItemAsync(accountKey(email));
    if (!stored) return { ok: false, reason: 'not_found' };

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm to enable Remember Me',
      disableDeviceFallback: false,
    });
    if (!result.success) {
      const reason = classifyAuthResult(result);
      if (reason === 'no_authenticator') return { ok: true };
      return { ok: false, reason };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unknown' };
  }
}

export type ReadResult =
  | { ok: true; email: string; password: string }
  | { ok: false; reason: AuthFailureReason };

// Same device-native prompt as confirmSavedCredentials, fired every time a
// saved account is used — Face ID / fingerprint / passcode, whatever that
// phone has set up. Devices with no security configured at all skip straight
// to "Easy Login" with no prompt (see confirmSavedCredentials above).
export async function loadCredentialsForAccount(email: string): Promise<ReadResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in',
      disableDeviceFallback: false,
    });
    if (!result.success) {
      const reason = classifyAuthResult(result);
      if (reason !== 'no_authenticator') return { ok: false, reason };
    }

    const stored = await SecureStore.getItemAsync(accountKey(email));
    if (!stored) return { ok: false, reason: 'not_found' };

    const parsed = JSON.parse(stored) as { email: string; password: string };
    return { ok: true, email: parsed.email, password: parsed.password };
  } catch {
    return { ok: false, reason: 'unknown' };
  }
}

export async function removeAccount(email: string): Promise<void> {
  const key = email.toLowerCase().trim();
  await SecureStore.deleteItemAsync(accountKey(key)).catch(() => {});
  const accounts = await getSavedAccounts();
  await persistAccountsList(accounts.filter(a => a !== key));
}

export async function clearAllAccounts(): Promise<void> {
  const accounts = await getSavedAccounts();
  await Promise.all(accounts.map(e => SecureStore.deleteItemAsync(accountKey(e)).catch(() => {})));
  await AsyncStorage.removeItem(ACCOUNTS_LIST_KEY);
}

export type BiometricKind = 'faceId' | 'fingerprint' | 'iris' | 'biometric';

export interface BiometricCapability {
  kind: BiometricKind;
  label: string; // "Face ID" | "Fingerprint" | "Iris" | "Biometric"
}

// Cosmetic probe only — picks the button label ("Sign in with Face ID" vs.
// "Fingerprint" vs. a generic fallback). It does NOT gate whether the device
// gets prompted: confirmSavedCredentials/loadCredentialsForAccount always ask
// the OS directly, which shows Face ID, fingerprint, or the device passcode
// depending on what that phone actually has configured, and skips the prompt
// entirely on a device with no security set up at all.
export async function getBiometricCapability(): Promise<BiometricCapability | null> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return null;

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return null;

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return { kind: 'faceId', label: 'Face ID' };
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return { kind: 'fingerprint', label: 'Fingerprint' };
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return { kind: 'iris', label: 'Iris' };
    }
    return { kind: 'biometric', label: 'Biometric' };
  } catch {
    return null;
  }
}
