import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet } from '@/utils/api';
import { getColors } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { CheckCircle, XCircle, Home, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react-native';

interface ExamSession {
  id: string;
  mode: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  duration_seconds: number;
  completed_at: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} secunde`;
  return `${mins} min ${secs} sec`;
}

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function ResultsScreen() {
  const theme = useTheme();
  const C = getColors(theme.dark);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId: string;
    correct?: string;
    total?: string;
    score?: string;
    duration?: string;
    mode?: string;
    chapter?: string;
    subject?: string;
  }>();

  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(params.sessionId !== 'local');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchSession = useCallback(async () => {
    if (params.sessionId === 'local') return;
    console.log(`[Results] Fetching session: ${params.sessionId}`);
    try {
      const res = await apiGet<{ sessions: ExamSession[] }>('/api/exams');
      const found = (res.sessions || []).find(s => s.id === params.sessionId);
      if (found) {
        setSession(found);
        console.log('[Results] Session found:', found);
      }
    } catch (e: any) {
      console.error('[Results] Fetch error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [params.sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Use passed params as fallback
  const correct = session ? session.correct_answers : Number(params.correct ?? 0);
  const total = session ? session.total_questions : Number(params.total ?? 0);
  const score = session ? Number(session.score) : Number(params.score ?? 0);
  const duration = session ? session.duration_seconds : Number(params.duration ?? 0);
  const mode = session?.mode || params.mode || 'quick';

  const scoreDisplay = score.toFixed(2);
  const passed = score >= 5;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const durationDisplay = formatDuration(duration);

  const scoreColor = passed ? C.accent : C.danger;
  const scoreBackground = passed ? C.accentMuted : C.dangerMuted;

  const handleRetry = () => {
    console.log('[Results] Retry button pressed');
    router.replace({
      pathname: '/quiz/[mode]',
      params: {
        mode,
        chapter: params.chapter || '',
        subject: params.subject || '',
      },
    });
  };

  const handleHome = () => {
    console.log('[Results] Home button pressed');
    router.replace('/(tabs)/(home)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Score hero */}
        <View
          style={{
            backgroundColor: C.primary,
            paddingTop: insets.top + 24,
            paddingBottom: 40,
            paddingHorizontal: 20,
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>
            {mode === 'exam' ? 'Simulare Examen' : 'Test Rapid'}
          </Text>

          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: scoreBackground,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: scoreColor,
            }}
          >
            <Text
              style={{
                fontFamily: 'Nunito_800ExtraBold',
                fontSize: 36,
                color: scoreColor,
                fontVariant: ['tabular-nums'],
              }}
            >
              {scoreDisplay}
            </Text>
          </Animated.View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: scoreBackground,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 6,
            }}
          >
            {passed
              ? <CheckCircle size={16} color={scoreColor} />
              : <XCircle size={16} color={scoreColor} />
            }
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: scoreColor }}>
              {passed ? 'Promovat!' : 'Nepromovat'}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 20 }}>
          {/* Stats row */}
          <AnimatedListItem index={0}>
            <View
              style={{
                backgroundColor: C.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: C.border,
                flexDirection: 'row',
                boxShadow: '0 2px 8px rgba(59,91,219,0.05)',
              }}
            >
              {[
                { label: 'Corecte', value: `${correct}/${total}` },
                { label: 'Acuratețe', value: `${accuracy}%` },
                { label: 'Timp', value: durationDisplay },
              ].map((item, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <Text
                    style={{
                      fontFamily: 'Nunito_800ExtraBold',
                      fontSize: 18,
                      color: C.text,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {item.value}
                  </Text>
                  <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 11, color: C.textTertiary }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </AnimatedListItem>

          {/* Action buttons */}
          <AnimatedListItem index={1}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <AnimatedPressable
                onPress={handleRetry}
                style={{
                  flex: 1,
                  backgroundColor: C.primaryMuted,
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderWidth: 1,
                  borderColor: C.primaryBorder,
                }}
              >
                <RotateCcw size={16} color={C.primary} />
                <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: C.primary }}>
                  Încearcă din nou
                </Text>
              </AnimatedPressable>

              <AnimatedPressable
                onPress={handleHome}
                style={{
                  flex: 1,
                  backgroundColor: C.primary,
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Home size={16} color="#FFFFFF" />
                <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#FFFFFF' }}>
                  Înapoi acasă
                </Text>
              </AnimatedPressable>
            </View>
          </AnimatedListItem>

          {/* Encouragement */}
          <AnimatedListItem index={2}>
            <View
              style={{
                backgroundColor: passed ? C.accentMuted : C.warningMuted,
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: passed ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Nunito_600SemiBold',
                  fontSize: 14,
                  color: passed ? C.accent : C.warning,
                  lineHeight: 21,
                }}
              >
                {passed
                  ? accuracy >= 90
                    ? '🌟 Performanță excepțională! Ești pregătit pentru examen!'
                    : '✅ Bine lucrat! Continuă să exersezi pentru a-ți îmbunătăți nota.'
                  : '💪 Nu te descuraja! Revizuiește capitolele slabe și încearcă din nou.'}
              </Text>
            </View>
          </AnimatedListItem>
        </View>
      </ScrollView>
    </View>
  );
}
