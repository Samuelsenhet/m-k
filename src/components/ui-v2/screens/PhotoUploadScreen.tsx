import { useRef } from "react";
import { ChevronLeft, Camera, Plus } from "lucide-react";
import { ProgressSteps } from "../navigation";
import { ButtonPrimary } from "../button/ButtonPrimary";
import { Mascot } from "@/components/system/Mascot";
import { useMascot } from "@/hooks/useMascot";
import { MASCOT_SCREEN_STATES } from "@/lib/mascot";
import { COLORS } from "@/design/tokens";

export interface PhotoUploadScreenProps {
  photos: (string | null)[];
  onPhotoAdd: (index: number, file: File) => void;
  onNext: () => void;
  currentStep?: number;
  totalSteps?: number;
}

/**
 * Onboarding photo upload screen – FAS 5.2.
 * 6-slot grid (first is 2x2 main), ProgressSteps, tips box, Nästa button.
 */
export function PhotoUploadScreen({
  photos,
  onPhotoAdd,
  onNext,
  currentStep = 4,
  totalSteps = 6,
}: PhotoUploadScreenProps) {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const mascot = useMascot(MASCOT_SCREEN_STATES.ONBOARDING_PHOTO);

  const handleSlotClick = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPhotoAdd(index, file);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen p-6" style={{ background: COLORS.neutral.white }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button type="button" className="p-2 -ml-2" aria-label="Tillbaka">
          <ChevronLeft className="w-6 h-6" style={{ color: COLORS.neutral.charcoal }} />
        </button>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <ProgressSteps current={currentStep} total={totalSteps} />
      </div>

      {/* Mascot guidance – inline bubble layout (override hero/center from state) */}
      <div className="flex items-start gap-3 mb-6">
        <Mascot {...mascot} size="small" placement="inline" spacingPreset="inline-tight" className="flex-shrink-0" />
        <div
          className="flex-1 p-4 rounded-2xl rounded-tl-sm"
          style={{ background: COLORS.sage[50] }}
        >
          <p className="text-sm italic" style={{ color: COLORS.neutral.slate }}>
            Jag guidar dig lugnt genom det här. Visa vem du är! 📸
          </p>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.primary[800], fontFamily: "var(--font-heading)" }}>
        Lägg till dina bilder
      </h1>
      <p className="mb-8" style={{ color: COLORS.neutral.gray }}>
        Visa vem du är med minst ett foto
      </p>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {(photos.length >= 6 ? photos : [...photos, ...Array(6 - photos.length).fill(null)]).slice(0, 6).map((photo, i) => (
          <div key={i} className={i === 0 ? "col-span-2 row-span-2" : ""}>
            <input
              ref={(el) => { fileInputRefs.current[i] = el; }}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFileChange(i, e)}
            />
            <button
              type="button"
              onClick={() => handleSlotClick(i)}
              className={[
                "w-full aspect-[3/4] rounded-2xl flex flex-col items-center justify-center transition-all",
                "hover:scale-[1.02] active:scale-[0.98]",
                i === 0 && "col-span-2 row-span-2",
              ].filter(Boolean).join(" ")}
              style={{
                background: photo ? "transparent" : i === 0 ? COLORS.coral[50] : COLORS.neutral.cream,
                border: `2px dashed ${photo ? "transparent" : COLORS.sage[300]}`,
              }}
            >
              {photo ? (
                <img src={photo} alt="" className="w-full h-full object-contain bg-transparent rounded-2xl" />
              ) : (
                <>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                    style={{ background: i === 0 ? COLORS.coral[100] : COLORS.sage[100] }}
                  >
                    {i === 0 ? (
                      <Camera className="w-6 h-6" style={{ color: COLORS.coral[500] }} />
                    ) : (
                      <Plus className="w-6 h-6" style={{ color: COLORS.sage[500] }} />
                    )}
                  </div>
                  <span className="text-sm" style={{ color: COLORS.neutral.gray }}>
                    {i === 0 ? "Huvudfoto" : "Lägg till"}
                  </span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div
        className="p-4 rounded-xl mb-8"
        style={{ background: COLORS.primary[50] }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: COLORS.primary[700] }}>
          💡 Tips för bra foton
        </p>
        <ul className="text-sm space-y-1" style={{ color: COLORS.neutral.slate }}>
          <li>• Visa ditt ansikte tydligt</li>
          <li>• Använd bra belysning</li>
          <li>• Visa dina intressen</li>
        </ul>
      </div>

      {/* Next button */}
      <ButtonPrimary fullWidth onClick={onNext} className="gap-2">
        Nästa
        <ChevronRight className="w-5 h-5" />
      </ButtonPrimary>
    </div>
  );
}
