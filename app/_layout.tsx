import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthScreen = segments[0] === 'auth-screen';
    if (!user && !inAuthScreen) {
      router.replace('/auth-screen');
    } else if (user && inAuthScreen) {
      router.replace('/(tabs)/(home)');
    }
  }, [user, loading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: '#3B5BDB',
      background: '#F0F4FF',
      card: '#FFFFFF',
      text: '#1A1F36',
      border: 'rgba(59, 91, 219, 0.08)',
      notification: '#EF4444',
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    dark: true,
    colors: {
      primary: '#5B7BFF',
      background: '#0F1219',
      card: '#1A2035',
      text: '#E8EEFF',
      border: 'rgba(91, 123, 255, 0.12)',
      notification: '#EF4444',
    },
  };

  return (
    <>
      <StatusBar style="auto" animated />
      <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomDefaultTheme}>
        <SafeAreaProvider>
          <AuthProvider>
            <WidgetProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <NavigationGuard>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="auth-screen" options={{ headerShown: false }} />
                    <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
                    <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="quiz/[mode]"
                      options={{
                        headerShown: false,
                        animation: 'slide_from_right',
                      }}
                    />
                    <Stack.Screen
                      name="results/[sessionId]"
                      options={{
                        headerShown: false,
                        animation: 'slide_from_right',
                      }}
                    />
                  </Stack>
                </NavigationGuard>
                <SystemBars style="auto" />
              </GestureHandlerRootView>
            </WidgetProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </>
  );
}
