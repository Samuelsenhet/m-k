import * as React from "react";
import {
  ButtonPrimary,
  ButtonCoral,
  ButtonSecondary,
  ButtonGhost,
  ButtonIcon,
} from "./button";
import { InputV2, InputOTPV2, InputOTPV2Group, InputOTPV2Slot } from "./input";
import {
  AvatarV2,
  AvatarV2Image,
  AvatarV2Fallback,
  AvatarWithRing,
  OnlineIndicator,
} from "./avatar";
import { ArchetypeBadge, MatchTypeBadge, StatusBadge } from "./badge";
import {
  CardV2,
  CardV2Header,
  CardV2Title,
  CardV2Content,
  ChatListItemCard,
  BestMatchCard,
  MatchProfileCardLight,
  MatchProfileCardDark,
} from "./card";
import {
  VideoCallScreen,
  PhotoUploadScreen,
  MatchListPage,
  ProfilePageDark,
} from "./screens";
import { MessageCircle, Sparkles } from "lucide-react";

/**
 * Demo/preview for UI V2 (FAS 2 + FAS 3). Design-system only; no screens changed.
 */
export function UiV2Demo() {
  const [otp, setOtp] = React.useState("");

  return (
    <div className="flex flex-col gap-8 p-6 max-w-md mx-auto bg-background">
      <h2 className="text-title font-heading font-semibold text-foreground">
        UI V2 – Buttons, Input, Avatar & Badges
      </h2>

      <section className="flex flex-col gap-3">
        <h3 className="text-label font-medium text-muted-foreground">Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <ButtonPrimary>Primary</ButtonPrimary>
          <ButtonCoral>Coral CTA</ButtonCoral>
          <ButtonSecondary>Secondary</ButtonSecondary>
          <ButtonGhost>Ghost</ButtonGhost>
          <ButtonIcon size="default" aria-label="Chatta">
            <MessageCircle />
          </ButtonIcon>
        </div>
        <div className="flex gap-2">
          <ButtonCoral size="sm">Sm</ButtonCoral>
          <ButtonCoral size="lg">Lg</ButtonCoral>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-label font-medium text-muted-foreground">Input variants</h3>
        <InputV2 variant="default" placeholder="Default" />
        <InputV2 variant="filled" placeholder="Filled" />
        <InputV2 variant="outline" placeholder="Outline" />
        <InputV2 variant="error" placeholder="Error state" aria-invalid />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-label font-medium text-muted-foreground">OTP (keyboard nav)</h3>
        <InputOTPV2
          value={otp}
          onChange={setOtp}
          maxLength={6}
          render={({ slots }) => (
            <InputOTPV2Group>
              {slots.map((slot, i) => (
                <InputOTPV2Slot key={i} {...slot} />
              ))}
            </InputOTPV2Group>
          )}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-label font-medium text-muted-foreground">FAS 3 – Avatar & Badge</h3>
        <div className="flex flex-wrap items-center gap-4">
          <AvatarV2 size="default">
            <AvatarV2Fallback>AB</AvatarV2Fallback>
          </AvatarV2>
          <AvatarWithRing showRing ringVariant="coral" fallback="M" />
          <AvatarWithRing showRing={false} online fallback="O" />
          <div className="flex items-center gap-2">
            <OnlineIndicator online size="default" />
            <span className="text-caption text-muted-foreground">Online</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ArchetypeBadge archetype="diplomat" />
          <ArchetypeBadge archetype="strateger" />
          <MatchTypeBadge type="likhet" />
          <MatchTypeBadge type="motsats" />
          <StatusBadge status="start-chat" />
          <StatusBadge status="your-turn" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-label font-medium text-muted-foreground">FAS 4 – Card System</h3>
        <div className="flex flex-col gap-3">
          <CardV2 variant="default" padding="default">
            <CardV2Header>
              <CardV2Title>CardV2 default</CardV2Title>
            </CardV2Header>
            <CardV2Content>Surface + elevation-1 + rounded-2xl</CardV2Content>
          </CardV2>
          <CardV2 variant="interactive" padding="sm">Interactive (hover)</CardV2>
          <CardV2 variant="glass" padding="default">Glass variant</CardV2>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-caption text-muted-foreground">ChatListItemCard</span>
          <ChatListItemCard
            displayName="Medina Amandel"
            lastMessagePreview="Start the chat with Rizal"
            timeLabel="12:00"
            status="start-chat"
            showRing
            state="unread"
          />
          <ChatListItemCard
            displayName="Ayu Rendang"
            lastMessagePreview="Hej!"
            timeLabel="08:00"
            status="your-turn"
            state="idle"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <BestMatchCard name="Medina" interests={["Game", "Singing"]} archetype="diplomat" />
          <BestMatchCard name="Dinda" interests={["Japan", "Game"]} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-caption text-muted-foreground">MatchProfileCardLight</span>
          <MatchProfileCardLight
            name="Sherina Jane"
            bio="Passionate traveler and food enthusiast."
            interests={[
              { label: "Anime" },
              { label: "Music" },
              { label: "Travel" },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-caption text-muted-foreground">MatchProfileCardDark</span>
          <MatchProfileCardDark
            name="Juliet"
            about="Hi there! From N.S America. Genuine friendship."
            interests={[
              { label: "Coffee", icon: <Sparkles className="size-3.5" /> },
              { label: "Travel", icon: <Sparkles className="size-3.5" /> },
              { label: "Music", icon: <Sparkles className="size-3.5" /> },
            ]}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-label font-medium text-muted-foreground">FAS 5 – Screens</h3>
        <p className="text-sm text-muted-foreground">
          Full-screen components (scroll to preview). Exact spec from MaakUnifiedDesignSystem.jsx.
        </p>
        <div className="space-y-6">
          <div>
            <span className="text-caption font-medium text-foreground block mb-2">VideoCallScreen</span>
            <div className="rounded-xl overflow-hidden border border-border max-h-[320px] overflow-y-auto">
              <VideoCallScreen callerName="Sofia" onEnd={() => {}} />
            </div>
          </div>
          <div>
            <span className="text-caption font-medium text-foreground block mb-2">PhotoUploadScreen</span>
            <div className="rounded-xl overflow-hidden border border-border max-h-[420px] overflow-y-auto">
              <PhotoUploadScreen
                photos={[null, null, null, null, null, null]}
                onPhotoAdd={() => {}}
                onNext={() => {}}
                currentStep={4}
                totalSteps={6}
              />
            </div>
          </div>
          <div>
            <span className="text-caption font-medium text-foreground block mb-2">MatchListPage</span>
            <div className="rounded-xl overflow-hidden border border-border max-h-[400px] overflow-y-auto">
              <MatchListPage
                matches={[
                  { name: "Emma", archetype: "diplomat", emoji: "🎭", matchType: "likhets" },
                  { name: "Lucas", archetype: "strateger", emoji: "🦋", matchType: "motsats" },
                ]}
                likhetCount={1}
                motsatsCount={1}
              />
            </div>
          </div>
          <div>
            <span className="text-caption font-medium text-foreground block mb-2">ProfilePageDark</span>
            <div className="rounded-xl overflow-hidden border border-border max-h-[380px] overflow-y-auto">
              <ProfilePageDark
                profile={{
                  name: "Samuel Pierre",
                  age: 29,
                  height: "167 cm",
                  occupation: "Entrepenör",
                  location: "Spånga, Sverige",
                  archetype: "byggare",
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
