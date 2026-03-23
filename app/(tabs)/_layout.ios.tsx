import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Icon sf="house.fill" />
        <Label>Acasă</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(train)">
        <Icon sf="dumbbell.fill" />
        <Label>Antrenament</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(exam)">
        <Icon sf="doc.text.fill" />
        <Label>Examen</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(profile)">
        <Icon sf="person.fill" />
        <Label>Profil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
