import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export type Pose =
  | "Idle"
  | "Asleep"
  | "Jump"
  | "FallBounce"
  | "Startled"
  | "Happy"
  | "Tired"
  | "Confused"
  | "Love"
  | "Angry";

interface MaakMascotProps {
  size?: number;
  className?: string;
  pose?: Pose;
  onClick?: () => void;
}

export const MaakMascot = ({ 
  size = 200, 
  className = "", 
  pose: externalPose,
  onClick 
}: MaakMascotProps) => {
  const [internalPose, setInternalPose] = useState<Pose>("Idle");
  const [blinkState, setBlinkState] = useState(false);
  const [headRotation, setHeadRotation] = useState(0);

  const pose = externalPose ?? internalPose;

  // Blink timer
  useEffect(() => {
    const blink = setInterval(() => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 150);
    }, 3000);
    return () => clearInterval(blink);
  }, []);

  // Head rotation loop
  useEffect(() => {
    const r = setInterval(() => {
      setHeadRotation(5);
      setTimeout(() => setHeadRotation(-5), 1200);
    }, 2400);
    return () => clearInterval(r);
  }, []);

  // Handle tap - trigger startled
  const handleTap = () => {
    onClick?.();
    if (!externalPose) {
      setInternalPose("Startled");
      setTimeout(() => setInternalPose("Idle"), 1200);
    }
  };

  const isSleeping = pose === "Asleep" || pose === "Tired";
  const isStartled = pose === "Startled";
  const isHappy = pose === "Happy" || pose === "Love";

  return (
    <motion.div
      className={`flex items-center justify-center cursor-pointer ${className}`}
      style={{ width: size, height: size * 1.3 }}
      onClick={handleTap}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.svg
        viewBox="0 0 300 400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          {/* Body gradient - soft white with slight purple tint */}
          <radialGradient id="fluffyGradient" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="70%" stopColor="#f8f5ff"/>
            <stop offset="100%" stopColor="#efe8f8"/>
          </radialGradient>

          {/* Heart gradient */}
          <linearGradient id="heartPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb8d0"/>
            <stop offset="50%" stopColor="#ff9ec0"/>
            <stop offset="100%" stopColor="#f88cb0"/>
          </linearGradient>

          {/* Skin/beige gradient for ears, hands, feet */}
          <radialGradient id="skinGradient" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#f5e6d8"/>
            <stop offset="100%" stopColor="#e8d4c4"/>
          </radialGradient>

          {/* Face area gradient */}
          <radialGradient id="faceGradient" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="100%" stopColor="#fff5f8"/>
          </radialGradient>

          {/* Soft shadow */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#d4c4d4" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* FEET */}
        <motion.ellipse
          cx="115"
          cy="385"
          rx="28"
          ry="18"
          fill="url(#skinGradient)"
          stroke="#d4c4b8"
          strokeWidth="1.5"
          animate={isSleeping ? { rotate: [-3, 3, -3] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.ellipse
          cx="185"
          cy="385"
          rx="28"
          ry="18"
          fill="url(#skinGradient)"
          stroke="#d4c4b8"
          strokeWidth="1.5"
          animate={isSleeping ? { rotate: [3, -3, 3] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />

        {/* BODY - Fluffy cloud shape */}
        <g filter="url(#softShadow)">
          {/* Main body cloud */}
          <ellipse cx="150" cy="290" rx="75" ry="70" fill="url(#fluffyGradient)"/>
          {/* Fluffy bumps around body */}
          <circle cx="85" cy="260" r="28" fill="url(#fluffyGradient)"/>
          <circle cx="215" cy="260" r="28" fill="url(#fluffyGradient)"/>
          <circle cx="80" cy="300" r="25" fill="url(#fluffyGradient)"/>
          <circle cx="220" cy="300" r="25" fill="url(#fluffyGradient)"/>
          <circle cx="90" cy="340" r="22" fill="url(#fluffyGradient)"/>
          <circle cx="210" cy="340" r="22" fill="url(#fluffyGradient)"/>
          <circle cx="110" cy="360" r="20" fill="url(#fluffyGradient)"/>
          <circle cx="190" cy="360" r="20" fill="url(#fluffyGradient)"/>
          <ellipse cx="150" cy="360" rx="45" ry="25" fill="url(#fluffyGradient)"/>
          {/* Body outline */}
          <path 
            d="M75 290 Q60 260 85 240 Q100 225 120 225 Q140 220 150 220 Q160 220 180 225 Q200 225 215 240 Q240 260 225 290 Q230 320 220 340 Q210 365 190 375 Q170 385 150 385 Q130 385 110 375 Q90 365 80 340 Q70 320 75 290Z"
            fill="none"
            stroke="#e0d0e0"
            strokeWidth="1"
          />
        </g>

        {/* HANDS/ARMS */}
        <motion.ellipse
          cx="55"
          cy="275"
          rx="25"
          ry="16"
          fill="url(#skinGradient)"
          stroke="#d4c4b8"
          strokeWidth="1.5"
          animate={isStartled ? { rotate: 20 } : isSleeping ? { rotate: [-10, 10, -10] } : { rotate: [-5, 5, -5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ transformOrigin: "75px 275px" }}
        />
        <motion.ellipse
          cx="245"
          cy="275"
          rx="25"
          ry="16"
          fill="url(#skinGradient)"
          stroke="#d4c4b8"
          strokeWidth="1.5"
          animate={isStartled ? { rotate: -20 } : isSleeping ? { rotate: [10, -10, 10] } : { rotate: [5, -5, 5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ transformOrigin: "225px 275px" }}
        />

        {/* HEAD GROUP */}
        <motion.g
          animate={{ rotate: isStartled ? 15 : headRotation }}
          transition={{ duration: isStartled ? 0.3 : 2.2, ease: "easeInOut" }}
          style={{ transformOrigin: "150px 130px" }}
        >
          {/* EARS - Beige ovals on sides */}
          <ellipse
            cx="55"
            cy="115"
            rx="22"
            ry="15"
            fill="url(#skinGradient)"
            stroke="#d4c4b8"
            strokeWidth="1.5"
            transform="rotate(-15 55 115)"
          />
          <ellipse
            cx="52"
            cy="115"
            rx="12"
            ry="8"
            fill="#f0d8cc"
            transform="rotate(-15 52 115)"
          />
          <ellipse
            cx="245"
            cy="115"
            rx="22"
            ry="15"
            fill="url(#skinGradient)"
            stroke="#d4c4b8"
            strokeWidth="1.5"
            transform="rotate(15 245 115)"
          />
          <ellipse
            cx="248"
            cy="115"
            rx="12"
            ry="8"
            fill="#f0d8cc"
            transform="rotate(15 248 115)"
          />

          {/* HEART HORNS - On top of head */}
          <motion.g
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Left heart */}
            <path
              d="M95 55 C95 40 80 30 70 42 C60 30 45 40 45 55 C45 75 70 95 70 95 C70 95 95 75 95 55Z"
              fill="url(#heartPink)"
              stroke="#e890a8"
              strokeWidth="1.5"
            />
            {/* Right heart */}
            <path
              d="M255 55 C255 40 240 30 230 42 C220 30 205 40 205 55 C205 75 230 95 230 95 C230 95 255 75 255 55Z"
              fill="url(#heartPink)"
              stroke="#e890a8"
              strokeWidth="1.5"
            />
          </motion.g>

          {/* HEAD - Fluffy cloud shape */}
          <g filter="url(#softShadow)">
            {/* Main head */}
            <ellipse cx="150" cy="125" rx="60" ry="55" fill="url(#fluffyGradient)"/>
            {/* Fluffy bumps around head */}
            <circle cx="95" cy="100" r="22" fill="url(#fluffyGradient)"/>
            <circle cx="205" cy="100" r="22" fill="url(#fluffyGradient)"/>
            <circle cx="85" cy="130" r="20" fill="url(#fluffyGradient)"/>
            <circle cx="215" cy="130" r="20" fill="url(#fluffyGradient)"/>
            <circle cx="100" cy="160" r="18" fill="url(#fluffyGradient)"/>
            <circle cx="200" cy="160" r="18" fill="url(#fluffyGradient)"/>
            <circle cx="120" cy="175" r="15" fill="url(#fluffyGradient)"/>
            <circle cx="180" cy="175" r="15" fill="url(#fluffyGradient)"/>
            <circle cx="150" cy="178" r="18" fill="url(#fluffyGradient)"/>
            <circle cx="115" cy="80" r="18" fill="url(#fluffyGradient)"/>
            <circle cx="185" cy="80" r="18" fill="url(#fluffyGradient)"/>
            <circle cx="150" cy="72" r="20" fill="url(#fluffyGradient)"/>
          </g>

          {/* FACE AREA - Oval */}
          <ellipse
            cx="150"
            cy="130"
            rx="45"
            ry="42"
            fill="url(#faceGradient)"
          />
          {/* Face outline */}
          <ellipse
            cx="150"
            cy="130"
            rx="45"
            ry="42"
            fill="none"
            stroke="#e8d8e8"
            strokeWidth="1"
          />

          {/* BLUSH */}
          <ellipse cx="110" cy="140" rx="10" ry="6" fill="#ffc8d8" opacity="0.6"/>
          <ellipse cx="190" cy="140" rx="10" ry="6" fill="#ffc8d8" opacity="0.6"/>

          {/* EYES */}
          {isSleeping ? (
            <>
              {/* Sleeping eyes - curved lines */}
              <path d="M120 120 Q130 128 140 120" fill="none" stroke="#4a4a5a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M160 120 Q170 128 180 120" fill="none" stroke="#4a4a5a" strokeWidth="2.5" strokeLinecap="round"/>
              {/* Zzz */}
              <motion.text
                x="200"
                y="90"
                fontSize="14"
                fill="#9ca3af"
                animate={{ opacity: [0, 1, 0], y: [90, 80, 90] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                z
              </motion.text>
            </>
          ) : blinkState ? (
            <>
              {/* Blinking - curved lines */}
              <path d="M120 122 Q130 130 140 122" fill="none" stroke="#4a4a5a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M160 122 Q170 130 180 122" fill="none" stroke="#4a4a5a" strokeWidth="2.5" strokeLinecap="round"/>
            </>
          ) : (
            <>
              {/* Open eyes */}
              <ellipse cx="125" cy="122" rx="10" ry="12" fill="#4a4a5a"/>
              <ellipse cx="175" cy="122" rx="10" ry="12" fill="#4a4a5a"/>
              {/* Eye shine */}
              <circle cx="128" cy="118" r="4" fill="white"/>
              <circle cx="178" cy="118" r="4" fill="white"/>
              <circle cx="123" cy="124" r="2" fill="white" opacity="0.6"/>
              <circle cx="173" cy="124" r="2" fill="white" opacity="0.6"/>
              {/* Eyelashes */}
              <path d="M112 114 L108 108" stroke="#4a4a5a" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M117 111 L114 105" stroke="#4a4a5a" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M123 110 L122 104" stroke="#4a4a5a" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M188 114 L192 108" stroke="#4a4a5a" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M183 111 L186 105" stroke="#4a4a5a" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M177 110 L178 104" stroke="#4a4a5a" strokeWidth="1.5" strokeLinecap="round"/>
            </>
          )}

          {/* MOUTH */}
          {isStartled ? (
            <ellipse cx="150" cy="152" rx="8" ry="10" fill="#e85a71"/>
          ) : isHappy ? (
            <>
              <path d="M135 148 Q150 165 165 148" fill="#e85a71" stroke="#d04a61" strokeWidth="1"/>
              <path d="M140 148 Q150 155 160 148" fill="none" stroke="#ffc0c8" strokeWidth="1"/>
            </>
          ) : isSleeping ? (
            <path d="M142 152 Q150 158 158 152" fill="none" stroke="#e85a71" strokeWidth="2" strokeLinecap="round"/>
          ) : (
            <>
              {/* Happy open mouth */}
              <path d="M132 148 Q150 170 168 148" fill="#e85a71" stroke="#d04a61" strokeWidth="1"/>
              {/* Tongue highlight */}
              <ellipse cx="150" cy="158" rx="8" ry="5" fill="#ff8090"/>
            </>
          )}
        </motion.g>
      </motion.svg>
    </motion.div>
  );
};

export default MaakMascot;
