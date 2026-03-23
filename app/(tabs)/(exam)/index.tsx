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
import { apiGet } from '@/utils/api';
import { getColors } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { ClipboardList, Clock, CheckCircle, XCircle, Play, Info } from 'lucide-react-native';

interface ExamSession {
  id: string;
  mode: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  duration_seconds: number;
  completed_at: string;
}

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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function ExamScreen() {
  const theme = useTheme();
  const C = getColors(theme.dark);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchSessions = useCallback(async () => {
    console.log('[Exam] Fetching exam sessions');
    try {
      const res = await apiGet<{ sessions: ExamSession[] }>('/api/exams');
      setSessions(res.sessions || []);
      console.log('[Exam] Sessions loaded:', res.sessions?.length);
    } catch (e: any) {
      console.error('[Exam] Fetch error:', e?.message);
      setError('Nu s-au putut încărca sesiunile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  const handleStartExam = () => {
    console.log('[Exam] Start simulation button pressed');
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
          paddingBottom: 24,
          backgroundColor: C.surface,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <AnimatedListItem index={0}>
          <Text
            style={{
              fontFamily: 'Nunito_800ExtraBold',
              fontSize: 26,
              color: C.text,
              letterSpacing: -0.4,
              marginBottom: 4,
            }}
          >
            Simulare Examen
          </Text>
          <Text
            style={{
              fontFamily: 'Nunito_400Regular',
              fontSize: 14,
              color: C.textSecondary,
              marginBottom: 20,
            }}
          >
            Evaluarea Națională — Matematică
          </Text>
        </AnimatedListItem>

        {/* Info card */}
        <AnimatedListItem index={1}>
          <View
            style={{
              backgroundColor: C.primaryMuted,
              borderRadius: 14,
              padding: 16,
              gap: 10,
              borderWidth: 1,
              borderColor: C.primaryBorder,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Info size={16} color={C.primary} />
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: C.primary }}>
                Structura examenului
              </Text>
            </View>
            {[
              'Subiectul I + II — 30 de întrebări',
              'Timp alocat: 120 de minute',
              'Nota se calculează din 10',
              'Nota de trecere: 5.00',
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: C.primary,
                  }}
                />
                <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 13, color: C.textSecondary }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </AnimatedListItem>

        {/* Start button */}
        <AnimatedListItem index={2}>
          <AnimatedPressable
            onPress={handleStartExam}
            style={{
              backgroundColor: C.primary,
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Play size={20} color="#FFFFFF" />
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#FFFFFF' }}>
              Începe Simularea
            </Text>
          </AnimatedPressable>
        </AnimatedListItem>
      </View>

      {/* History */}
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <AnimatedListItem index={3}>
          <Text
            style={{
              fontFamily: 'Nunito_700Bold',
              fontSize: 17,
              color: C.text,
              marginBottom: 14,
            }}
          >
            Istoricul simulărilor
          </Text>
        </AnimatedListItem>

        {loading ? (
          <View style={{ gap: 10 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
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
            <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: C.danger }}>
              {error}
            </Text>
            <AnimatedPressable
              onPress={fetchSessions}
              style={{
                backgroundColor: C.primary,
                borderRadius: 10,
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#FFFFFF' }}>
                Reîncearcă
              </Text>
            </AnimatedPressable>
          </View>
        ) : sessions.length === 0 ? (
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
              <ClipboardList size={28} color={C.primary} />
            </View>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 16, color: C.text }}>
              Nicio simulare încă
            </Text>
            <Text
              style={{
                fontFamily: 'Nunito_400Regular',
                fontSize: 13,
                color: C.textSecondary,
                textAlign: 'center',
                maxWidth: 260,
              }}
            >
              Apasă "Începe Simularea" pentru a face primul tău examen de probă.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {sessions.map((session, i) => {
              const score = Number(session.score);
              const scoreDisplay = score.toFixed(2);
              const passed = score >= 5;
              const accuracy = session.total_questions > 0
                ? Math.round((session.correct_answers / session.total_questions) * 100)
                : 0;
              const dateDisplay = formatDate(session.completed_at);
              const durationDisplay = formatDuration(session.duration_seconds);

              return (
                <AnimatedListItem key={session.id} index={i + 4}>
                  <AnimatedPressable
                    onPress={() => {
                      console.log(`[Exam] Session pressed: ${session.id}`);
                      router.push({
                        pathname: '/results/[sessionId]',
                        params: { sessionId: session.id },
                      });
                    }}
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
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          backgroundColor: passed ? C.accentMuted : C.dangerMuted,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: 'Nunito_800ExtraBold',
                            fontSize: 18,
                            color: passed ? C.accent : C.danger,
                          }}
                        >
                          {scoreDisplay}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {passed
                            ? <CheckCircle size={14} color={C.accent} />
                            : <XCircle size={14} color={C.danger} />
                          }
                          <Text
                            style={{
                              fontFamily: 'Nunito_600SemiBold',
                              fontSize: 14,
                              color: passed ? C.accent : C.danger,
                            }}
                          >
                            {passed ? 'Promovat' : 'Nepromovat'}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontFamily: 'Nunito_400Regular',
                            fontSize: 12,
                            color: C.textTertiary,
                            marginTop: 3,
                          }}
                        >
                          {session.correct_answers}
                          {'/'}
                          {session.total_questions}
                          {' corecte  ·  '}
                          {accuracy}
                          {'%  ·  '}
                          {durationDisplay}
                        </Text>
                        <Text
                          style={{
                            fontFamily: 'Nunito_400Regular',
                            fontSize: 11,
                            color: C.textTertiary,
                            marginTop: 2,
                          }}
                        >
                          {dateDisplay}
                        </Text>
                      </View>
                    </View>
                  </AnimatedPressable>
                </AnimatedListItem>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
