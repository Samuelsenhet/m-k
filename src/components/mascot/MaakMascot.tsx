import { useState } from "react";
import { motion } from "framer-motion";
import mascotImage from "@/assets/mascot.png";

export type Pose =
  | "idle"
  | "asleep"
  | "jump"
  | "fall"
  | "bounce"
  | "startled"
  | "love"
  | "tired"
  | "confused"
  | "happy"
  | "angry";

export type Expression = "😊" | "😴" | "😵‍💫" | "😍" | "😡" | "😐" | "🤗" | "😮";

interface MaakMascotProps {
  size?: number;
  className?: string;
  pose?: Pose;
  expression?: Expression;
  onClick?: () => void;
}

export const MaakMascot = ({ 
  size = 200, 
  className = "", 
  pose: externalPose = "idle",
  expression = "😊",
  onClick 
}: MaakMascotProps) => {
  const [internalPose, setInternalPose] = useState<Pose>("idle");
  const pose = externalPose ?? internalPose;

  // Handle tap - trigger startled
  const handleTap = () => {
    onClick?.();
    if (!externalPose) {
      setInternalPose("startled");
      setTimeout(() => setInternalPose("idle"), 1200);
    }
  };

  const isSleeping = pose === "asleep" || pose === "tired";
  const isStartled = pose === "startled";
  const isHappy = pose === "happy" || pose === "love";
  const isJumping = pose === "jump";
  const isFalling = pose === "fall";

  // Animation variants based on pose
  const getAnimationProps = () => {
    if (isJumping) {
      return {
        y: [-20, 0],
        scale: [1, 1.1, 1],
        transition: { duration: 0.6, repeat: Infinity, repeatType: "reverse" as const }
      };
    }
    if (isFalling) {
      return {
        y: [0, 40],
        scale: [1, 0.95],
        transition: { duration: 0.5 }
      };
    }
    if (isStartled) {
      return {
        scale: [1, 1.15, 1],
        rotate: [0, -5, 5, 0],
        transition: { duration: 0.3, repeat: 2 }
      };
    }
    if (isHappy) {
      return {
        scale: [1, 1.08, 1],
        y: [0, -5, 0],
        transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (isSleeping) {
      return {
        scale: [1, 1.05, 1],
        transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
      };
    }
    // Default idle breathing
    return {
      scale: [1, 1.02, 1],
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
    };
  };

  return (
    <motion.div
      className={`flex items-center justify-center cursor-pointer ${className}`}
      style={{ 
        width: size, 
        height: size,
        position: "relative",
      }}
      onClick={handleTap}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.img
        src={mascotImage}
        alt="MÄÄK Mascot"
        className="w-full h-full object-contain"
        style={{
          filter: isSleeping ? "brightness(0.9)" : "brightness(1)",
        }}
        animate={getAnimationProps()}
      />
    </motion.div>
  );
};

export default MaakMascot;
