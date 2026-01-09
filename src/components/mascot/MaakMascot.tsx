import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
          scale: isSleeping ? [1, 1.05, 1] : [1, 1.02, 1],
          y: isJumping ? -20 : isFalling ? 40 : 0
        }}
        transition={{ 
          duration: isSleeping ? 1.8 : 2.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <defs>
          {/* 3D Bubble Body Gradient - Smooth plastic look */}
          <radialGradient id="bodyGradient3D" cx="40%" cy="25%" r="80%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="30%" stopColor="#fefdfb"/>
            <stop offset="70%" stopColor="#f8f5f0"/>
            <stop offset="100%" stopColor="#ebe6dc"/>
          </radialGradient>

          {/* Glossy highlight */}
          <radialGradient id="glossHighlight" cx="45%" cy="20%" r="40%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9"/>
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </radialGradient>

          {/* Pink heart gradient with 3D effect */}
          <radialGradient id="heartGradient3D" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffc9de"/>
            <stop offset="50%" stopColor="#ffaac9"/>
            <stop offset="100%" stopColor="#ff8fb4"/>
          </radialGradient>

          {/* Limb gradient - beige with highlight */}
          <radialGradient id="limbGradient3D" cx="35%" cy="25%" r="75%">
            <stop offset="0%" stopColor="#ffeee0"/>
            <stop offset="60%" stopColor="#f5ddc8"/>
            <stop offset="100%" stopColor="#e8cfb8"/>
          </radialGradient>

          {/* Soft drop shadow for depth */}
          <filter id="softShadow3D" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dx="0" dy="6" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Inner glow for glossy effect */}
          <filter id="innerGlow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
            <feComposite in="blur" in2="SourceGraphic" operator="out" result="inverse"/>
            <feFlood floodColor="white" floodOpacity="0.6" result="color"/>
            <feComposite in="color" in2="inverse" operator="in" result="glow"/>
            <feComposite in="glow" in2="SourceGraphic" operator="over"/>
          </filter>
        </defs>

        {/* BODY - Large rounded bubble shape */}
        <g filter="url(#softShadow3D)">
          <motion.path
            d="M250 420C175 420 125 355 125 285C125 215 180 185 250 185C320 185 375 215 375 285C375 355 325 420 250 420Z"
            fill="url(#bodyGradient3D)"
            stroke="#ddd4c8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={isSleeping ? { 
              d: "M250 425C175 425 125 360 125 290C125 220 180 190 250 190C320 190 375 220 375 290C375 360 325 425 250 425Z" 
            } : {}}
            transition={{ duration: 1.8, repeat: Infinity, repeatType: "reverse" }}
          />
          {/* Body glossy highlight */}
          <ellipse
            cx="250"
            cy="240"
            rx="80"
            ry="60"
            fill="url(#glossHighlight)"
            opacity="0.8"
          />
        </g>

        {/* HEAD - Large circular bubble */}
        <g filter="url(#softShadow3D)">
          <motion.circle
            cx="250"
            cy="135"
            r="105"
            fill="url(#bodyGradient3D)"
            stroke="#ddd4c8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={isStartled ? { r: 110 } : {}}
            transition={{ duration: 0.3 }}
          />
          {/* Head glossy highlight - larger and more prominent */}
          <ellipse
            cx="235"
            cy="100"
            rx="55"
            ry="40"
            fill="url(#glossHighlight)"
            opacity="0.9"
          />
        </g>

        {/* HEART EARS - Bubble style */}
        <g filter="url(#softShadow3D)">
          {/* Left heart ear */}
          <motion.path
            d="M120 120C95 85 50 85 30 120C10 155 10 205 30 235L75 270L120 235C145 205 145 155 120 120Z"
            fill="url(#heartGradient3D)"
            stroke="#ff99bb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={isHappy ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ transformOrigin: "75px 177px" }}
          />
          {/* Left heart highlight */}
          <ellipse
            cx="65"
            cy="140"
            rx="18"
            ry="25"
            fill="white"
            opacity="0.5"
          />
          
          {/* Right heart ear */}
          <motion.path
            d="M380 120C405 85 450 85 470 120C490 155 490 205 470 235L425 270L380 235C355 205 355 155 380 120Z"
            fill="url(#heartGradient3D)"
            stroke="#ff99bb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={isHappy ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            style={{ transformOrigin: "425px 177px" }}
          />
          {/* Right heart highlight */}
          <ellipse
            cx="435"
            cy="140"
            rx="18"
            ry="25"
            fill="white"
            opacity="0.5"
          />
        </g>

        {/* FACE - Expression emoji centered */}
        <text
          x="250"
          y="155"
          fontSize="80"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ 
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
            userSelect: "none"
          }}
        >
          {expression}
        </text>

        {/* ARMS - Rounded bubble limbs */}
        <motion.g
          id="arms"
          animate={
            isStartled ? { rotate: 20, y: -10 } :
            pose === "love" ? { rotate: -10 } :
            { rotate: 0 }
          }
          transition={{ duration: 0.4 }}
          style={{ transformOrigin: "250px 300px" }}
        >
          {/* Left arm */}
          <g filter="url(#softShadow3D)">
            <ellipse
              cx="140"
              cy="295"
              rx="22"
              ry="55"
              fill="url(#limbGradient3D)"
              stroke="#e8cfb8"
              strokeWidth="2.5"
            />
            <ellipse
              cx="135"
              cy="275"
              rx="10"
              ry="20"
              fill="white"
              opacity="0.4"
            />
          </g>
          
          {/* Right arm */}
          <g filter="url(#softShadow3D)">
            <ellipse
              cx="360"
              cy="295"
              rx="22"
              ry="55"
              fill="url(#limbGradient3D)"
              stroke="#e8cfb8"
              strokeWidth="2.5"
            />
            <ellipse
              cx="365"
              cy="275"
              rx="10"
              ry="20"
              fill="white"
              opacity="0.4"
            />
          </g>
        </motion.g>

        {/* FEET - Rounded bubble paws */}
        <motion.g
          id="paws"
          animate={
            isJumping ? { y: -20 } :
            isFalling ? { y: 40 } :
            { y: 0 }
          }
          transition={{ duration: 0.4 }}
        >
          {/* Left foot */}
          <g filter="url(#softShadow3D)">
            <circle
              cx="200"
              cy="435"
              r="20"
              fill="url(#limbGradient3D)"
              stroke="#e8cfb8"
              strokeWidth="2.5"
            />
            <circle
              cx="195"
              cy="430"
              r="8"
              fill="white"
              opacity="0.5"
            />
          </g>
          
          {/* Right foot */}
          <g filter="url(#softShadow3D)">
            <circle
              cx="300"
              cy="435"
              r="20"
              fill="url(#limbGradient3D)"
              stroke="#e8cfb8"
              strokeWidth="2.5"
            />
            <circle
              cx="295"
              cy="430"
              r="8"
              fill="white"
              opacity="0.5"
            />
          </g>
        </motion.g>

        {/* Breathing animation - subtle overlay */}
        <motion.ellipse
          cx="250"
          cy="135"
          rx="100"
          ry="100"
          fill="white"
          opacity="0"
          animate={{ opacity: isSleeping ? [0, 0.1, 0] : [0, 0.05, 0] }}
          transition={{ 
            duration: isSleeping ? 1.8 : 2.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </motion.svg>
    </motion.div>
  );
};

export default MaakMascot;
