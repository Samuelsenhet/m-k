import ToastMessage from "react-native-toast-message";
import { toastConfig } from "./toastConfig";

export function ToastProvider() {
  return <ToastMessage config={toastConfig} position="top" topOffset={60} />;
}
