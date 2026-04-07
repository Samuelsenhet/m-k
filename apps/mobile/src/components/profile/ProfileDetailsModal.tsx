import {
  ARCHETYPE_CODES_BY_CATEGORY,
  ARCHETYPE_INFO,
  CATEGORY_INFO,
  maakTokens,
  type ArchetypeCode,
  type PersonalityCategory,
} from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, Modal } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getInstagramUsername, getLinkedInUsername } from "@/lib/socialUsernames";

const FONT_HEADING = "PlayfairDisplay_700Bold";
const GRID_SELECTION_BORDER = "#2d5a3d";

const CATEGORY_CARD: Record<PersonalityCategory, { bg: string; border: string }> = {
  DIPLOMAT: { bg: "#E8EEFC", border: "rgba(59, 130, 246, 0.35)" },
  STRATEGER: { bg: "#EDE9FC", border: "rgba(139, 92, 246, 0.35)" },
  BYGGARE: { bg: "#DCF5E3", border: "rgba(75, 110, 72, 0.45)" },
  UPPTÄCKARE: { bg: "#FDF3D6", border: "rgba(245, 158, 11, 0.4)" },
};

export interface ProfileDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  profile: {
    bio: string | null;
    work: string | null;
    education?: string | null;
    gender?: string | null;
    height: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    dating_intention?: string | null;
    dating_intention_extra?: string | null;
    relationship_type?: string | null;
    relationship_type_extra?: string | null;
  };
  archetypeCode: ArchetypeCode | null;
  interestsList: string[];
  formattedHeight: string | null;
  age: number | null;
  locationLabel: string | null;
}

