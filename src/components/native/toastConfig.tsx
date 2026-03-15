import { View, Text, StyleSheet } from "react-native";
import ToastMessage, { ToastConfig, ToastConfigParams, BaseToastProps } from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

export const COLORS = {
  success: "#22C55E",
  error: "#EF4444",
  warning: "#EAB308",
  info: "#3B82F6",
  background: "#1A1A1A",
  text: "#FFFFFF",
  secondaryText: "#AAAAAA",
};

interface CustomToastProps extends BaseToastProps {
  text1?: string;
  text2?: string;
}

const toastStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  title: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  message: { color: COLORS.secondaryText, fontSize: 12, marginTop: 2 },
});

function createToastComponent(
  iconName: keyof typeof Ionicons.glyphMap,
  iconColor: string
) {
  return function ToastComponent({ text1, text2 }: CustomToastProps) {
    return (
      <View style={[toastStyles.container, { borderLeftColor: iconColor }]}>
        <View style={[toastStyles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={toastStyles.textContainer}>
          {text1 && <Text style={toastStyles.title}>{text1}</Text>}
          {text2 && <Text style={toastStyles.message}>{text2}</Text>}
        </View>
      </View>
    );
  };
}

export const toastConfig: ToastConfig = {
  success: (props: ToastConfigParams<CustomToastProps>) =>
    createToastComponent("checkmark-circle", COLORS.success)(props),
  error: (props: ToastConfigParams<CustomToastProps>) =>
    createToastComponent("alert-circle", COLORS.error)(props),
  warning: (props: ToastConfigParams<CustomToastProps>) =>
    createToastComponent("warning", COLORS.warning)(props),
  info: (props: ToastConfigParams<CustomToastProps>) =>
    createToastComponent("information-circle", COLORS.info)(props),
};

export const toast = {
  success: (title: string, message?: string) => {
    ToastMessage.show({ type: "success", text1: title, text2: message });
  },
  error: (title: string, message?: string) => {
    ToastMessage.show({ type: "error", text1: title, text2: message });
  },
  warning: (title: string, message?: string) => {
    ToastMessage.show({ type: "warning", text1: title, text2: message });
  },
  info: (title: string, message?: string) => {
    ToastMessage.show({ type: "info", text1: title, text2: message });
  },
};
