import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/utils/api';
import { getColors } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonLine, SkeletonCard } from '@/components/SkeletonLoader';
import {
  Zap,
  ClipboardList,
  Flame,
  Target,
  BookOpen,
  TrendingUp,
  Award,
} from 'lucide-react-native';

interface UserStats {
  total_answered: number;
  total_correct: number;
  streak_days: number;
  last_activity_date: string;
  badges: string[];
  accuracy: number;
}

interface ChapterStat {
  chapter: string;
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
}

const BADGE_META: Record<string, { icon: string; label: string }> = {
  'primul_pas': { icon: '🎯', label: 'Primul Pas' },
  'maestrul_algebrei': { icon: '📐', label: 'Maestrul Algebrei' },
  'geniul_geometriei': { icon: '📏', label: 'Geniul Geometriei' },
  'seria_de_5': { icon: '🔥', label: 'Seria de 5' },
  'seria_de_10': { icon: '⚡', label: 'Seria de 10' },
  'centurion': { icon: '💯', label: 'Centurion' },
  'perfectionist': { icon: '✨', label: 'Perfectionist' },
};

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 70, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const C = getColors(theme.dark);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [chapters, setChapters] = useState<ChapterStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    console.log('[Home] Fetching stats and chapters');
    try {
      const [statsRes, chaptersRes] = await Promise.all([
        apiGet<UserStats>('/api/stats'),
        apiGet<{ chapters: ChapterStat[] }>('/api/stats/chapters'),
      ]);
      setStats(statsRes);
      setChapters(chaptersRes.chapters || []);
      console.log('[Home] Data loaded — stats:', statsRes, 'chapters:', chaptersRes.chapters?.length);
    } catch (e: any) {
      console.error('[Home] Fetch error:', e?.message);
      setError('Nu s-au putut încărca datele.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const firstName = user?.name?.split(' ')[0] || 'elev';
  const weakChapters = chapters.filter(c => c.accuracy < 60).slice(0, 3);
  const earnedBadges = stats?.badges || [];
  const accuracyDisplay = stats ? Math.round(Number(stats.accuracy)) : 0;

  const handleQuickTest = () => {
    console.log('[Home] Quick test button pressed');
    router.push({ pathname: '/quiz/[mode]', params: { mode: 'quick' } });
  };

  const handleFullExam = () => {
    console.log('[Home] Full exam button pressed');
    router.push({ pathname: '/quiz/[mode]', params: { mode: 'exam' } });
  };

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
          paddingBottom: 20,
          backgroundColor: C.primary,
        }}
      >
        <AnimatedListItem index={0}>
          <Text
            style={{
              fontFamily: 'Nunito_400Regular',
              fontSize: 15,
              color: 'rgba(255,255,255,0.75)',
              marginBottom: 2,
            }}
          >
            Bună ziua,
          </Text>
          <Text
            style={{
              fontFamily: 'Nunito_800ExtraBold',
              fontSize: 26,
              color: '#FFFFFF',
              letterSpacing: -0.3,
            }}
          >
            {firstName}
            {'  '}
            👋
          </Text>
        </AnimatedListItem>

        {/* Stats card */}
        <AnimatedListItem index={1}>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 16,
              padding: 16,
              marginTop: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            {loading ? (
              <>
                <SkeletonLine width={60} height={40} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <SkeletonLine width={60} height={40} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <SkeletonLine width={60} height={40} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
              </>
            ) : (
              <>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Flame size={18} color="#FCD34D" />
                    <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: '#FFFFFF' }}>
                      {stats?.streak_days ?? 0}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    Zile la rând
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: '#FFFFFF' }}>
                    {accuracyDisplay}
                    <Text style={{ fontSize: 14 }}>%</Text>
                  </Text>
                  <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    Acuratețe
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: '#FFFFFF' }}>
                    {stats?.total_answered ?? 0}
                  </Text>
                  <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    Întrebări
                  </Text>
                </View>
              </>
            )}
          </View>
        </AnimatedListItem>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 24 }}>
        {/* Quick actions */}
        <AnimatedListItem index={2}>
          <Text
            style={{
              fontFamily: 'Nunito_700Bold',
              fontSize: 17,
              color: C.text,
              marginBottom: 12,
            }}
          >
            Începe acum
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <AnimatedPressable
              onPress={handleQuickTest}
              style={{
                flex: 1,
                backgroundColor: C.primary,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={22} color="#FFFFFF" />
              </View>
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#FFFFFF', textAlign: 'center' }}>
                Test Rapid
              </Text>
              <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
                10 întrebări
              </Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={handleFullExam}
              style={{
                flex: 1,
                backgroundColor: C.surface,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                gap: 8,
                borderWidth: 1,
                borderColor: C.border,
                boxShadow: '0 2px 8px rgba(59,91,219,0.06)',
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: C.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ClipboardList size={22} color={C.primary} />
              </View>
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 13, color: C.text, textAlign: 'center' }}>
                Examen Complet
              </Text>
              <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 11, color: C.textSecondary, textAlign: 'center' }}>
                30 întrebări
              </Text>
            </AnimatedPressable>
          </View>
        </AnimatedListItem>

        {/* Weak chapters */}
        <AnimatedListItem index={3}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 17, color: C.text }}>
              Capitolele tale slabe
            </Text>
            <TrendingUp size={18} color={C.textTertiary} />
          </View>

          {loading ? (
            <View style={{ gap: 10 }}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : weakChapters.length === 0 ? (
            <View
              style={{
                backgroundColor: C.surface,
                borderRadius: 16,
                padding: 24,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: C.border,
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: C.accentMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                }}
              >
                <Target size={26} color={C.accent} />
              </View>
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 15, color: C.text }}>
                Excelent!
              </Text>
              <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
                Nu ai capitole slabe momentan. Continuă să exersezi!
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {weakChapters.map((ch, i) => {
                const pct = Math.round(Number(ch.accuracy));
                const barColor = pct < 30 ? C.danger : C.warning;
                return (
                  <AnimatedListItem key={ch.chapter} index={i + 4}>
                    <AnimatedPressable
                      onPress={() => {
                        console.log(`[Home] Weak chapter pressed: ${ch.chapter}`);
                        router.push({
                          pathname: '/quiz/[mode]',
                          params: { mode: 'quick', chapter: ch.chapter, subject: ch.subject },
                        });
                      }}
                      style={{
                        backgroundColor: C.surface,
                        borderRadius: 14,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: C.border,
                        boxShadow: '0 1px 4px rgba(59,91,219,0.05)',
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text
                          style={{
                            fontFamily: 'Nunito_600SemiBold',
                            fontSize: 14,
                            color: C.text,
                            flex: 1,
                          }}
                          numberOfLines={1}
                        >
                          {ch.chapter}
                        </Text>
                        <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: barColor }}>
                          {pct}
                          <Text style={{ fontSize: 11 }}>%</Text>
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: C.surfaceSecondary,
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            height: 6,
                            width: `${pct}%`,
                            backgroundColor: barColor,
                            borderRadius: 3,
                          }}
                        />
                      </View>
                      <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 11, color: C.textTertiary, marginTop: 6 }}>
                        {ch.subject}
                        {'  ·  '}
                        {ch.total}
                        {' întrebări'}
                      </Text>
                    </AnimatedPressable>
                  </AnimatedListItem>
                );
              })}
            </View>
          )}
        </AnimatedListItem>

        {/* Badges */}
        {earnedBadges.length > 0 && (
          <AnimatedListItem index={7}>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 17, color: C.text, marginBottom: 12 }}>
              Insignele tale
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}>
              <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20 }}>
                {earnedBadges.map((badge, i) => {
                  const meta = BADGE_META[badge] || { icon: '🏅', label: badge };
                  return (
                    <View
                      key={badge}
                      style={{
                        backgroundColor: C.surface,
                        borderRadius: 14,
                        padding: 14,
                        alignItems: 'center',
                        gap: 6,
                        borderWidth: 1,
                        borderColor: C.primaryBorder,
                        minWidth: 80,
                        boxShadow: '0 1px 4px rgba(59,91,219,0.06)',
                      }}
                    >
                      <Text style={{ fontSize: 28 }}>{meta.icon}</Text>
                      <Text
                        style={{
                          fontFamily: 'Nunito_600SemiBold',
                          fontSize: 10,
                          color: C.textSecondary,
                          textAlign: 'center',
                        }}
                        numberOfLines={2}
                      >
                        {meta.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </AnimatedListItem>
        )}

        {/* Error */}
        {!!error && (
          <View
            style={{
              backgroundColor: C.dangerMuted,
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <BookOpen size={18} color={C.danger} />
            <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 13, color: C.danger, flex: 1 }}>
              {error}
            </Text>
            <AnimatedPressable onPress={fetchData}>
              <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: C.primary }}>
                Reîncearcă
              </Text>
            </AnimatedPressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
