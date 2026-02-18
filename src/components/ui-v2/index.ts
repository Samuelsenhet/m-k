/** UI V2 – design system (FAS 2+). Use in new UI; do not replace existing ui/ yet. */
export {
  ButtonPrimary,
  ButtonCoral,
  ButtonSecondary,
  ButtonGhost,
  ButtonIcon,
} from "./button";
export {
  InputV2,
  inputVariants,
  InputOTPV2,
  InputOTPV2Group,
  InputOTPV2Slot,
  InputOTPV2Separator,
} from "./input";
export {
  AvatarV2,
  AvatarV2Image,
  AvatarV2Fallback,
  AvatarWithRing,
  OnlineIndicator,
} from "./avatar";
export {
  ArchetypeBadge,
  MatchTypeBadge,
  StatusBadge,
  ARCHETYPES,
  LABELS as MatchTypeLabels,
} from "./badge";
export type { ArchetypeKey, MatchTypeV2, ChatStatusV2 } from "./badge";
export {
  CardV2,
  CardV2Header,
  CardV2Title,
  CardV2Content,
  CardV2Footer,
  cardV2Variants,
  ChatListItemCard,
  BestMatchCard,
  MatchProfileCardLight,
  MatchProfileCardDark,
  InterestChipV2,
} from "./card";
export { MatchCelebration, ActionButtons } from "./match";
export type { MatchCelebrationProps, ActionButtonsProps } from "./match";
export { BottomNavV2, OnlineBannerV2 } from "./navigation";
export {
  ChatBubbleV2,
  ChatInputBarV2,
  ChatHeaderV2,
  ChatEmptyStateV2,
} from "./chat";
export type { ChatBubbleV2Message, ChatBubbleV2Variant } from "./chat";
export { UiV2Demo } from "./UiV2Demo";
