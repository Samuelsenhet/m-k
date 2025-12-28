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
  const [internalPose, setInternalPose] = useState<Pose>("Asleep");
  const [expression, setExpression] = useState(1);
  const [headRotation, setHeadRotation] = useState(0);

  const pose = externalPose ?? internalPose;

  // Expression timer for sleep blink
  useEffect(() => {
    if (pose === "Asleep") {
      const t = setInterval(() => setExpression((e) => (e === 1 ? 2 : 1)), 1800);
      return () => clearInterval(t);
    }
  }, [pose]);

  // Head rotation loop
  useEffect(() => {
    const r = setInterval(() => {
      setHeadRotation(7);
      setTimeout(() => setHeadRotation(-7), 1200);
    }, 2400);
    return () => clearInterval(r);
  }, []);

  // Handle tap - trigger startled
  const handleTap = () => {
    onClick?.();
    if (!externalPose) {
      setInternalPose("Startled");
      setTimeout(() => setInternalPose("Asleep"), 1200);
    }
  };

  // Squash/Stretch based on pose
  const squashStretch =
    pose === "Jump"
      ? { scaleY: 0.92, scaleX: 1.07 }
      : pose === "FallBounce"
      ? { scaleY: 1.08, scaleX: 0.93 }
      : { scaleY: 1, scaleX: 1 };

  const face = () => {
    if (pose === "Happy") return "😁";
    if (pose === "Tired") return "🥱";
    if (pose === "Confused") return "🤔";
    if (pose === "Love") return "😍";
    if (pose === "Angry") return "😠";
    if (pose === "Startled") return "😳";
    if (pose === "Asleep") return expression === 1 ? "😴" : "💤";
    return "😊";
  };

  return (
    <motion.div
      className={`flex items-center justify-center cursor-pointer ${className}`}
      style={{ width: size, height: size * 1.2 }}
      onClick={handleTap}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.svg
        viewBox="0 0 500 500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        animate={{
          scale: [1, 1.04, 1],
          ...squashStretch,
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          {/* Gradient for body */}
          <radialGradient id="bodyGradient" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="100%" stopColor="#f8f0f0"/>
          </radialGradient>

          {/* Heart gradient */}
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb6c1"/>
            <stop offset="100%" stopColor="#ff91a4"/>
          </linearGradient>

          {/* Soft shadow */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#d4a5a5" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Body */}
        <motion.g filter="url(#shadow)">
          <motion.path
            d="M250 410C185 410 140 355 140 305C140 255 185 215 250 215C315 215 360 255 360 305C360 355 315 410 250 410Z"
            fill="url(#bodyGradient)"
            stroke="#e8e0e0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hands/Paws */}
          <motion.ellipse
            cx="145"
            cy="320"
            rx="35"
            ry="18"
            fill="#f5e6d3"
            stroke="#e8d4c0"
            strokeWidth="2"
            animate={{
              rotate: pose === "Startled" ? 18 : pose === "Asleep" ? [-8, 8, -8] : -6,
            }}
            transition={{ duration: 0.8, repeat: pose === "Asleep" ? Infinity : 0 }}
            style={{ transformOrigin: "center" }}
          />
          <motion.ellipse
            cx="355"
            cy="320"
            rx="35"
            ry="18"
            fill="#f5e6d3"
            stroke="#e8d4c0"
            strokeWidth="2"
            animate={{
              rotate: pose === "Startled" ? -18 : pose === "Asleep" ? [8, -8, 8] : 6,
            }}
            transition={{ duration: 0.8, repeat: pose === "Asleep" ? Infinity : 0 }}
            style={{ transformOrigin: "center" }}
          />

          {/* Feet */}
          <motion.ellipse
            cx="200"
            cy="420"
            rx="25"
            ry="14"
            fill="#f5e6d3"
            stroke="#e8d4c0"
            strokeWidth="2"
            animate={{ rotate: pose === "Asleep" ? [-5, 5, -5] : 0 }}
            transition={{ duration: 0.8, repeat: pose === "Asleep" ? Infinity : 0 }}
          />
          <motion.ellipse
            cx="300"
            cy="420"
            rx="25"
            ry="14"
            fill="#f5e6d3"
            stroke="#e8d4c0"
            strokeWidth="2"
            animate={{ rotate: pose === "Asleep" ? [5, -5, 5] : 0 }}
            transition={{ duration: 0.8, repeat: pose === "Asleep" ? Infinity : 0 }}
          />
        </motion.g>

        {/* Head */}
        <motion.g
          animate={{ rotate: pose === "Startled" ? 25 : headRotation }}
          transition={{ duration: pose === "Startled" ? 0.3 : 2.2, ease: "easeInOut" }}
          style={{ transformOrigin: "250px 135px" }}
        >
          {/* Ears */}
          <ellipse
            cx="165"
            cy="100"
            rx="20"
            ry="14"
            fill="#f5e6d3"
            stroke="#e8d4c0"
            strokeWidth="2"
            transform="rotate(-20 165 100)"
          />
          <ellipse
            cx="335"
            cy="100"
            rx="20"
            ry="14"
            fill="#f5e6d3"
            stroke="#e8d4c0"
            strokeWidth="2"
            transform="rotate(20 335 100)"
          />

          {/* Heart horns */}
          <motion.path
            d="M145 58C120 35 85 48 82 86C79 124 110 155 155 180C200 155 231 124 228 86C225 48 188 35 145 58Z"
            fill="url(#heartGradient)"
            stroke="#ff8fa3"
            strokeWidth="2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transformOrigin: "155px 120px" }}
          />
          <motion.path
            d="M355 58C380 35 415 48 418 86C421 124 390 155 345 180C300 155 269 124 272 86C275 48 312 35 355 58Z"
            fill="url(#heartGradient)"
            stroke="#ff8fa3"
            strokeWidth="2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            style={{ transformOrigin: "345px 120px" }}
          />

          {/* Head shape */}
          <circle
            cx="250"
            cy="135"
            r="82"
            fill="url(#bodyGradient)"
            stroke="#e8e0e0"
            strokeWidth="2"
          />

          {/* Face area */}
          <circle
            cx="250"
            cy="140"
            r="55"
            fill="#fff5f5"
          />

          {/* Blush */}
          <ellipse cx="195" cy="155" rx="12" ry="7" fill="#ffccd5" opacity="0.6"/>
          <ellipse cx="305" cy="155" rx="12" ry="7" fill="#ffccd5" opacity="0.6"/>

          {/* Expression */}
          <text
            x="250"
            y="165"
            fontSize="55"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {face()}
          </text>
        </motion.g>

        {/* Tail */}
        <motion.ellipse
          cx="250"
          cy="430"
          rx="14"
          ry="35"
          fill="url(#bodyGradient)"
          stroke="#e8e0e0"
          strokeWidth="2"
          animate={{
            rotate: pose === "Asleep" ? [18, -18, 18] : pose === "Startled" ? -35 : -12,
          }}
          transition={{ duration: 1.3, repeat: pose === "Asleep" ? Infinity : 0, ease: "easeInOut" }}
          style={{ transformOrigin: "250px 410px" }}
        />
      </motion.svg>
    </motion.div>
  );
};

export default MaakMascot;
