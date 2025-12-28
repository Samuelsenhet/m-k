import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

interface MaakMascotProps {
  size?: number;
  className?: string;
  isSleeping?: boolean;
  onClick?: () => void;
}

export const MaakMascot = ({ 
  size = 200, 
  className = "", 
  isSleeping: initialSleeping = false,
  onClick 
}: MaakMascotProps) => {
  const [isSleeping, setIsSleeping] = useState(initialSleeping);
  const [isStartled, setIsStartled] = useState(false);
  const [expressionIndex, setExpressionIndex] = useState(0);
  
  const bodyControls = useAnimation();
  const headControls = useAnimation();

  // Head rotation animation
  useEffect(() => {
    const rotateHead = async () => {
      while (true) {
        await headControls.start({ 
          rotate: [0, 8, 0, -8, 0],
          transition: { duration: 4, ease: "easeInOut" }
        });
      }
    };
    if (!isStartled) rotateHead();
  }, [headControls, isStartled]);

  // Gravity bounce effect
  useEffect(() => {
    const gravityBounce = async () => {
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 3500));
        if (!isStartled) {
          await bodyControls.start({ 
            y: [0, 15, 0],
            transition: { 
              duration: 0.8, 
              times: [0, 0.5, 1],
              ease: ["easeIn", "easeOut"]
            }
          });
        }
      }
    };
    gravityBounce();
  }, [bodyControls, isStartled]);

  // Sleeping expression cycle
  useEffect(() => {
    if (isSleeping && !isStartled) {
      const interval = setInterval(() => {
        setExpressionIndex(prev => (prev + 1) % 3);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSleeping, isStartled]);

  const handleTap = () => {
    onClick?.();
    setIsStartled(true);
    setIsSleeping(false);
    
    headControls.start({ 
      rotate: 25, 
      y: -10,
      transition: { type: "spring", stiffness: 300 }
    });

    setTimeout(() => {
      setIsStartled(false);
      setIsSleeping(true);
      headControls.start({ 
        rotate: 0, 
        y: 0,
        transition: { type: "spring", stiffness: 100 }
      });
    }, 1200);
  };

  const scale = size / 200;

  return (
    <motion.svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 200 240"
      className={`cursor-pointer ${className}`}
      onClick={handleTap}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <defs>
        {/* Fluffy cloud filter for wool texture */}
        <filter id="fluffy" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        
        {/* Soft shadow */}
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#d4a5a5" floodOpacity="0.3"/>
        </filter>

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
      </defs>

      <motion.g animate={bodyControls}>
        {/* Feet */}
        <motion.ellipse
          cx="70"
          cy="225"
          rx="18"
          ry="12"
          fill="#f5e6d3"
          stroke="#e8d4c0"
          strokeWidth="1"
          animate={isSleeping ? { rotate: [-5, 5, -5] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        <motion.ellipse
          cx="130"
          cy="225"
          rx="18"
          ry="12"
          fill="#f5e6d3"
          stroke="#e8d4c0"
          strokeWidth="1"
          animate={isSleeping ? { rotate: [5, -5, 5] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        />

        {/* Body - fluffy wool */}
        <motion.g filter="url(#shadow)">
          {/* Main body cloud shapes */}
          {[
            { cx: 100, cy: 165, rx: 55, ry: 50 },
            { cx: 60, cy: 150, rx: 25, ry: 22 },
            { cx: 140, cy: 150, rx: 25, ry: 22 },
            { cx: 55, cy: 175, rx: 22, ry: 20 },
            { cx: 145, cy: 175, rx: 22, ry: 20 },
            { cx: 70, cy: 195, rx: 20, ry: 18 },
            { cx: 130, cy: 195, rx: 20, ry: 18 },
            { cx: 100, cy: 200, rx: 35, ry: 25 },
          ].map((shape, i) => (
            <ellipse
              key={`body-${i}`}
              cx={shape.cx}
              cy={shape.cy}
              rx={shape.rx}
              ry={shape.ry}
              fill="url(#bodyGradient)"
              stroke="#e8e0e0"
              strokeWidth="0.5"
            />
          ))}
        </motion.g>

        {/* Arms/Hands */}
        <motion.ellipse
          cx="35"
          cy="155"
          rx="20"
          ry="14"
          fill="#f5e6d3"
          stroke="#e8d4c0"
          strokeWidth="1"
          animate={isSleeping ? { rotate: [-15, 15, -15] } : { rotate: [-5, 5, -5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ transformOrigin: "55px 155px" }}
        />
        <motion.ellipse
          cx="165"
          cy="155"
          rx="20"
          ry="14"
          fill="#f5e6d3"
          stroke="#e8d4c0"
          strokeWidth="1"
          animate={isSleeping ? { rotate: [15, -15, 15] } : { rotate: [5, -5, 5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ transformOrigin: "145px 155px" }}
        />
      </motion.g>

      {/* Head group */}
      <motion.g animate={headControls} style={{ transformOrigin: "100px 80px" }}>
        {/* Ears */}
        <ellipse
          cx="45"
          cy="70"
          rx="15"
          ry="10"
          fill="#f5e6d3"
          stroke="#e8d4c0"
          strokeWidth="1"
          transform="rotate(-20 45 70)"
        />
        <ellipse
          cx="155"
          cy="70"
          rx="15"
          ry="10"
          fill="#f5e6d3"
          stroke="#e8d4c0"
          strokeWidth="1"
          transform="rotate(20 155 70)"
        />

        {/* Heart horns */}
        <motion.path
          d="M55 45 C55 35, 45 30, 40 40 C35 30, 25 35, 25 45 C25 55, 40 65, 40 65 C40 65, 55 55, 55 45"
          fill="url(#heartGradient)"
          stroke="#ff8fa3"
          strokeWidth="1"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: "40px 50px" }}
        />
        <motion.path
          d="M175 45 C175 35, 165 30, 160 40 C155 30, 145 35, 145 45 C145 55, 160 65, 160 65 C160 65, 175 55, 175 45"
          fill="url(#heartGradient)"
          stroke="#ff8fa3"
          strokeWidth="1"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          style={{ transformOrigin: "160px 50px" }}
        />

        {/* Head - fluffy wool */}
        <g filter="url(#shadow)">
          {[
            { cx: 100, cy: 80, rx: 45, ry: 40 },
            { cx: 65, cy: 65, rx: 18, ry: 16 },
            { cx: 135, cy: 65, rx: 18, ry: 16 },
            { cx: 60, cy: 85, rx: 15, ry: 14 },
            { cx: 140, cy: 85, rx: 15, ry: 14 },
            { cx: 75, cy: 105, rx: 14, ry: 12 },
            { cx: 125, cy: 105, rx: 14, ry: 12 },
            { cx: 100, cy: 110, rx: 25, ry: 15 },
            { cx: 100, cy: 55, rx: 20, ry: 15 },
            { cx: 80, cy: 50, rx: 12, ry: 10 },
            { cx: 120, cy: 50, rx: 12, ry: 10 },
          ].map((shape, i) => (
            <ellipse
              key={`head-${i}`}
              cx={shape.cx}
              cy={shape.cy}
              rx={shape.rx}
              ry={shape.ry}
              fill="url(#bodyGradient)"
              stroke="#e8e0e0"
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* Face area */}
        <ellipse
          cx="100"
          cy="85"
          rx="32"
          ry="30"
          fill="#fff5f5"
        />

        {/* Blush */}
        <ellipse cx="70" cy="90" rx="8" ry="5" fill="#ffccd5" opacity="0.6"/>
        <ellipse cx="130" cy="90" rx="8" ry="5" fill="#ffccd5" opacity="0.6"/>

        {/* Eyes */}
        {isStartled ? (
          <>
            {/* Startled eyes - wide open */}
            <circle cx="85" cy="80" r="8" fill="#3a3a4a"/>
            <circle cx="115" cy="80" r="8" fill="#3a3a4a"/>
            <circle cx="87" cy="78" r="3" fill="white"/>
            <circle cx="117" cy="78" r="3" fill="white"/>
          </>
        ) : isSleeping ? (
          <>
            {/* Sleeping eyes - closed curves */}
            <motion.path
              d="M77 80 Q85 85, 93 80"
              fill="none"
              stroke="#3a3a4a"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{ pathLength: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M107 80 Q115 85, 123 80"
              fill="none"
              stroke="#3a3a4a"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{ pathLength: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Zzz effect */}
            <motion.text
              x="140"
              y="55"
              fontSize="14"
              fill="#9ca3af"
              animate={{ 
                opacity: [0, 1, 0],
                y: [55, 45, 55]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              z
            </motion.text>
            <motion.text
              x="150"
              y="45"
              fontSize="12"
              fill="#9ca3af"
              animate={{ 
                opacity: [0, 1, 0],
                y: [45, 35, 45]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            >
              z
            </motion.text>
          </>
        ) : (
          <>
            {/* Normal eyes */}
            <ellipse cx="85" cy="80" rx="7" ry="8" fill="#3a3a4a"/>
            <ellipse cx="115" cy="80" rx="7" ry="8" fill="#3a3a4a"/>
            {/* Eye shine */}
            <circle cx="87" cy="78" r="2.5" fill="white"/>
            <circle cx="117" cy="78" r="2.5" fill="white"/>
            {/* Eyelashes */}
            <path d="M78 74 L75 70" stroke="#3a3a4a" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M82 72 L80 68" stroke="#3a3a4a" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M118 72 L120 68" stroke="#3a3a4a" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M122 74 L125 70" stroke="#3a3a4a" strokeWidth="1.5" strokeLinecap="round"/>
          </>
        )}

        {/* Mouth */}
        {isStartled ? (
          <ellipse cx="100" cy="98" rx="6" ry="8" fill="#e85a71"/>
        ) : isSleeping ? (
          <motion.path
            d="M95 97 Q100 100, 105 97"
            fill="none"
            stroke="#e85a71"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ d: ["M95 97 Q100 100, 105 97", "M95 98 Q100 99, 105 98", "M95 97 Q100 100, 105 97"] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        ) : (
          <path
            d="M90 95 Q100 108, 110 95"
            fill="#e85a71"
            stroke="#d44a61"
            strokeWidth="1"
          />
        )}
      </motion.g>
    </motion.svg>
  );
};

export default MaakMascot;
