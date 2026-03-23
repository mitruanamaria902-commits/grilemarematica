import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { getColors } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Mail, Lock, User, Eye, EyeOff, BookOpen } from 'lucide-react-native';

export default function AuthScreen() {
  const theme = useTheme();
  const C = getColors(theme.dark);
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Completează toate câmpurile.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Introdu numele tău.');
      return;
    }
    console.log(`[Auth] ${mode === 'login' ? 'Sign in' : 'Sign up'} attempt for: ${email}`);
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password);
        console.log('[Auth] Sign in successful');
      } else {
        await signUpWithEmail(email.trim(), password, name.trim());
        console.log('[Auth] Sign up successful');
      }
    } catch (e: any) {
      console.error('[Auth] Error:', e?.message);
      setError(e?.message || 'A apărut o eroare. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => (m === 'login' ? 'signup' : 'login'));
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  const inputStyle = (focused: boolean) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: C.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: focused ? C.primary : C.border,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 24,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: C.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 8px 24px rgba(59, 91, 219, 0.35)',
              }}
            >
              <Text style={{ fontSize: 36, color: '#FFFFFF', fontFamily: 'Nunito_800ExtraBold' }}>
                ∑
              </Text>
            </View>
            <Text
              style={{
                fontSize: 28,
                fontFamily: 'Nunito_800ExtraBold',
                color: C.text,
                letterSpacing: -0.5,
              }}
            >
              MateGrile EN
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Nunito_400Regular',
                color: C.textSecondary,
                marginTop: 6,
                textAlign: 'center',
              }}
            >
              Pregătește-te pentru Evaluarea Națională
            </Text>
          </View>

          {/* Card */}
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: C.border,
              boxShadow: '0 2px 16px rgba(59, 91, 219, 0.08)',
            }}
          >
            {/* Mode toggle */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: C.surfaceSecondary,
                borderRadius: 12,
                padding: 4,
                marginBottom: 24,
              }}
            >
              {(['login', 'signup'] as const).map(m => {
                const isActive = mode === m;
                const label = m === 'login' ? 'Autentificare' : 'Înregistrare';
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => { setMode(m); setError(''); }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      backgroundColor: isActive ? C.primary : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Nunito_600SemiBold',
                        fontSize: 14,
                        color: isActive ? '#FFFFFF' : C.textSecondary,
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Name field (signup only) */}
            {mode === 'signup' && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontFamily: 'Nunito_600SemiBold',
                    fontSize: 13,
                    color: C.textSecondary,
                    marginBottom: 6,
                  }}
                >
                  Nume complet
                </Text>
                <View style={inputStyle(nameFocused)}>
                  <User size={18} color={nameFocused ? C.primary : C.textTertiary} />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ion Popescu"
                    placeholderTextColor={C.textTertiary}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    autoCapitalize="words"
                    returnKeyType="next"
                    style={{
                      flex: 1,
                      fontFamily: 'Nunito_400Regular',
                      fontSize: 15,
                      color: C.text,
                    }}
                  />
                </View>
              </View>
            )}

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: 'Nunito_600SemiBold',
                  fontSize: 13,
                  color: C.textSecondary,
                  marginBottom: 6,
                }}
              >
                Adresă email
              </Text>
              <View style={inputStyle(emailFocused)}>
                <Mail size={18} color={emailFocused ? C.primary : C.textTertiary} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@exemplu.ro"
                  placeholderTextColor={C.textTertiary}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  style={{
                    flex: 1,
                    fontFamily: 'Nunito_400Regular',
                    fontSize: 15,
                    color: C.text,
                  }}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontFamily: 'Nunito_600SemiBold',
                  fontSize: 13,
                  color: C.textSecondary,
                  marginBottom: 6,
                }}
              >
                Parolă
              </Text>
              <View style={inputStyle(passwordFocused)}>
                <Lock size={18} color={passwordFocused ? C.primary : C.textTertiary} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minim 8 caractere"
                  placeholderTextColor={C.textTertiary}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  style={{
                    flex: 1,
                    fontFamily: 'Nunito_400Regular',
                    fontSize: 15,
                    color: C.text,
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                  {showPassword
                    ? <EyeOff size={18} color={C.textTertiary} />
                    : <Eye size={18} color={C.textTertiary} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {!!error && (
              <View
                style={{
                  backgroundColor: C.dangerMuted,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Nunito_500Medium',
                    fontSize: 13,
                    color: C.danger,
                    textAlign: 'center',
                  }}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Submit */}
            <AnimatedPressable
              onPress={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: C.primary,
                borderRadius: 14,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: 16,
                    color: '#FFFFFF',
                  }}
                >
                  {mode === 'login' ? 'Intră în cont' : 'Creează cont'}
                </Text>
              )}
            </AnimatedPressable>
          </View>

          {/* Footer note */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
            <BookOpen size={14} color={C.textTertiary} />
            <Text
              style={{
                fontFamily: 'Nunito_400Regular',
                fontSize: 13,
                color: C.textTertiary,
              }}
            >
              Evaluarea Națională — clasa a VIII-a
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
