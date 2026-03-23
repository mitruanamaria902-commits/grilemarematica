import React from 'react';
import { View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { TabBarItem } from '@/components/FloatingTabBar';

const TABS: TabBarItem[] = [
  {
    name: '(home)',
    route: '/(tabs)/(home)',
    icon: 'home',
    label: 'Acasă',
  },
  {
    name: '(train)',
    route: '/(tabs)/(train)',
    icon: 'fitness_center',
    label: 'Antrenament',
  },
  {
    name: '(exam)',
    route: '/(tabs)/(exam)',
    icon: 'assignment',
    label: 'Examen',
  },
  {
    name: '(profile)',
    route: '/(tabs)/(profile)',
    icon: 'person',
    label: 'Profil',
  },
];

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(train)" />
        <Stack.Screen name="(exam)" />
        <Stack.Screen name="(profile)" />
      </Stack>
      <FloatingTabBar tabs={TABS} containerWidth={340} />
    </View>
  );
}
