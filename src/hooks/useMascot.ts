import {
  getMascotTokenForState,
  getMascotLayoutForState,
  type MascotToken,
  type MascotSize,
} from "@/lib/mascot";

export interface MascotState {
  token: MascotToken;
  size: MascotSize;
  placement: "center" | "inline";
}

/** Returns token + size + placement from design system (MaakUnifiedDesignSystem_1.jsx). */
export function useMascot(screenState: string): MascotState {
  const layout = getMascotLayoutForState(screenState);
  return {
    token: getMascotTokenForState(screenState),
    size: layout.size,
    placement: layout.placement,
  };
}
