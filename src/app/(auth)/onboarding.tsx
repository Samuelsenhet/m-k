import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const steps = [
  {
    title: "Välkommen till MĀĀK",
    description: "Den smarta dejtingappen som matchar dig baserat på personlighet",
  },
  {
    title: "Ta personlighetstestet",
    description: "Svara på 30 frågor för att upptäcka din personlighetstyp",
  },
  {
    title: "Hitta din match",
    description: "Vi använder AI för att hitta personer som verkligen passar dig",
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace("/(auth)/phone-auth");
    }
  };

  const handleSkip = () => {
    router.replace("/(auth)/phone-auth");
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Hoppa över</Text>
      </Pressable>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentOffset={{ x: currentStep * width, y: 0 }}
      >
        {steps.map((step, index) => (
          <View key={index} style={[styles.slide, { width }]}>
            <View style={styles.illustrationPlaceholder}>
              <Text style={styles.illustrationText}>{index + 1}</Text>
            </View>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentStep === steps.length - 1 ? "Kom igång" : "Nästa"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f7f4",
  },
  skipButton: {
    position: "absolute",
    top: 60,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    color: "#6b6860",
    fontSize: 16,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#e8f0e7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  illustrationText: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#4b6e48",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  description: {
    fontSize: 16,
    color: "#6b6860",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d1d5db",
  },
  dotActive: {
    backgroundColor: "#4b6e48",
    width: 24,
  },
  button: {
    backgroundColor: "#4b6e48",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
