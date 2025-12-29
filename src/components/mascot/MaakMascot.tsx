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
          {/* Body gradient - creamy white */}
          <radialGradient id="bodyGradient" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fffef8"/>
            <stop offset="100%" stopColor="#f5f0e6"/>
          </radialGradient>

          {/* Heart gradient - pink */}
          <linearGradient id="heartPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb8d0"/>
            <stop offset="50%" stopColor="#ff9ec0"/>
            <stop offset="100%" stopColor="#f88cb0"/>
          </linearGradient>

          {/* Limb gradient - beige/skin */}
          <radialGradient id="limbGradient" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#f5e6d8"/>
            <stop offset="100%" stopColor="#e8d4c4"/>
          </radialGradient>

          {/* Soft shadow */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#c4b4a4" floodOpacity="0.25"/>
          </filter>
        </defs>

        {/* TAIL - Capsule shape behind body */}
        <motion.rect
          x="138"
          y="340"
          width="24"
          height="55"
          rx="12"
          ry="12"
          fill="url(#bodyGradient)"
          stroke="#d4c8b8"
          strokeWidth="2"
          animate={isSleeping ? { rotate: [-8, 8, -8] } : isStartled ? { rotate: 15 } : { rotate: [-3, 3, -3] }}
          transition={{ duration: isSleeping ? 1.5 : 1, repeat: Infinity }}
          style={{ transformOrigin: "150px 340px" }}
        />

        {/* FEET - Capsule shapes */}
        <motion.rect
          x="95"
          y="355"
          width="40"
          height="22"
          rx="11"
          ry="11"
          fill="url(#limbGradient)"
          stroke="#d4c4b8"
          strokeWidth="2"
          animate={isSleeping ? { rotate: [-5, 5, -5] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ transformOrigin: "115px 366px" }}
        />
        <motion.rect
          x="165"
          y="355"
          width="40"
          height="22"
          rx="11"
          ry="11"
          fill="url(#limbGradient)"
          stroke="#d4c4b8"
          strokeWidth="2"
          animate={isSleeping ? { rotate: [5, -5, 5] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ transformOrigin: "185px 366px" }}
        />

        {/* BODY - Rounded rectangle (pill shape) */}
        <g filter="url(#softShadow)">
          <rect
            x="80"
            y="200"
            width="140"
            height="170"
            rx="70"
            ry="70"
            fill="url(#bodyGradient)"
            stroke="#d4c8b8"
            strokeWidth="2.5"
          />
        </g>

        {/* HANDS/ARMS - Capsule shapes */}
        <motion.rect
          x="35"
          y="255"
          width="55"
          height="24"
          rx="12"
          ry="12"
          fill="url(#limbGradient)"
          stroke="#d4c4b8"
          strokeWidth="2"
          animate={isStartled ? { rotate: 25, y: -10 } : isSleeping ? { rotate: [-8, 8, -8] } : { rotate: [-4, 4, -4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ transformOrigin: "90px 267px" }}
        />
        <motion.rect
          x="210"
          y="255"
          width="55"
          height="24"
          rx="12"
          ry="12"
          fill="url(#limbGradient)"
          stroke="#d4c4b8"
          strokeWidth="2"
          animate={isStartled ? { rotate: -25, y: -10 } : isSleeping ? { rotate: [8, -8, 8] } : { rotate: [4, -4, 4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ transformOrigin: "210px 267px" }}
        />

        {/* HEAD GROUP */}
        <motion.g
          animate={{ rotate: isStartled ? 12 : headRotation }}
          transition={{ duration: isStartled ? 0.3 : 2.2, ease: "easeInOut" }}
          style={{ transformOrigin: "150px 130px" }}
        >
          {/* EARS - Capsule shapes on sides */}
          <rect
            x="40"
            y="100"
            width="35"
            height="20"
            rx="10"
            ry="10"
            fill="url(#limbGradient)"
            stroke="#d4c4b8"
            strokeWidth="2"
            transform="rotate(-20 57 110)"
          />
          <ellipse
            cx="55"
            cy="110"
            rx="10"
            ry="6"
            fill="#f0d8cc"
            transform="rotate(-20 55 110)"
          />
          <rect
            x="225"
            y="100"
            width="35"
            height="20"
            rx="10"
            ry="10"
            fill="url(#limbGradient)"
            stroke="#d4c4b8"
            strokeWidth="2"
            transform="rotate(20 243 110)"
          />
          <ellipse
            cx="245"
            cy="110"
            rx="10"
            ry="6"
            fill="#f0d8cc"
            transform="rotate(20 245 110)"
          />

          {/* HEART HORNS - On top of head */}
          <motion.g
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Left heart */}
            <path
              d="M90 55 C90 38 72 28 62 42 C52 28 34 38 34 55 C34 78 62 100 62 100 C62 100 90 78 90 55Z"
              fill="url(#heartPink)"
              stroke="#e890a8"
              strokeWidth="2"
            />
            {/* Right heart */}
            <path
              d="M266 55 C266 38 248 28 238 42 C228 28 210 38 210 55 C210 78 238 100 238 100 C238 100 266 78 266 55Z"
              fill="url(#heartPink)"
              stroke="#e890a8"
              strokeWidth="2"
            />
          </motion.g>

          {/* HEAD - Circle shape */}
          <g filter="url(#softShadow)">
            <circle
              cx="150"
              cy="130"
              r="70"
              fill="url(#bodyGradient)"
              stroke="#d4c8b8"
              strokeWidth="2.5"
            />
          </g>

          {/* BLUSH */}
          <ellipse cx="100" cy="145" rx="12" ry="7" fill="#ffc8d8" opacity="0.5"/>
          <ellipse cx="200" cy="145" rx="12" ry="7" fill="#ffc8d8" opacity="0.5"/>

          {/* EYES */}
          {isSleeping ? (
            <>
              {/* Sleeping eyes - curved lines */}
              <path d="M115 125 Q130 136 145 125" fill="none" stroke="#3a3a4a" strokeWidth="3" strokeLinecap="round"/>
              <path d="M155 125 Q170 136 185 125" fill="none" stroke="#3a3a4a" strokeWidth="3" strokeLinecap="round"/>
              {/* Zzz */}
              <motion.g
                animate={{ opacity: [0, 1, 0], y: [0, -15, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <text x="205" y="95" fontSize="16" fill="#9ca3af" fontWeight="bold">z</text>
                <text x="218" y="82" fontSize="12" fill="#b4b4c4" fontWeight="bold">z</text>
              </motion.g>
            </>
          ) : blinkState ? (
            <>
              {/* Blinking - curved lines */}
              <path d="M115 128 Q130 138 145 128" fill="none" stroke="#3a3a4a" strokeWidth="3" strokeLinecap="round"/>
              <path d="M155 128 Q170 138 185 128" fill="none" stroke="#3a3a4a" strokeWidth="3" strokeLinecap="round"/>
            </>
          ) : (
            <>
              {/* Open eyes - large oval */}
              <ellipse cx="130" cy="125" rx="14" ry="18" fill="#3a3a4a"/>
              <ellipse cx="170" cy="125" rx="14" ry="18" fill="#3a3a4a"/>
              {/* Eye shine */}
              <circle cx="134" cy="120" r="5" fill="white"/>
              <circle cx="174" cy="120" r="5" fill="white"/>
              <circle cx="127" cy="128" r="2.5" fill="white" opacity="0.6"/>
              <circle cx="167" cy="128" r="2.5" fill="white" opacity="0.6"/>
              {/* Eyelashes */}
              <path d="M112 112 L106 104" stroke="#3a3a4a" strokeWidth="2" strokeLinecap="round"/>
              <path d="M120 108 L116 100" stroke="#3a3a4a" strokeWidth="2" strokeLinecap="round"/>
              <path d="M128 106 L127 98" stroke="#3a3a4a" strokeWidth="2" strokeLinecap="round"/>
              <path d="M188 112 L194 104" stroke="#3a3a4a" strokeWidth="2" strokeLinecap="round"/>
              <path d="M180 108 L184 100" stroke="#3a3a4a" strokeWidth="2" strokeLinecap="round"/>
              <path d="M172 106 L173 98" stroke="#3a3a4a" strokeWidth="2" strokeLinecap="round"/>
            </>
          )}

          {/* MOUTH */}
          {isStartled ? (
            <ellipse cx="150" cy="160" rx="10" ry="12" fill="#e85a71"/>
          ) : isHappy ? (
            <>
              <path d="M130 155 Q150 175 170 155" fill="#e85a71" stroke="#d04a61" strokeWidth="1.5"/>
              <path d="M138 155 Q150 165 162 155" fill="none" stroke="#ffc0c8" strokeWidth="1"/>
            </>
          ) : isSleeping ? (
            <path d="M138 160 Q150 168 162 160" fill="none" stroke="#e85a71" strokeWidth="2.5" strokeLinecap="round"/>
          ) : (
            <>
              {/* Happy open mouth */}
              <path d="M125 155 Q150 180 175 155" fill="#e85a71" stroke="#d04a61" strokeWidth="1.5"/>
              {/* Tongue */}
              <ellipse cx="150" cy="166" rx="10" ry="6" fill="#ff8090"/>
            </>
          )}
        </motion.g>
      </motion.svg>
    </motion.div>
  );
};

export default MaakMascot;
