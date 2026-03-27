import { MomentOfDepthInterstitialRN } from "@/components/onboarding/MomentOfDepthInterstitialRN";
import { buildPersonalityQuestions, QUESTION_SHELLS } from "@/data/questions";
import {
  calculateArchetype,
  getCategoryFromArchetype,
  maakTokens,
  type DimensionKey,
  type PersonalityTestResult,
} from "@maak/core";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** After N answers — Moment of Depth (plan: 5–10). */
const MOMENT_DEPTH_AFTER = 7;

type Props = { onComplete: (result: PersonalityTestResult) => void };

export function PersonalityTestRN({ onComplete }: Props) {
  const { t, i18n } = useTranslation();
  const questions = useMemo(() => buildPersonalityQuestions(t), [t, i18n.language]);
  const shuffledQuestions = useMemo(() => shuffleArray(questions), [questions]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showMomentOfDepth, setShowMomentOfDepth] = useState(false);
  const momentDepthTriggeredRef = useRef(false);

  const currentQuestion = shuffledQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === shuffledQuestions.length;

  const setAnswer = (value: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => {
      const next = { ...prev, [currentQuestion.id]: value };
      const nextCount = Object.keys(next).length;

      if (!momentDepthTriggeredRef.current && nextCount === MOMENT_DEPTH_AFTER) {
        momentDepthTriggeredRef.current = true;
        setTimeout(() => setShowMomentOfDepth(true), 380);
        return next;
      }

      if (currentIndex < shuffledQuestions.length - 1) {
        setTimeout(() => setCurrentIndex((i) => i + 1), 350);
      }
      return next;
    });
  };

  const dismissMomentOfDepth = () => {
    setShowMomentOfDepth(false);
    if (currentIndex < shuffledQuestions.length - 1) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 200);
    }
  };

  const computeResult = (): PersonalityTestResult => {
    const scores: Record<DimensionKey, number> = {
      ei: 0,
      sn: 0,
      tf: 0,
      jp: 0,
      at: 0,
    };
    const dimensionCounts: Record<DimensionKey, number> = {
      ei: 0,
      sn: 0,
      tf: 0,
      jp: 0,
      at: 0,
    };

    QUESTION_SHELLS.forEach((q) => {
      const answerValue = answers[q.id];
      if (answerValue) {
        scores[q.dimension] += answerValue;
        dimensionCounts[q.dimension]++;
      }
    });

    (Object.keys(scores) as DimensionKey[]).forEach((k) => {
      const c = dimensionCounts[k] || 1;
      const avg = scores[k] / c;
      scores[k] = Math.round(((avg - 1) / 4) * 100);
    });

    const archetype = calculateArchetype(scores);
    const category = getCategoryFromArchetype(archetype);
    const answersArray = QUESTION_SHELLS.map((q) => answers[q.id] || 0);

    return { scores, category, archetype, answers: answersArray };
  };

  const handleSubmit = () => {
    if (!isComplete) {
      Alert.alert(t("common.error"), t("personality.complete_all_questions"));
      return;
    }
    onComplete(computeResult());
  };

  const dimKey = currentQuestion?.dimension;
  const dimLeft = dimKey ? t(`personality.dimensions.${dimKey}.left`) : null;
  const dimRight = dimKey ? t(`personality.dimensions.${dimKey}.right`) : null;
  const progress =
    shuffledQuestions.length > 0
      ? Math.round(((currentIndex + 1) / shuffledQuestions.length) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <MomentOfDepthInterstitialRN visible={showMomentOfDepth} onContinue={dismissMomentOfDepth} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brandRow}>
          <Text style={styles.brandHeart}>♥</Text>
          <Text style={styles.brand}>MÄÄK</Text>
        </View>
        <Text style={styles.h1}>{t("personality.testTitle")}</Text>
        <Text style={styles.muted}>{t("mobile.personality_test.subtitle")}</Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {shuffledQuestions.length}
        </Text>

        {currentQuestion && dimLeft && dimRight ? (
          <View style={styles.card}>
            <Text style={styles.q}>{currentQuestion.text}</Text>
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleSide}>{dimLeft}</Text>
              <Text style={styles.scaleSide}>{dimRight}</Text>
            </View>
            <View style={styles.scaleRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  style={[
                    styles.scaleBtn,
                    answers[currentQuestion.id] === n && styles.scaleBtnActive,
                  ]}
                  onPress={() => setAnswer(n)}
                >
                  <Text
                    style={[
                      styles.scaleNum,
                      answers[currentQuestion.id] === n && styles.scaleNumActive,
                    ]}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {isComplete ? (
          <Pressable style={styles.primaryBtn} onPress={handleSubmit}>
            <Text style={styles.primaryBtnText}>{t("mobile.personality_test.see_result")}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: maakTokens.background },
  scroll: { padding: 20, paddingBottom: 40 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  brandHeart: { fontSize: 22, color: maakTokens.primary },
  brand: { fontSize: 18, fontWeight: "700", color: maakTokens.foreground },
  h1: { fontSize: 24, fontWeight: "700", color: maakTokens.foreground, marginBottom: 4 },
  muted: { fontSize: 14, color: maakTokens.mutedForeground, marginBottom: 16 },
  progressBar: {
    height: 8,
    backgroundColor: maakTokens.muted,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: maakTokens.primary,
    borderRadius: 4,
  },
  progressText: { fontSize: 12, color: maakTokens.mutedForeground, marginBottom: 16 },
  card: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusXl,
    padding: 20,
    borderWidth: 1,
    borderColor: maakTokens.border,
    marginBottom: 20,
  },
  q: { fontSize: 17, lineHeight: 24, color: maakTokens.foreground, marginBottom: 16 },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  scaleSide: { fontSize: 11, color: maakTokens.mutedForeground, flex: 1 },
  scaleRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  scaleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: maakTokens.radiusMd,
    backgroundColor: maakTokens.muted,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  scaleBtnActive: {
    borderColor: maakTokens.primary,
    backgroundColor: `${maakTokens.primary}22`,
  },
  scaleNum: { fontSize: 16, fontWeight: "600", color: maakTokens.foreground },
  scaleNumActive: { color: maakTokens.primary },
  primaryBtn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 16,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
  },
  primaryBtnText: { color: maakTokens.primaryForeground, fontSize: 16, fontWeight: "600" },
});
