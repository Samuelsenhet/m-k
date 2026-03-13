import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  secureTextEntry?: boolean;
}

const COLORS = {
  background: "#1A1A1A",
  border: "#333333",
  borderFocus: "#D4AF37",
  borderError: "#EF4444",
  text: "#FFFFFF",
  placeholder: "#666666",
  label: "#AAAAAA",
  error: "#EF4444",
  hint: "#666666",
};

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  secureTextEntry: secureProp,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = secureProp && !showPassword;

  const getBorderColor = (): string => {
    if (error) return COLORS.borderError;
    if (isFocused) return COLORS.borderFocus;
    return COLORS.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
          isFocused && styles.inputContainerFocused,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? { paddingLeft: 0 } : undefined,
            (rightIcon || secureProp) ? { paddingRight: 0 } : undefined,
          ]}
          placeholderTextColor={COLORS.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          {...props}
        />
        {secureProp && (
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.rightIcon}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={COLORS.placeholder}
            />
          </Pressable>
        )}
        {rightIcon && !secureProp && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    color: COLORS.label,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderWidth: 2,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftIcon: {
    paddingLeft: 12,
  },
  rightIcon: {
    paddingRight: 12,
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    color: COLORS.hint,
    fontSize: 12,
    marginTop: 4,
  },
});
