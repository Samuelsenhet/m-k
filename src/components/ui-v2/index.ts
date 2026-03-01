/** UI V2 – MAAK design system. Prefer these components; use ui/ only for primitives with no ui-v2 equivalent (Sheet, Tabs, Select, Label, etc.). */
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
  InputSearchV2,
  InputOTPV2,
  InputOTPV2Group,
  InputOTPV2Slot,
  InputOTPV2Separator,
} from "./input";
export type { InputV2Props, InputSearchV2Props } from "./input";
export {
  AvatarV2,
  AvatarV2Image,
  AvatarV2Fallback,
  AvatarWithRing,
  OnlineIndicator,
  ArchetypeAvatar,
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
export { MatchCelebration, ActionButtons, MatchCardClassic, MatchListItem, MatchListItemCard } from "./match";
export type {
  MatchCelebrationProps,
  ActionButtonsProps,
  MatchCardClassicProps,
  MatchCardClassicProfile,
  MatchListItemProps,
  MatchListItemCardProps,
} from "./match";
export { BottomNavV2, OnlineBannerV2, ProgressSteps } from "./navigation";
export {
  ChatBubbleV2,
  ChatInputBarV2,
  ChatHeaderV2,
  ChatEmptyStateV2,
  AIChatBubble,
} from "./chat";
export type { ChatBubbleV2Message, ChatBubbleV2Variant, AIChatBubbleProps } from "./chat";
export { EmptyStateWithMascot, LoadingStateWithMascot } from "./empty";
export type { EmptyStateWithMascotProps, EmptyStateWithMascotAction, LoadingStateWithMascotProps } from "./empty";
export {
  VideoCallScreen,
  PhotoUploadScreen,
  MatchListPage,
  ProfilePageDark,
} from "./screens";
export type {
  VideoCallScreenProps,
  PhotoUploadScreenProps,
  MatchListPageProps,
  MatchListPageMatch,
  MatchListFilter,
  ProfilePageDarkProps,
  ProfilePageDarkProfile,
} from "./screens";
export { UiV2Demo } from "./UiV2Demo";
export { VerifiedBadge } from "@/components/ui/verified-badge";