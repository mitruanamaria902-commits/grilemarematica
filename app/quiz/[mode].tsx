import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet, apiPost } from '@/utils/api';
import { getColors } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ArrowLeft, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react-native';

interface Question {
  id: string;
  subject: string;
  chapter: string;
  difficulty: string;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  created_at: string;
}

interface RawQuestion {
  id?: string;
  text?: string;
  question?: string;
  options?: string[];
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
  correctAnswer?: string;
  correct_option?: string;
  category?: string;
  subject?: string;
  chapter?: string;
  difficulty?: string;
  explanation?: string;
  created_at?: string;
}

function normalizeQuestion(raw: RawQuestion): Question {
  const options: string[] = Array.isArray(raw.options) && raw.options.length === 4
    ? raw.options
    : [
        raw.option_a ?? '',
        raw.option_b ?? '',
        raw.option_c ?? '',
        raw.option_d ?? '',
      ];

  // correct_answer / correctAnswer may be the full text of the correct option
  // or a letter like 'a'/'b'/'c'/'d' or index '0'/'1'/'2'/'3'
  let correctOption = (raw.correct_option ?? raw.correct_answer ?? raw.correctAnswer ?? 'a').toLowerCase();

  // If it's a full-text answer, find which option it matches
  if (correctOption.length > 1) {
    const idx = options.findIndex(o => o.toLowerCase() === correctOption);
    if (idx !== -1) {
      correctOption = ['a', 'b', 'c', 'd'][idx];
    } else {
      correctOption = 'a';
    }
  }

  // If it's a digit index ('0'-'3'), convert to letter
  if (['0', '1', '2', '3'].includes(correctOption)) {
    correctOption = ['a', 'b', 'c', 'd'][Number(correctOption)];
  }

  return {
    id: String(raw.id ?? Math.random()),
    text: raw.text ?? raw.question ?? '',
    subject: raw.subject ?? raw.category ?? '',
    chapter: raw.chapter ?? '',
    difficulty: raw.difficulty ?? '',
    option_a: options[0],
    option_b: options[1],
    option_c: options[2],
    option_d: options[3],
    correct_option: correctOption,
    explanation: raw.explanation ?? '',
    created_at: raw.created_at ?? '',
  };
}

type AnswerOption = 'a' | 'b' | 'c' | 'd';

interface AnswerRecord {
  question_id: string;
  selected_option: string;
  is_correct: boolean;
}

const OPTION_LABELS: AnswerOption[] = ['a', 'b', 'c', 'd'];

function useCountdown(totalSeconds: number, active: boolean) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining < 600;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { remaining, formatted, isLow };
}