export function ProfileDetailsModal({
  visible,
  onClose,
  onEdit,
  profile,
  archetypeCode,
  interestsList,
  formattedHeight,
  age,
  locationLabel,
}: ProfileDetailsModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const archetypeInfo = archetypeCode ? ARCHETYPE_INFO[archetypeCode] : null;
  const cat = archetypeInfo?.category ?? null;
  const catStyle = cat ? CATEGORY_CARD[cat] : { bg: maakTokens.muted, border: maakTokens.border };

  const localizedCategoryI18n =
    cat != null
      ? {
          title: t(`personality.guide_category_${cat}_title`, {
            defaultValue: CATEGORY_INFO[cat].title,
          }),
          description: t(`personality.guide_category_${cat}_desc`, {
            defaultValue: CATEGORY_INFO[cat].description,
          }),
        }
      : null;

  const localizedUserArchetype =
    archetypeCode && archetypeInfo
      ? {
          title: t(`personality.archetypes.${archetypeCode}.title`, {
            defaultValue: archetypeInfo.title,
          }),
          description: t(`personality.archetypes.${archetypeCode}.description`, {
            defaultValue: archetypeInfo.description,
          }),
          strengths: (() => {
            const raw = t(`personality.archetypes.${archetypeCode}.strengths`, {
              returnObjects: true,
            });
            return Array.isArray(raw) ? (raw as string[]) : archetypeInfo.strengths;
          })(),
          loveStyle: t(`personality.archetypes.${archetypeCode}.loveStyle`, {
            defaultValue: archetypeInfo.loveStyle,
          }),
        }
      : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
      onRequestClose={onClose}
    >
      <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
        <Pressable
          style={styles.modalDismiss}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
        >
          <View style={styles.modalHandleBar} />
          <Ionicons name="chevron-down" size={24} color={maakTokens.mutedForeground} />
        </Pressable>
        <ScrollView
          contentContainerStyle={[styles.modalScroll, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.modalTitle}>{t("profile.about_me")}</Text>
          <Text style={styles.bioBlock}>{profile.bio || t("profile.bio_placeholder")}</Text>

          <Text style={styles.sectionTitleSerif}>{t("profile.interests_title")}</Text>
          <View style={styles.chipRow}>
            {interestsList.length > 0 ? (
              interestsList.map((label) => (
                <View key={label} style={styles.chip}>
                  <Text style={styles.chipTxt}>{label}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.mutedSm}>{t("profile.interests_empty")}</Text>
            )}
          </View>

          {(profile.dating_intention ||
            profile.relationship_type ||
            profile.dating_intention_extra ||
            profile.relationship_type_extra) && (
            <View style={styles.datingBlock}>
              {profile.dating_intention ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.sectionTitleSerif}>{t("profile.dating_intention_title")}</Text>
                  <Text style={styles.bodyStrong}>
                    {t(`profile.dating_${profile.dating_intention}` as "profile.dating_livspartner")}
                  </Text>
                  {profile.dating_intention_extra ? (
                    <Text style={styles.mutedSm}>{profile.dating_intention_extra}</Text>
                  ) : null}
                </View>
              ) : null}
              {profile.relationship_type ? (
                <View>
                  <Text style={styles.sectionTitleSerif}>{t("profile.relationship_type_title")}</Text>
                  <Text style={styles.bodyStrong}>
                    {t(`profile.relation_${profile.relationship_type}` as "profile.relation_monogam")}
                  </Text>
                  {profile.relationship_type_extra ? (
                    <Text style={styles.mutedSm}>{profile.relationship_type_extra}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          )}

          {archetypeInfo && cat ? (
            <View style={styles.personalityBlock}>
              <Text style={styles.sectionTitleGreen}>{t("personality.main_category_label")}</Text>
              <Text style={styles.sectionSub}>{t("personality.main_category_sub")}</Text>
              <View
                style={[
                  styles.categoryCard,
                  { backgroundColor: catStyle.bg, borderColor: catStyle.border },
                ]}
              >
                <Text style={styles.catEmoji}>{CATEGORY_INFO[cat].emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catTitleSerif}>{localizedCategoryI18n?.title}</Text>
                  <Text style={styles.mutedSm}>{localizedCategoryI18n?.description}</Text>
                </View>
              </View>

              <Text style={[styles.sectionTitleGreen, { marginTop: 20 }]}>
                {t("personality.four_archetypes_label")}
              </Text>
              <Text style={styles.sectionSub}>{t("personality.four_archetypes_sub")}</Text>
              <Text style={styles.testLine}>
                {t("personality.test_result_line", {
                  title: localizedUserArchetype?.title,
                  code: archetypeInfo.name,
                  category: localizedCategoryI18n?.title,
                })}
              </Text>
              <View style={styles.grid2}>
                {ARCHETYPE_CODES_BY_CATEGORY[cat].map((code) => {
                  const info = ARCHETYPE_INFO[code];
                  const isUser = archetypeCode === code;
                  const gridTitle = t(`personality.archetypes.${code}.title`, {
                    defaultValue: info.title,
                  });
                  return (
                    <View
                      key={code}
                      style={[
                        styles.gridCell,
                        { backgroundColor: catStyle.bg, borderColor: catStyle.border },
                        isUser && { borderColor: GRID_SELECTION_BORDER, borderWidth: 3 },
                      ]}
                    >
                      <Text style={styles.gridEmoji}>{info.emoji}</Text>
                      <Text style={styles.gridTitle} numberOfLines={2}>
                        {gridTitle}
                        {isUser ? (
                          <Text style={styles.gridYour}>
                            {" "}
                            ({t("personality.your_type")})
                          </Text>
                        ) : null}
                      </Text>
                      <Text style={styles.gridCode}>{info.name}</Text>
                    </View>
                  );
                })}
              </View>

              <Text style={[styles.sectionTitleGreen, { marginTop: 20 }]}>
                {t("personality.your_archetype_card")}
              </Text>
              <View
                style={[
                  styles.archetypeCard,
                  { backgroundColor: catStyle.bg, borderColor: catStyle.border },
                ]}
              >
                <View style={styles.archetypeHead}>
                  <Text style={styles.bigEmoji}>{archetypeInfo.emoji}</Text>
                  <View>
                    <Text style={styles.archTitleSerif}>{localizedUserArchetype?.title}</Text>
                    <Text style={styles.mutedSm}>{archetypeInfo.name}</Text>
                  </View>
                </View>
                <Text style={styles.desc}>{localizedUserArchetype?.description}</Text>
                <Text style={[styles.sectionTitleGreen, { fontSize: 15, marginTop: 12 }]}>
                  {t("profile.strengths")}
                </Text>
                <View style={styles.chipRow}>
                  {(localizedUserArchetype?.strengths ?? []).map((s, i) => (
                    <View key={i} style={styles.strengthPill}>
                      <Text style={styles.strengthPillTxt}>{s}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.relationsBox}>
                  <Text style={styles.relationsTxt}>
                    <Text style={styles.bodyStrong}>{t("profile.in_relationships_label")}</Text>
                    {localizedUserArchetype?.loveStyle}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.factGrid}>
            {profile.work ? (
              <View style={styles.factCell}>
                <Text style={styles.factLabel}>{t("profile.fact_work")}</Text>
                <Text style={styles.factVal}>{profile.work}</Text>
              </View>
            ) : null}
            {profile.education ? (
              <View style={styles.factCell}>
                <Text style={styles.factLabel}>{t("profile.fact_education")}</Text>
                <Text style={styles.factVal}>{profile.education}</Text>
              </View>
            ) : null}
            {locationLabel ? (
              <View style={styles.factCell}>
                <Text style={styles.factLabel}>{t("profile.fact_location")}</Text>
                <Text style={styles.factVal}>{locationLabel}</Text>
              </View>
            ) : null}
            {age != null ? (
              <View style={styles.factCell}>
                <Text style={styles.factLabel}>{t("profile.fact_age")}</Text>
                <Text style={styles.factVal}>{t("profile.fact_age_years", { age })}</Text>
              </View>
            ) : null}
            {formattedHeight ? (
              <View style={styles.factCell}>
                <Text style={styles.factLabel}>{t("profile.fact_height")}</Text>
                <Text style={styles.factVal}>{formattedHeight}</Text>
              </View>
            ) : null}
            {profile.gender ? (
              <View style={styles.factCell}>
                <Text style={styles.factLabel}>{t("profile.fact_gender")}</Text>
                <Text style={styles.factVal}>{profile.gender}</Text>
              </View>
            ) : null}
            {String(profile.instagram ?? "").trim() ? (
              <View style={styles.factCell}>
                <Text style={styles.factLabel}>{t("profile.fact_instagram")}</Text>
                <Text style={styles.factVal}>
                  @{getInstagramUsername(String(profile.instagram))}
                </Text>
              </View>
            ) : null}
            {String(profile.linkedin ?? "").trim() ? (
              <View style={styles.factCell}>
                <Text style={styles.factLabel}>{t("profile.fact_linkedin")}</Text>
                <Text style={styles.factVal}>{getLinkedInUsername(String(profile.linkedin))}</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              onClose();
              onEdit();
            }}
            style={({ pressed }) => [
              styles.primaryBtnWrap,
              styles.primaryBtnModalTop,
              pressed && styles.pressedOpacity,
            ]}
          >
            <LinearGradient
              colors={[maakTokens.gradientPrimary[0], maakTokens.gradientPrimary[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.primaryBtnGrad, styles.primaryBtnModalH]}
            >
              <Ionicons name="create-outline" size={20} color={maakTokens.primaryForeground} />
              <Text style={styles.primaryBtnTxt}>{t("profile.edit_profile")}</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, backgroundColor: "#FAF9F8" },
  modalDismiss: { alignItems: "center", paddingTop: 6, paddingBottom: 4 },
  modalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: maakTokens.mutedForeground,
    opacity: 0.35,
    marginBottom: 4,
  },
  modalScroll: { paddingHorizontal: 20 },
  modalTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 12,
  },
  bioBlock: { fontSize: 15, lineHeight: 22, color: maakTokens.mutedForeground, marginBottom: 20 },
  sectionTitleSerif: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 8,
  },
  sectionTitleGreen: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.primary,
    marginBottom: 8,
  },
  sectionSub: { fontSize: 13, color: maakTokens.mutedForeground, marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: maakTokens.muted,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  chipTxt: { fontSize: 13, color: maakTokens.foreground },
  mutedSm: { fontSize: 14, color: maakTokens.mutedForeground },
  bodyStrong: { fontSize: 15, fontWeight: "600", color: maakTokens.foreground },
  datingBlock: { marginBottom: 8 },
  personalityBlock: { marginBottom: 8 },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: maakTokens.radiusXl,
    borderWidth: 1,
  },
  catEmoji: { fontSize: 36 },
  catTitleSerif: {
    fontFamily: FONT_HEADING,
    fontSize: 20,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  testLine: { fontSize: 14, color: maakTokens.foreground, marginBottom: 12, lineHeight: 20 },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCell: { width: "47%", padding: 10, borderRadius: maakTokens.radiusLg, borderWidth: 1 },
  gridEmoji: { fontSize: 22, marginBottom: 4 },
  gridTitle: { fontSize: 13, fontWeight: "700", color: maakTokens.foreground },
  gridYour: { fontSize: 11, fontWeight: "400", color: maakTokens.mutedForeground },
  gridCode: { fontSize: 11, color: maakTokens.mutedForeground, marginTop: 2 },
  archetypeCard: { padding: 14, borderRadius: maakTokens.radiusXl, borderWidth: 1 },
  archetypeHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  bigEmoji: { fontSize: 40 },
  archTitleSerif: {
    fontFamily: FONT_HEADING,
    fontSize: 20,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  desc: { fontSize: 14, color: maakTokens.mutedForeground, lineHeight: 20 },
  strengthPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: maakTokens.muted,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  strengthPillTxt: { fontSize: 12, color: maakTokens.foreground, fontWeight: "500" },
  relationsBox: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: maakTokens.border },
  relationsTxt: { fontSize: 14, color: maakTokens.mutedForeground, lineHeight: 20 },
  factGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8, marginBottom: 20 },
  factCell: { width: "47%" },
  factLabel: { fontSize: 11, color: maakTokens.mutedForeground, marginBottom: 4 },
  factVal: { fontSize: 14, fontWeight: "600", color: maakTokens.foreground },
  primaryBtnWrap: {
    marginTop: 14,
    borderRadius: maakTokens.radiusXl,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  primaryBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryBtnModalH: { minHeight: 48 },
  primaryBtnModalTop: { marginTop: 8 },
  pressedOpacity: { opacity: 0.92 },
  primaryBtnTxt: { color: maakTokens.primaryForeground, fontSize: 17, fontWeight: "600" },
});
