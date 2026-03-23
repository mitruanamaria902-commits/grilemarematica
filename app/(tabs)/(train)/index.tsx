import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet } from '@/utils/api';
import { getColors } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { Brain, ChevronRight, Zap } from 'lucide-react-native';

interface ChapterStat {
  chapter: string;
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
}

const SUBJECTS = ['Toate', 'Algebră', 'Geometrie', 'Aritmetică'];

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay: index * 55, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, delay: index * 55, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function TrainScreen() {
  const theme = useTheme();
  const C = getColors(theme.dark);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [chapters, setChapters] = useState<ChapterStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSubject, setActiveSubject] = useState('Toate');
  const [error, setError] = useState('');

  const fetchChapters = useCallback(async () => {
    console.log('[Train] Fetching chapters');
    try {
      const res = await apiGet<{ chapters: ChapterStat[] }>('/api/stats/chapters');
      setChapters(res.chapters || []);
      console.log('[Train] Chapters loaded:', res.chapters?.length);
    } catch (e: any) {
      console.error('[Train] Fetch error:', e?.message);
      setError('Nu s-au putut încărca capitolele.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChapters();
  };

  const filtered = activeSubject === 'Toate'
    ? chapters
    : chapters.filter(c => c.subject === activeSubject);

  const handleAdaptive = () => {
    console.log('[Train] Adaptive training button pressed');
    router.push({ pathname: '/quiz/[mode]', params: { mode: 'quick', adaptive: 'true' } });
  };

  const handleChapter = (ch: ChapterStat) => {
    console.log(`[Train] Chapter pressed: ${ch.chapter} (${ch.subject})`);
    router.push({
      pathname: '/quiz/[mode]',
      params: { mode: 'quick', chapter: ch.chapter, subject: ch.subject },
    });
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
          backgroundColor: C.surface,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <Text
          style={{
            fontFamily: 'Nunito_800ExtraBold',
            fontSize: 26,
            color: C.text,
            letterSpacing: -0.4,
            marginBottom: 16,
          }}
        >
          Antrenament
        </Text>

        {/* Adaptive button */}
        <AnimatedPressable
          onPress={handleAdaptive}
          style={{
            backgroundColor: C.primary,
            borderRadius: 14,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Brain size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#FFFFFF' }}>
              Antrenament Adaptiv
            </Text>
            <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
              Întrebări personalizate pe punctele slabe
            </Text>
          </View>
          <Zap size={18} color="rgba(255,255,255,0.8)" />
        </AnimatedPressable>
      </View>

      {/* Subject filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
      >
        {SUBJECTS.map(s => {
          const isActive = activeSubject === s;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => {
                console.log(`[Train] Subject filter: ${s}`);
                setActiveSubject(s);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isActive ? C.primary : C.surfaceSecondary,
                borderWidth: 1,
                borderColor: isActive ? C.primary : C.border,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Nunito_600SemiBold',
                  fontSize: 13,
                  color: isActive ? '#FFFFFF' : C.textSecondary,
                }}
              >
                {s}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 10 }}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <View
            style={{
              backgroundColor: C.dangerMuted,
              borderRadius: 14,
              padding: 20,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: C.danger }}>
              Eroare la încărcare
            </Text>
            <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 13, color: C.textSecondary }}>
              {error}
            </Text>
            <AnimatedPressable
              onPress={fetchChapters}
              style={{
                backgroundColor: C.primary,
                borderRadius: 10,
                paddingHorizontal: 20,
                paddingVertical: 10,
                marginTop: 4,
              }}
            >
              <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#FFFFFF' }}>
                Reîncearcă
              </Text>
            </AnimatedPressable>
          </View>
        ) : filtered.length === 0 ? (
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 16,
              padding: 32,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: C.border,
              gap: 8,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: C.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}
            >
              <Brain size={28} color={C.primary} />
            </View>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 16, color: C.text }}>
              Niciun capitol
            </Text>
            <Text
              style={{
                fontFamily: 'Nunito_400Regular',
                fontSize: 13,
                color: C.textSecondary,
                textAlign: 'center',
              }}
            >
              Rezolvă câteva întrebări pentru a vedea statisticile pe capitole.
            </Text>
          </View>
        ) : (
          filtered.map((ch, i) => {
            const pct = Math.round(Number(ch.accuracy));
            const barColor = pct >= 70 ? C.accent : pct >= 40 ? C.warning : C.danger;
            return (
              <AnimatedListItem key={`${ch.subject}-${ch.chapter}`} index={i}>
                <AnimatedPressable
                  onPress={() => handleChapter(ch)}
                  style={{
                    backgroundColor: C.surface,
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: C.border,
                    boxShadow: '0 1px 4px rgba(59,91,219,0.04)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
                      <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: C.primary }}>
                        {ch.subject.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: C.text }}
                        numberOfLines={1}
                      >
                        {ch.chapter}
                      </Text>
                      <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 12, color: C.textTertiary, marginTop: 2 }}>
                        {ch.subject}
                        {'  ·  '}
                        {ch.total}
                        {' întrebări'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <View
                          style={{
                            flex: 1,
                            height: 5,
                            backgroundColor: C.surfaceSecondary,
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <View
                            style={{
                              height: 5,
                              width: `${pct}%`,
                              backgroundColor: barColor,
                              borderRadius: 3,
                            }}
                          />
                        </View>
                        <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 12, color: barColor, minWidth: 36 }}>
                          {pct}
                          {'%'}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={C.textTertiary} />
                  </View>
                </AnimatedPressable>
              </AnimatedListItem>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
