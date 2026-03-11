import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";

export default function PhoneAuthScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) return;
    setLoading(true);
    // TODO: Integrate with Supabase phone auth
    setTimeout(() => {
      setStep("otp");
      setLoading(false);
    }, 1000);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    // TODO: Verify OTP with Supabase
    setTimeout(() => {
      setLoading(false);
      router.replace("/(tabs)");
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Tillbaka</Text>
        </Pressable>

        <Text style={styles.title}>
          {step === "phone" ? "Ange ditt telefonnummer" : "Verifiera din kod"}
        </Text>
        <Text style={styles.subtitle}>
          {step === "phone"
            ? "Vi skickar en verifieringskod via SMS"
            : `Vi skickade en kod till ${phoneNumber}`}
        </Text>

        {step === "phone" ? (
          <TextInput
            style={styles.input}
            placeholder="+46 70 123 45 67"
            placeholderTextColor="#9ca3af"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoFocus
          />
        ) : (
          <TextInput
            style={styles.input}
            placeholder="123456"
            placeholderTextColor="#9ca3af"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        )}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={step === "phone" ? handleSendOtp : handleVerifyOtp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Vänta..."
              : step === "phone"
                ? "Skicka kod"
                : "Verifiera"}
          </Text>
        </Pressable>

        {step === "otp" && (
          <Pressable onPress={() => setStep("phone")} style={styles.changeLink}>
            <Text style={styles.changeLinkText}>Ändra telefonnummer</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f7f4",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 24,
  },
  backButtonText: {
    color: "#4b6e48",
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b6860",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#4b6e48",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  changeLink: {
    marginTop: 16,
    alignItems: "center",
  },
  changeLinkText: {
    color: "#4b6e48",
    fontSize: 14,
  },
});
