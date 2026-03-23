import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/utils/api';
import { getColors } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonLine } from '@/components/SkeletonLoader';
import { LogOut, Target, Flame, BookOpen, Award } from 'lucide-react-native';

interface UserStats {
  total_answered: number;
  total_correct: number;
  streak_days: number;
  last_activity_date: string;
  badges: string[];
  accuracy: number;
}

const ALL_BADGES = [
  { key: 'primul_pas', icon: '🎯', label: 'Primul Pas', desc: 'Primul răspuns corect' },
  { key: 'maestrul_algebrei', icon: '📐', label: 'Maestrul Algebrei', desc: '20 răspunsuri corecte la algebră' },
  { key: 'geniul_geometriei', icon: '📏', label: 'Geniul Geometriei', desc: '20 răspunsuri corecte la geometrie' },
  { key: 'seria_de_5', icon: '🔥', label: 'Seria de 5', desc: '5 zile consecutive' },
  { key: 'seria_de_10', icon: '⚡', label: 'Seria de 10', desc: '10 zile consecutive' },
  { key: 'centurion', icon: '💯', label: 'Centurion', desc: '100 de întrebări rezolvate' },
  { key: 'perfectionist', icon: '✨', label: 'Perfectionist', desc: '10 răspunsuri corecte la rând' },
];

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay: index * 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const C = getColors(theme.dark);
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    console.log('[Profile] Fetching stats');
    try {
      const res = await apiGet<UserStats>('/api/stats');
      setStats(res);
      console.log('[Profile] Stats loaded:', res);
    } catch (e: any) {
      console.error('[Profile] Fetch error:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleSignOut = async () => {
    console.log('[Profile] Sign out button pressed');
    await signOut();
  };

  const earnedBadges = new Set(stats?.badges || []);
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  const accuracyDisplay = stats ? Math.round(Number(stats.accuracy)) : 0;
  const bestStreak = stats?.streak_days ?? 0;

  const statItems = [
    { icon: <BookOpen size={20} color={C.primary} />, value: stats?.total_answered ?? 0, label: 'Întrebări' },
    { icon: <Target size={20} color={C.accent} />, value: `${accuracyDisplay}%`, label: 'Acuratețe' },
    { icon: <Flame size={20} color={C.warning} />, value: bestStreak, label: 'Zile la rând' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
      }
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 28,
          backgroundColor: C.primary,
          alignItems: 'center',
        }}
      >
        <AnimatedListItem index={0}>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(255,255,255,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.4)',
              }}
            >
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 26, color: '#FFFFFF' }}>
                {initials}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 20, color: '#FFFFFF' }}>
                {user?.name || 'Utilizator'}
              </Text>
              <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                {user?.email || ''}
              </Text>
            </View>
          </View>
        </AnimatedListItem>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 24 }}>
        {/* Stats */}
        <AnimatedListItem index={1}>
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: C.border,
              flexDirection: 'row',
              boxShadow: '0 1px 6px rgba(59,91,219,0.05)',
            }}
          >
            {loading ? (
              <>
                <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                  <SkeletonLine width={40} height={24} />
                  <SkeletonLine width={60} height={12} />
                </View>
                <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                  <SkeletonLine width={40} height={24} />
                  <SkeletonLine width={60} height={12} />
                </View>
                <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                  <SkeletonLine width={40} height={24} />
                  <SkeletonLine width={60} height={12} />
                </View>
              </>
            ) : (
              statItems.map((item, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: C.surfaceSecondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </View>
                  <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: C.text }}>
                    {String(item.value)}
                  </Text>
                  <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 11, color: C.textTertiary }}>
                    {item.label}
                  </Text>
                </View>
              ))
            )}
          </View>
        </AnimatedListItem>

        {/* Badges */}
        <AnimatedListItem index={2}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Award size={18} color={C.primary} />
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 17, color: C.text }}>
              Insigne
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {ALL_BADGES.map((badge, i) => {
              const earned = earnedBadges.has(badge.key);
              return (
                <AnimatedListItem key={badge.key} index={i + 3}>
                  <View
                    style={{
                      backgroundColor: earned ? C.surface : C.surfaceSecondary,
                      borderRadius: 14,
                      padding: 14,
                      alignItems: 'center',
                      gap: 6,
                      borderWidth: 1,
                      borderColor: earned ? C.primaryBorder : C.border,
                      width: 100,
                      opacity: earned ? 1 : 0.5,
                      boxShadow: earned ? '0 1px 6px rgba(59,91,219,0.07)' : undefined,
                    }}
                  >
                    <Text style={{ fontSize: 26, opacity: earned ? 1 : 0.4 }}>
                      {badge.icon}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Nunito_600SemiBold',
                        fontSize: 10,
                        color: earned ? C.text : C.textTertiary,
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {badge.label}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Nunito_400Regular',
                        fontSize: 9,
                        color: C.textTertiary,
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {badge.desc}
                    </Text>
                  </View>
                </AnimatedListItem>
              );
            })}
          </View>
        </AnimatedListItem>

        {/* Sign out */}
        <AnimatedListItem index={10}>
          <AnimatedPressable
            onPress={handleSignOut}
            style={{
              backgroundColor: C.dangerMuted,
              borderRadius: 14,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.15)',
            }}
          >
            <LogOut size={18} color={C.danger} />
            <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: C.danger }}>
              Deconectare
            </Text>
          </AnimatedPressable>
        </AnimatedListItem>
      </View>
    </ScrollView>
  );
}
