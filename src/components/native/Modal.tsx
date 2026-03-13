import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";

export interface ModalRef {
  open: () => void;
  close: () => void;
}

interface ModalProps {
  title?: string;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onClose?: () => void;
  showCloseButton?: boolean;
  enablePanDownToClose?: boolean;
}

const COLORS = {
  background: "#1A1A1A",
  handle: "#444444",
  title: "#FFFFFF",
  closeButton: "#666666",
};

export const Modal = forwardRef<ModalRef, ModalProps>(
  (
    {
      title,
      children,
      snapPoints: customSnapPoints,
      onClose,
      showCloseButton = true,
      enablePanDownToClose = true,
    },
    ref
  ) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => customSnapPoints ?? ["50%", "90%"], [customSnapPoints]);

    useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.expand(),
      close: () => bottomSheetRef.current?.close(),
    }));

    const handleClose = useCallback(() => {
      bottomSheetRef.current?.close();
      onClose?.();
    }, [onClose]);

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.6}
        />
      ),
      []
    );

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
        onClose={onClose}
      >
        <BottomSheetView style={styles.container}>
          {(title || showCloseButton) && (
            <View style={styles.header}>
              {title && <Text style={styles.title}>{title}</Text>}
              {showCloseButton && (
                <Pressable onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.closeButton} />
                </Pressable>
              )}
            </View>
          )}
          <View style={styles.content}>{children}</View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

Modal.displayName = "Modal";

const styles = StyleSheet.create({
  background: {
    backgroundColor: COLORS.background,
  },
  handleIndicator: {
    backgroundColor: COLORS.handle,
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  title: {
    color: COLORS.title,
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
});
