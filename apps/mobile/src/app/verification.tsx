import { VerificationWizardRN } from "@/components/verification/VerificationWizardRN";
import { useRouter } from "expo-router";

export default function VerificationScreen() {
  const router = useRouter();
  return <VerificationWizardRN onDone={() => router.back()} onSkip={() => router.back()} />;
}