export default function QuizScreen() {
  const theme = useTheme();
  const C = getColors(theme.dark);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode: string;
    chapter?: string;
    subject?: string;
  }>();

  const mode = params.mode || 'quick';
  const isExam = mode === 'exam';
  const limit = isExam ? 30 : 10;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<AnswerOption | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const { formatted: timerDisplay, isLow } = useCountdown(120 * 60, isExam && !loading);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fetchQuestions = useCallback(async () => {
    console.log(`[Quiz] Fetching questions — mode=${mode}, chapter=${params.chapter}, subject=${params.subject}`);
    try {
      const queryParts: string[] = [`limit=${limit}`];
      if (params.subject) queryParts.push(`subject=${encodeURIComponent(params.subject)}`);
      if (params.chapter) queryParts.push(`chapter=${encodeURIComponent(params.chapter)}`);
      // NOTE: only limit/subject/chapter are supported — do NOT send mode=, adaptive=, or other params

      const query = `?${queryParts.join('&')}`;
      console.log(`[Quiz] GET /api/questions${query}`);
      const res = await apiGet<{ questions: RawQuestion[] } | RawQuestion[]>(`/api/questions${query}`);
      console.log('[Quiz] Raw response:', JSON.stringify(res)?.slice(0, 500));

      let raw: RawQuestion[];
      if (Array.isArray(res)) {
        console.log(`[Quiz] Response is bare array, length: ${res.length}`);
        raw = res;
      } else if (Array.isArray((res as any)?.questions)) {
        raw = (res as any).questions;
        console.log(`[Quiz] Response has .questions array, length: ${raw.length}`);
      } else if (Array.isArray((res as any)?.data)) {
        raw = (res as any).data;
        console.log(`[Quiz] Response has .data array, length: ${raw.length}`);
      } else {
        console.warn('[Quiz] Unexpected response shape:', JSON.stringify(res)?.slice(0, 200));
        raw = [];
      }

      const qs = raw.map(normalizeQuestion);
      setQuestions(qs);
      console.log(`[Quiz] Questions loaded: ${qs.length}`);
    } catch (e: any) {
      console.error('[Quiz] Fetch error:', e?.message);
      setError('Nu s-au putut încărca întrebările.');
    } finally {
      setLoading(false);
    }
  }, [limit, mode, params.chapter, params.subject]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const currentQuestion = questions[currentIndex];

  const animateTransition = (callback: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleSelectOption = async (option: AnswerOption) => {
    if (answered || !currentQuestion) return;
    console.log(`[Quiz] Option selected: ${option} for question ${currentQuestion.id}`);
    setSelectedOption(option);
    setAnswered(true);

    const isCorrect = option === currentQuestion.correct_option.toLowerCase();
    const record: AnswerRecord = {
      question_id: currentQuestion.id,
      selected_option: option,
      is_correct: isCorrect,
    };

    // Post progress
    try {
      console.log(`[Quiz] POST /api/progress — question_id=${currentQuestion.id}, selected=${option}, correct=${isCorrect}`);
      await apiPost('/api/progress', {
        question_id: currentQuestion.id,
        selected_option: option,
        is_correct: isCorrect,
      });
      console.log('[Quiz] Progress saved');
    } catch (e: any) {
      console.error('[Quiz] Progress save error:', e?.message);
    }

    setAnswers(prev => [...prev, record]);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      animateTransition(() => {
        setCurrentIndex(i => i + 1);
        setSelectedOption(null);
        setAnswered(false);
      });
    } else {
      // Last question — finish
      await finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setSubmitting(true);
    const allAnswers = answers;
    const correctCount = allAnswers.filter(a => a.is_correct).length;
    const total = questions.length;
    const score = total > 0 ? (correctCount / total) * 10 : 0;
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    console.log(`[Quiz] Finishing quiz — correct=${correctCount}/${total}, score=${score.toFixed(2)}, duration=${durationSeconds}s`);

    try {
      console.log('[Quiz] POST /api/exams');
      const session = await apiPost<{ id: string }>('/api/exams', {
        mode,
        total_questions: total,
        correct_answers: correctCount,
        score: parseFloat(score.toFixed(2)),
        duration_seconds: durationSeconds,
      });
      console.log('[Quiz] Exam session created:', session?.id);

      router.replace({
        pathname: '/results/[sessionId]',
        params: {
          sessionId: session?.id || 'local',
          correct: String(correctCount),
          total: String(total),
          score: score.toFixed(2),
          duration: String(durationSeconds),
          mode,
          chapter: params.chapter || '',
          subject: params.subject || '',
        },
      });
    } catch (e: any) {
      console.error('[Quiz] Exam save error:', e?.message);
      // Navigate anyway with local data
      router.replace({
        pathname: '/results/[sessionId]',
        params: {
          sessionId: 'local',
          correct: String(correctCount),
          total: String(total),
          score: score.toFixed(2),
          duration: String(durationSeconds),
          mode,
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionStyle = (option: AnswerOption) => {
    if (!answered) {
      return {
        backgroundColor: C.surface,
        borderColor: C.border,
      };
    }
    const correctOpt = currentQuestion?.correct_option?.toLowerCase();
    if (option === correctOpt) {
      return {
        backgroundColor: C.accentMuted,
        borderColor: C.accent,
      };
    }
    if (option === selectedOption && option !== correctOpt) {
      return {
        backgroundColor: C.dangerMuted,
        borderColor: C.danger,
      };
    }
    return {
      backgroundColor: C.surface,
      borderColor: C.border,
      opacity: 0.6,
    };
  };

  const getOptionTextColor = (option: AnswerOption) => {
    if (!answered) return C.text;
    const correctOpt = currentQuestion?.correct_option?.toLowerCase();
    if (option === correctOpt) return C.accent;
    if (option === selectedOption && option !== correctOpt) return C.danger;
    return C.textSecondary;
  };

  const getOptionIcon = (option: AnswerOption) => {
    if (!answered) return null;
    const correctOpt = currentQuestion?.correct_option?.toLowerCase();
    if (option === correctOpt) return <CheckCircle size={18} color={C.accent} />;
    if (option === selectedOption && option !== correctOpt) return <XCircle size={18} color={C.danger} />;
    return null;
  };

  const optionTexts: Record<AnswerOption, string> = currentQuestion
    ? {
        a: currentQuestion.option_a,
        b: currentQuestion.option_b,
        c: currentQuestion.option_c,
        d: currentQuestion.option_d,
      }
    : { a: '', b: '', c: '', d: '' };

  const progressPct = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 14, color: C.textSecondary, marginTop: 12 }}>
          Se încarcă întrebările...
        </Text>
      </View>
    );
  }

  if (!loading && (error || questions.length === 0)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          gap: 12,
        }}
      >
        <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 18, color: C.text, textAlign: 'center' }}>
          {error || 'Nu există întrebări disponibile'}
        </Text>
        <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center' }}>
          Verifică conexiunea și încearcă din nou.
        </Text>
        <AnimatedPressable
          onPress={() => router.back()}
          style={{
            backgroundColor: C.primary,
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
            marginTop: 8,
          }}
        >
          <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#FFFFFF' }}>
            Înapoi
          </Text>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* Top bar */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: C.surface,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AnimatedPressable
            onPress={() => {
              console.log('[Quiz] Back button pressed');
              router.back();
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: C.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} color={C.text} />
          </AnimatedPressable>

          <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: C.textSecondary }}>
            {currentIndex + 1}
            {' / '}
            {questions.length}
          </Text>

          {isExam ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: isLow ? C.dangerMuted : C.primaryMuted,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Clock size={14} color={isLow ? C.danger : C.primary} />
              <Text
                style={{
                  fontFamily: 'Nunito_700Bold',
                  fontSize: 14,
                  color: isLow ? C.danger : C.primary,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {timerDisplay}
              </Text>
            </View>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {/* Progress bar */}
        <View
          style={{
            height: 5,
            backgroundColor: C.surfaceSecondary,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              height: 5,
              width: `${progressPct}%`,
              backgroundColor: C.primary,
              borderRadius: 3,
            }}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, gap: 20 }}>
          {/* Chapter tag */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View
              style={{
                backgroundColor: C.primaryMuted,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: C.primary }}>
                {currentQuestion.subject}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: C.surfaceSecondary,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 11, color: C.textSecondary }}>
                {currentQuestion.chapter}
              </Text>
            </View>
          </View>

          {/* Question text */}
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: C.border,
              boxShadow: '0 2px 8px rgba(59,91,219,0.05)',
            }}
          >
            <Text
              style={{
                fontFamily: 'Nunito_600SemiBold',
                fontSize: 17,
                color: C.text,
                lineHeight: 26,
              }}
              selectable
            >
              {currentQuestion.text}
            </Text>
          </View>

          {/* Options */}
          <View style={{ gap: 10 }}>
            {OPTION_LABELS.map(option => {
              const optStyle = getOptionStyle(option);
              const textColor = getOptionTextColor(option);
              const icon = getOptionIcon(option);
              const optText = optionTexts[option];

              return (
                <AnimatedPressable
                  key={option}
                  onPress={() => handleSelectOption(option)}
                  disabled={answered}
                  style={{
                    backgroundColor: optStyle.backgroundColor,
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1.5,
                    borderColor: optStyle.borderColor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    opacity: (optStyle as any).opacity ?? 1,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: answered
                        ? (option === currentQuestion?.correct_option?.toLowerCase()
                          ? C.accentMuted
                          : option === selectedOption
                            ? C.dangerMuted
                            : C.surfaceSecondary)
                        : C.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Nunito_700Bold',
                        fontSize: 13,
                        color: answered
                          ? (option === currentQuestion?.correct_option?.toLowerCase()
                            ? C.accent
                            : option === selectedOption
                              ? C.danger
                              : C.textTertiary)
                          : C.primary,
                        textTransform: 'uppercase',
                      }}
                    >
                      {option}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: 'Nunito_500Medium',
                      fontSize: 15,
                      color: textColor,
                      flex: 1,
                      lineHeight: 22,
                    }}
                  >
                    {optText}
                  </Text>
                  {icon}
                </AnimatedPressable>
              );
            })}
          </View>

          {/* Explanation */}
          {answered && currentQuestion.explanation ? (
            <View
              style={{
                backgroundColor: C.primaryMuted,
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: C.primaryBorder,
                gap: 6,
              }}
            >
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 13, color: C.primary }}>
                Explicație
              </Text>
              <Text
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: 14,
                  color: C.textSecondary,
                  lineHeight: 21,
                }}
                selectable
              >
                {currentQuestion.explanation}
              </Text>
            </View>
          ) : null}

          {/* Next button */}
          {answered && (
            <AnimatedPressable
              onPress={handleNext}
              disabled={submitting}
              style={{
                backgroundColor: C.primary,
                borderRadius: 14,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#FFFFFF' }}>
                    {currentIndex < questions.length - 1 ? 'Următoarea întrebare' : 'Vezi rezultatele'}
                  </Text>
                  <ChevronRight size={18} color="#FFFFFF" />
                </>
              )}
            </AnimatedPressable>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
