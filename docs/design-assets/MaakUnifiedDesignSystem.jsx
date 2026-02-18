import React, { useState, useEffect } from 'react';
import { 
  Heart, X, MessageCircle, User, Search, Filter, Star, Send,
  Coffee, Plane, Music, BookOpen, Film, Gamepad2, Camera, Sparkles,
  Dumbbell, Utensils, Palette, MapPin, ChevronLeft, ChevronRight, Plus,
  Video, Mic, Volume2, Phone, MoreHorizontal, Check, Shield, Clock,
  Home, Bell, Settings, Eye, EyeOff, Lock, Image, Edit2,
  Brain, Users, Zap, Award, TrendingUp
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// 🌿 MÄÄK UNIFIED DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
// Merger av:
// - Eucalyptus Grove identitet (Forest Green + Sage)
// - Dribbble inspiration (Coral accents, moderna UI-mönster)
// - MÄÄK-specifika features (Personlighetstyper, Passa/Chatta/Se profil)
//
// CORE MATCHING PHILOSOPHY (IMMUTABLE):
// Flow: Passa → Chatta → Se profil
// ❌ No swipes, no likes, no percentages, no marketplace mechanics
// ═══════════════════════════════════════════════════════════════════════════════

const cn = (...c) => c.filter(Boolean).join(' ');

// ═══════════════════════════════════════════════════════════════════════════════
// 🐉 MÄÄK MASCOT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
// "En lugn vän som hjälper, inte en robot."
// 
// Mascoten är en lugn emotionell UX-companion som:
// - Minskar stress
// - Guidar varsamt  
// - Lugnar
// - Förklarar produktstater
// - Firar meningsfulla ögonblick lugnt
//
// Regler:
// - Visas ENDAST när den: lär ut, lugnar, förklarar, väntar, firar varsamt
// - Aldrig som dekoration
// - Aldrig hyperaktiv
// ═══════════════════════════════════════════════════════════════════════════════

// Mascot Token Map - Single Source of Truth
const MASCOT_TOKENS = {
  // App states
  home_idle: { token: 'mascot_calm_idle', goal: 'neutral', label: 'Calm' },
  loading: { token: 'mascot_waiting_tea', goal: 'wait', label: 'Loading' },
  empty_matches: { token: 'mascot_planting_seed', goal: 'reassure', label: 'Empty Matches' },
  no_chats: { token: 'mascot_practicing_mirror', goal: 'reassure', label: 'No Chats' },
  first_match: { token: 'mascot_lighting_lantern', goal: 'celebrate', label: 'First Match' },
  
  // AI Assistant states
  ai_listening: { token: 'mascot_ai_listening', goal: 'listen', label: 'Listening' },
  ai_thinking: { token: 'mascot_ai_thinking', goal: 'think', label: 'Thinking' },
  ai_answering: { token: 'mascot_ai_open_hand', goal: 'explain', label: 'Answering' },
  ai_celebrating: { token: 'mascot_ai_tiny_sparkle', goal: 'celebrate', label: 'Celebrating' },
  
  // Usage rules
  teaching: { token: 'mascot_teaching_book', goal: 'teach', label: 'Teaches' },
  reassuring: { token: 'mascot_holding_warm_light', goal: 'reassure', label: 'Reassures' },
  explaining: { token: 'mascot_presenting_ui_card', goal: 'explain', label: 'Explains' },
  waiting: { token: 'mascot_waiting_tea', goal: 'wait', label: 'Waits' },
  celebrating_gently: { token: 'mascot_lighting_lantern', goal: 'celebrate', label: 'Celebrates gently' },
  
  // Base poses
  front: { token: 'mascot_front', goal: 'neutral', label: 'Front' },
  sitting: { token: 'mascot_sitting', goal: 'neutral', label: 'Sitting' },
  walking: { token: 'mascot_walking', goal: 'neutral', label: 'Walking' },
  social: { token: 'mascot_social', goal: 'social', label: 'Social' },
  
  // Emotional states
  calm: { token: 'mascot_calm', goal: 'reassure', label: 'Calm' },
  encouraging: { token: 'mascot_encouraging', goal: 'reassure', label: 'Encouraging' },
  offline: { token: 'mascot_offline', goal: 'wait', label: 'Offline' },
  
  // Intro
  maak_intro: { token: 'mascot_calm_idle', goal: 'reassure', label: 'MÄÄK Intro' },
};

// Mascot Size & Placement
const MASCOT_LAYOUT = {
  hero: { size: 'w-[220px]', placement: 'center' },    // Onboarding, empty states
  medium: { size: 'w-[140px]', placement: 'center' },  // AI assistant
  icon: { size: 'w-[32px]', placement: 'inline' },     // Logo, badges
};

// Mascot Style System
const MASCOT_STYLES = {
  line: { name: 'Line illustration', usage: 'Primary in-app system', traits: ['scalable', 'calm', 'lightweight'] },
  soft3d: { name: 'Soft 3D / plush', usage: 'Marketing, App Store, Onboarding moments' },
  micro: { name: 'Micro mono', usage: 'App icon, Badges, Tiny UI moments' },
};

// Custom hook for mascot state
const useMascot = (screenState) => {
  const mascotData = MASCOT_TOKENS[screenState] || MASCOT_TOKENS.home_idle;
  const layout = screenState?.includes('ai_') ? MASCOT_LAYOUT.medium : 
                 screenState?.includes('empty') || screenState?.includes('first') ? MASCOT_LAYOUT.hero :
                 MASCOT_LAYOUT.medium;
  
  return {
    ...mascotData,
    ...layout,
  };
};

// Mascot Visual Component (SVG representation)
const MascotVisual = ({ state = 'calm', size = 'medium', className = '' }) => {
  const sizes = {
    icon: 'w-8 h-8',
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
    hero: 'w-56 h-56',
  };
  
  // Visual states mapping to expressions
  const expressions = {
    calm: { eyes: 'closed', mouth: 'smile' },
    listening: { eyes: 'open', mouth: 'small' },
    thinking: { eyes: 'open', mouth: 'small', glow: true },
    answering: { eyes: 'open', mouth: 'smile', hands: 'open' },
    celebrating: { eyes: 'open', mouth: 'big_smile', sparkles: true },
    encouraging: { eyes: 'open', mouth: 'smile', hearts: true },
    waiting: { eyes: 'open', mouth: 'small', tea: true },
    teaching: { eyes: 'open', mouth: 'smile', book: true },
    reassuring: { eyes: 'closed', mouth: 'smile', glow: true },
    explaining: { eyes: 'open', mouth: 'smile', card: true },
    offline: { eyes: 'closed', mouth: 'sleep', blanket: true },
    social: { eyes: 'open', mouth: 'big_smile', wave: true },
  };
  
  const expr = expressions[state] || expressions.calm;
  
  return (
    <div className={cn('relative flex items-center justify-center', sizes[size], className)}>
      {/* Mascot body - Cute pink dragon */}
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Glow effect */}
        {expr.glow && (
          <circle cx="50" cy="55" r="40" fill={`${COLORS.coral[200]}40`} />
        )}
        
        {/* Body */}
        <ellipse cx="50" cy="65" rx="28" ry="25" fill="#F8C8D4" />
        
        {/* Belly */}
        <ellipse cx="50" cy="68" rx="18" ry="16" fill="#FFF5E6" />
        
        {/* Head */}
        <ellipse cx="50" cy="40" rx="24" ry="22" fill="#F8C8D4" />
        
        {/* Heart horns */}
        <g>
          <ellipse cx="38" cy="18" rx="6" ry="7" fill="#F97068" />
          <ellipse cx="50" cy="12" rx="7" ry="8" fill="#F97068" />
          <ellipse cx="62" cy="18" rx="6" ry="7" fill="#F97068" />
        </g>
        
        {/* Cheek spots */}
        <circle cx="35" cy="38" r="3" fill="#FFE4B5" opacity="0.8" />
        <circle cx="65" cy="38" r="3" fill="#FFE4B5" opacity="0.8" />
        
        {/* Eyes */}
        {expr.eyes === 'closed' ? (
          <>
            <path d="M38 38 Q42 42 46 38" stroke="#5D4E60" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M54 38 Q58 42 62 38" stroke="#5D4E60" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="42" cy="38" rx="5" ry="6" fill="#5D4E60" />
            <ellipse cx="58" cy="38" rx="5" ry="6" fill="#5D4E60" />
            <circle cx="43" cy="37" r="2" fill="white" />
            <circle cx="59" cy="37" r="2" fill="white" />
          </>
        )}
        
        {/* Mouth */}
        {expr.mouth === 'big_smile' ? (
          <path d="M44 48 Q50 55 56 48" stroke="#5D4E60" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : expr.mouth === 'sleep' ? (
          <text x="50" y="52" textAnchor="middle" fontSize="8" fill="#5D4E60">z z z</text>
        ) : (
          <path d="M46 48 Q50 52 54 48" stroke="#5D4E60" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}
        
        {/* Wings */}
        <path d="M22 55 Q15 50 18 60 Q20 65 25 62" fill="#FFB5A8" />
        <path d="M78 55 Q85 50 82 60 Q80 65 75 62" fill="#FFB5A8" />
        
        {/* Arms/Hands */}
        {expr.hands === 'open' ? (
          <>
            <ellipse cx="28" cy="60" rx="6" ry="5" fill="#F8C8D4" />
            <ellipse cx="72" cy="60" rx="6" ry="5" fill="#F8C8D4" />
          </>
        ) : expr.wave ? (
          <>
            <ellipse cx="28" cy="55" rx="5" ry="6" fill="#F8C8D4" transform="rotate(-20 28 55)" />
            <ellipse cx="72" cy="60" rx="6" ry="5" fill="#F8C8D4" />
          </>
        ) : null}
        
        {/* Feet */}
        <ellipse cx="38" cy="85" rx="8" ry="5" fill="#F8C8D4" />
        <ellipse cx="62" cy="85" rx="8" ry="5" fill="#F8C8D4" />
      </svg>
      
      {/* Props & accessories */}
      {expr.sparkles && (
        <div className="absolute top-0 right-0">
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
        </div>
      )}
      {expr.hearts && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <Heart className="w-4 h-4 text-coral-400 animate-bounce" fill={COLORS.coral[400]} />
        </div>
      )}
      {expr.tea && (
        <div className="absolute bottom-2 right-2 text-lg">☕</div>
      )}
      {expr.book && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-lg">📖</div>
      )}
      {expr.card && (
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-sm">💬</div>
      )}
      {expr.blanket && (
        <div className="absolute bottom-0 right-0 text-lg">🛏️</div>
      )}
    </div>
  );
};

// Mascot Component with message
const Mascot = ({ state = 'calm', size = 'medium', message, showIntro = false }) => {
  const mascotData = MASCOT_TOKENS[state] || MASCOT_TOKENS.home_idle;
  
  // Intro messages
  const introMessages = {
    maak_intro: 'Jag heter Määk. Jag finns här med dig – medan vi hittar någon som verkligen passar.',
    loading: 'Jag är här medan vi väntar. Bra saker får ta tid.',
    empty_matches: 'Bra saker tar lite tid. 🌱',
    no_chats: 'Övning ger färdighet! Hej! 👋',
    first_match: 'Jag sa ju att det var värt att vänta. 💛',
    ai_listening: 'Jag lyssnar...',
    ai_thinking: 'Låt mig tänka...',
    ai_answering: 'Här är vad jag tänker...',
    teaching: 'Låt mig visa dig...',
    reassuring: 'Det kommer att gå bra.',
    explaining: 'Så här fungerar det...',
    celebrating_gently: 'Vilken fin stund! ✨',
  };
  
  const displayMessage = message || introMessages[state] || '';
  
  return (
    <div className="flex flex-col items-center gap-4">
      <MascotVisual state={state} size={size} />
      
      {displayMessage && (
        <p 
          className="text-center text-sm max-w-[200px] animate-fade-in"
          style={{ 
            color: COLORS.neutral.slate,
            fontStyle: 'italic',
          }}
        >
          {displayMessage}
        </p>
      )}
    </div>
  );
};

// Mascot Showcase Component - Using actual uploaded images
const MascotShowcase = () => {
  const [activeCategory, setActiveCategory] = useState('ai');
  
  // Image paths - in production these would be imported or from CDN
  const MASCOT_IMAGES = {
    ai_assistant_modes: '/mascot/ai_assistant_modes.png',
    style_system: '/mascot/style_system.png',
    placement_logic: '/mascot/placement_logic.png',
    usage_rules_dark: '/mascot/usage_rules_dark.png',
    usage_rules_light: '/mascot/usage_rules_light.png',
    empty_states_dark: '/mascot/empty_states_dark.png',
    app_states: '/mascot/app_states.png',
    base_poses: '/mascot/base_poses.png',
    emotional_states: '/mascot/emotional_states.png',
  };
  
  const categories = {
    ai: {
      label: '🤖 AI Assistant',
      description: 'Listening → Thinking → Answering → Celebrating',
      image: 'ai_assistant_modes',
    },
    states: {
      label: '📱 App States',
      description: 'Empty Matches, Loading, No Chats, First Match',
      image: 'app_states',
    },
    usage: {
      label: '📋 Usage Rules',
      description: 'Teaches, Reassures, Explains, Celebrates gently',
      image: 'usage_rules_light',
    },
    poses: {
      label: '🧍 Base Poses',
      description: 'Front, Sitting, Walking, Social',
      image: 'base_poses',
    },
    emotions: {
      label: '💝 Emotional',
      description: 'Calm, Encouraging, Waiting, Social, Offline',
      image: 'emotional_states',
    },
    empty: {
      label: '📭 Empty States',
      description: 'Empty Matches, No Chats, First Match',
      image: 'empty_states_dark',
    },
    placement: {
      label: '📐 Placement',
      description: 'Hero, Medium, Icon sizes',
      image: 'placement_logic',
    },
    style: {
      label: '🎨 Style System',
      description: 'Line, Soft 3D, Micro mono',
      image: 'style_system',
    },
  };
  
  const activeData = categories[activeCategory];
  
  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={{ 
              background: activeCategory === key ? COLORS.primary[500] : COLORS.sage[100],
              color: activeCategory === key ? 'white' : COLORS.primary[700],
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
      
      {/* Active category info */}
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: COLORS.primary[700] }}>
          {activeData.label}
        </p>
        <p className="text-xs" style={{ color: COLORS.neutral.gray }}>
          {activeData.description}
        </p>
      </div>
      
      {/* Image preview placeholder */}
      <div 
        className="rounded-2xl overflow-hidden"
        style={{ 
          background: activeCategory === 'empty' || activeCategory === 'emotions' || activeCategory === 'placement' 
            ? COLORS.neutral.dark 
            : COLORS.sage[50],
          minHeight: '200px',
        }}
      >
        <div className="p-4 text-center">
          <p className="text-6xl mb-4">🐉</p>
          <p className="text-sm font-medium" style={{ color: COLORS.primary[700] }}>
            {activeData.label}
          </p>
          <p className="text-xs mt-2" style={{ color: COLORS.neutral.gray }}>
            Se bilderna i /mascot/ mappen
          </p>
          <p className="text-xs font-mono mt-1" style={{ color: COLORS.coral[500] }}>
            {activeData.image}.png
          </p>
        </div>
      </div>
      
      {/* Token info */}
      <div 
        className="p-3 rounded-xl text-xs font-mono"
        style={{ background: COLORS.neutral.cream }}
      >
        <span style={{ color: COLORS.neutral.gray }}>Image: </span>
        <span style={{ color: COLORS.primary[600] }}>{MASCOT_IMAGES[activeData.image]}</span>
      </div>
    </div>
  );
};

// Empty State with Mascot
const EmptyStateWithMascot = ({ state, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <Mascot state={state} size="large" />
      
      <h3 
        className="text-xl font-semibold mt-6 mb-2"
        style={{ color: COLORS.primary[800] }}
      >
        {title}
      </h3>
      
      <p 
        className="text-sm mb-6 max-w-[250px]"
        style={{ color: COLORS.neutral.gray }}
      >
        {description}
      </p>
      
      {action && (
        <ButtonPrimary onClick={action.onClick}>
          {action.label}
        </ButtonPrimary>
      )}
    </div>
  );
};

// AI Assistant Chat Bubble with Mascot
const AIChatBubble = ({ state = 'ai_answering', message }) => {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0">
        <MascotVisual state={state} size="small" />
      </div>
      <div 
        className="flex-1 p-4 rounded-2xl rounded-tl-md"
        style={{ background: COLORS.sage[100] }}
      >
        <p className="text-sm" style={{ color: COLORS.neutral.charcoal }}>
          {message}
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 UNIFIED COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
  // ─────────────────────────────────────────────────────────────────────────────
  // PRIMARY: Forest Green - MÄÄK:s huvudidentitet
  // Används för: CTAs, trust indicators, huvudåtgärder
  // ─────────────────────────────────────────────────────────────────────────────
  primary: {
    50:  '#F0F7F4',
    100: '#D9EDE4',
    200: '#B5DBC9',
    300: '#8AC4A9',
    400: '#5FA886',
    500: '#4B6E48',  // ← Huvudfärg
    600: '#3D5A3B',
    700: '#2F472E',
    800: '#253D2C',  // ← Text på ljus bakgrund
    900: '#1A2D1E',
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ACCENT: Coral - Emotionell värme (från Dribbble)
  // Används för: "Start Chat", likes, notifikationer, avatar-ringar
  // ─────────────────────────────────────────────────────────────────────────────
  coral: {
    50:  '#FFF5F3',
    100: '#FFE8E4',
    200: '#FFD4CC',
    300: '#FFB5A8',
    400: '#FF9080',
    500: '#F97068',  // ← Accent
    600: '#E85550',
    700: '#C9403B',
    800: '#A63330',
    900: '#872928',
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SECONDARY: Warm Sage - Mjuk betoning
  // Används för: Bakgrunder, inaktiva element, subtil UI
  // ─────────────────────────────────────────────────────────────────────────────
  sage: {
    50:  '#FDFCFA',
    100: '#F8F6F1',
    200: '#F0EDE4',
    300: '#E4DED0',
    400: '#D1C8B5',
    500: '#B2AC88',  // ← Secondary
    600: '#968F6B',
    700: '#787254',
    800: '#5A5640',
    900: '#3D3B2C',
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // NEUTRALS
  // ─────────────────────────────────────────────────────────────────────────────
  neutral: {
    white:    '#FFFFFF',
    offWhite: '#FAFAF8',
    cream:    '#F5F4F1',
    sand:     '#ECEAE5',
    stone:    '#D4D1CA',
    gray:     '#9A9790',
    slate:    '#6B6860',
    charcoal: '#3D3B36',
    dark:     '#1F1E1B',
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // PERSONALITY ARCHETYPES (MÄÄK unika)
  // ─────────────────────────────────────────────────────────────────────────────
  archetypes: {
    diplomat:   { main: '#8B5CF6', light: '#EDE9FE', name: 'Diplomaten', emoji: '🕊️' },
    strateg:    { main: '#3B82F6', light: '#DBEAFE', name: 'Strategen', emoji: '🎯' },
    byggare:    { main: '#4B6E48', light: '#D9EDE4', name: 'Byggaren', emoji: '🏗️' },
    upptackare: { main: '#F59E0B', light: '#FEF3C7', name: 'Upptäckaren', emoji: '🧭' },
    debattoren: { main: '#0891B2', light: '#CFFAFE', name: 'Debattören', emoji: '💡' },
    vardaren:   { main: '#EC4899', light: '#FCE7F3', name: 'Värdaren', emoji: '💝' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔤 TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════════

const FONTS = {
  sans: '"DM Sans", system-ui, sans-serif',
  serif: '"Playfair Display", Georgia, serif',
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🧱 BASE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// AVATARS
// ─────────────────────────────────────────────────────────────────────────────

// Standard Avatar
const Avatar = ({ src, name, size = 48, online, verified }) => (
  <div className="relative inline-block flex-shrink-0">
    <div 
      className="rounded-full overflow-hidden flex items-center justify-center font-semibold"
      style={{ 
        width: size, 
        height: size,
        background: src ? 'transparent' : COLORS.primary[100],
        color: COLORS.primary[700],
        fontSize: size * 0.4,
      }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        name?.[0]?.toUpperCase()
      )}
    </div>
    {online && (
      <div 
        className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2"
        style={{ background: COLORS.primary[500], borderColor: COLORS.neutral.white }}
      />
    )}
    {verified && (
      <div 
        className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
        style={{ background: COLORS.primary[500] }}
      >
        <Check className="w-3 h-3 text-white" strokeWidth={3} />
      </div>
    )}
  </div>
);

// Avatar med Coral Ring (för nya meddelanden/stories - Dribbble stil)
const AvatarWithRing = ({ src, name, size = 56, hasRing = false, showName = true }) => (
  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
    <div 
      className="rounded-full p-[3px] transition-all"
      style={{ 
        background: hasRing 
          ? `linear-gradient(135deg, ${COLORS.coral[500]} 0%, ${COLORS.coral[300]} 100%)`
          : 'transparent'
      }}
    >
      <div 
        className="rounded-full overflow-hidden border-2 border-white flex items-center justify-center font-semibold"
        style={{ 
          width: size, 
          height: size,
          background: src ? 'transparent' : COLORS.coral[100],
          color: COLORS.coral[600],
          fontSize: size * 0.4,
        }}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          name?.[0]?.toUpperCase()
        )}
      </div>
    </div>
    {showName && (
      <span 
        className="text-xs truncate max-w-[64px] text-center"
        style={{ color: COLORS.neutral.slate }}
      >
        {name}
      </span>
    )}
  </div>
);

// Archetype Avatar (med personlighetsfärg)
const ArchetypeAvatar = ({ src, name, archetype, size = 56 }) => {
  const arch = COLORS.archetypes[archetype] || COLORS.archetypes.byggare;
  
  return (
    <div className="relative inline-block flex-shrink-0">
      <div 
        className="rounded-full p-[3px]"
        style={{ background: `linear-gradient(135deg, ${arch.main} 0%, ${arch.main}99 100%)` }}
      >
        <div 
          className="rounded-full overflow-hidden border-2 border-white flex items-center justify-center font-semibold"
          style={{ 
            width: size, 
            height: size,
            background: src ? 'transparent' : arch.light,
            color: arch.main,
            fontSize: size * 0.4,
          }}
        >
          {src ? (
            <img src={src} alt={name} className="w-full h-full object-cover" />
          ) : (
            arch.emoji || name?.[0]?.toUpperCase()
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BUTTONS
// ─────────────────────────────────────────────────────────────────────────────

// Primary Button (Forest Green)
const ButtonPrimary = ({ children, size = 'md', icon: Icon, iconRight, fullWidth, disabled, ...props }) => {
  const sizes = {
    sm: 'h-10 px-4 text-sm gap-1.5 rounded-xl',
    md: 'h-12 px-6 text-base gap-2 rounded-xl',
    lg: 'h-14 px-8 text-lg gap-2.5 rounded-2xl',
  };
  
  return (
    <button
      className={cn(
        'font-semibold inline-flex items-center justify-center transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        sizes[size],
        fullWidth && 'w-full'
      )}
      style={{ 
        background: `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`,
        color: COLORS.neutral.white,
        boxShadow: `0 4px 14px ${COLORS.primary[500]}35`,
      }}
      disabled={disabled}
      {...props}
    >
      {Icon && !iconRight && <Icon className="w-5 h-5" />}
      {children}
      {Icon && iconRight && <Icon className="w-5 h-5" />}
    </button>
  );
};

// Coral Accent Button (för "Start Chat", emotionella actions)
const ButtonCoral = ({ children, size = 'md', icon: Icon, fullWidth, ...props }) => {
  const sizes = {
    sm: 'h-10 px-4 text-sm gap-1.5 rounded-xl',
    md: 'h-12 px-6 text-base gap-2 rounded-xl',
    lg: 'h-14 px-8 text-lg gap-2.5 rounded-2xl',
  };
  
  return (
    <button
      className={cn(
        'font-semibold inline-flex items-center justify-center transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        sizes[size],
        fullWidth && 'w-full'
      )}
      style={{ 
        background: `linear-gradient(135deg, ${COLORS.coral[500]} 0%, ${COLORS.coral[400]} 100%)`,
        color: COLORS.neutral.white,
        boxShadow: `0 4px 14px ${COLORS.coral[500]}35`,
      }}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

// Secondary Button
const ButtonSecondary = ({ children, size = 'md', icon: Icon, fullWidth, ...props }) => {
  const sizes = {
    sm: 'h-10 px-4 text-sm gap-1.5 rounded-xl',
    md: 'h-12 px-6 text-base gap-2 rounded-xl',
    lg: 'h-14 px-8 text-lg gap-2.5 rounded-2xl',
  };
  
  return (
    <button
      className={cn(
        'font-medium inline-flex items-center justify-center transition-all duration-200',
        'hover:bg-opacity-80 active:scale-[0.98] border-2',
        sizes[size],
        fullWidth && 'w-full'
      )}
      style={{ 
        background: COLORS.neutral.white,
        color: COLORS.primary[700],
        borderColor: COLORS.sage[300],
      }}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

// Ghost Button
const ButtonGhost = ({ children, size = 'md', icon: Icon, ...props }) => {
  const sizes = {
    sm: 'h-10 px-4 text-sm gap-1.5 rounded-xl',
    md: 'h-12 px-5 text-base gap-2 rounded-xl',
    lg: 'h-14 px-6 text-lg gap-2.5 rounded-xl',
  };
  
  return (
    <button
      className={cn(
        'font-medium inline-flex items-center justify-center transition-all duration-200',
        'hover:bg-black/5 active:scale-[0.98]',
        sizes[size]
      )}
      style={{ color: COLORS.primary[600] }}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

// Icon Button
const ButtonIcon = ({ icon: Icon, variant = 'default', size = 'md', ...props }) => {
  const sizes = { sm: 'w-10 h-10', md: 'w-12 h-12', lg: 'w-16 h-16' };
  const iconSizes = { sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-8 h-8' };
  
  const variants = {
    default: { bg: COLORS.neutral.cream, color: COLORS.neutral.slate, shadow: 'none' },
    primary: { bg: COLORS.primary[500], color: COLORS.neutral.white, shadow: `0 4px 14px ${COLORS.primary[500]}35` },
    coral: { bg: COLORS.coral[500], color: COLORS.neutral.white, shadow: `0 4px 14px ${COLORS.coral[500]}35` },
    ghost: { bg: 'transparent', color: COLORS.neutral.slate, shadow: 'none' },
    outline: { bg: 'transparent', color: COLORS.neutral.slate, shadow: 'none', border: COLORS.sage[300] },
    glass: { bg: 'rgba(255,255,255,0.15)', color: COLORS.neutral.white, shadow: 'none' },
  };
  
  const v = variants[variant] || variants.default;
  
  return (
    <button
      className={cn(
        'rounded-full flex items-center justify-center transition-all duration-200',
        'hover:scale-105 active:scale-95',
        sizes[size]
      )}
      style={{ 
        background: v.bg, 
        color: v.color,
        boxShadow: v.shadow,
        border: v.border ? `2px solid ${v.border}` : 'none',
      }}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
};

// MÄÄK Action Buttons (Passa → Chatta → Se profil)
// CORE PHILOSOPHY: No likes, no swipes, no percentages
const ActionButtons = ({ onPass, onChat, onViewProfile }) => (
  <div className="flex items-center justify-center gap-3">
    <button
      onClick={onPass}
      className="flex items-center gap-2 h-12 px-5 rounded-2xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: COLORS.neutral.cream, color: COLORS.neutral.slate }}
    >
      <X className="w-5 h-5" />
      <span>Passa</span>
    </button>
    
    {/* CHATTA = Primary emotional action */}
    <button
      onClick={onChat}
      className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all hover:scale-[1.05] active:scale-[0.95]"
      style={{ 
        background: `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`,
        boxShadow: `0 8px 24px ${COLORS.primary[500]}40`,
      }}
    >
      <MessageCircle className="w-8 h-8 text-white" fill="white" />
    </button>
    
    <button
      onClick={onViewProfile}
      className="flex items-center gap-2 h-12 px-5 rounded-2xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: COLORS.neutral.cream, color: COLORS.primary[700] }}
    >
      <span>Se profil</span>
      <ChevronRight className="w-5 h-5" />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// INPUTS
// ─────────────────────────────────────────────────────────────────────────────

// Standard Input
const Input = ({ label, icon: Icon, error, hint, ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-sm font-medium" style={{ color: COLORS.primary[800] }}>
        {label}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <Icon 
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" 
          style={{ color: COLORS.neutral.gray }}
        />
      )}
      <input
        className={cn(
          'w-full h-12 rounded-xl transition-all duration-200',
          'border-2 focus:outline-none focus:border-primary-400',
          Icon ? 'pl-12 pr-4' : 'px-4'
        )}
        style={{ 
          background: COLORS.neutral.cream,
          borderColor: error ? COLORS.coral[500] : 'transparent',
          color: COLORS.neutral.charcoal,
        }}
        {...props}
      />
    </div>
    {error && <p className="text-sm" style={{ color: COLORS.coral[600] }}>{error}</p>}
    {hint && !error && <p className="text-sm" style={{ color: COLORS.neutral.gray }}>{hint}</p>}
  </div>
);

// Search Input
const InputSearch = ({ placeholder = 'Sök...', ...props }) => (
  <div className="relative">
    <Search 
      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
      style={{ color: COLORS.neutral.gray }}
    />
    <input
      className="w-full h-11 pl-12 pr-4 rounded-full transition-all duration-200 focus:outline-none focus:ring-2"
      style={{ 
        background: COLORS.neutral.cream,
        color: COLORS.neutral.charcoal,
        '--tw-ring-color': COLORS.primary[200],
      }}
      placeholder={placeholder}
      {...props}
    />
  </div>
);

// OTP Input
const InputOTP = ({ length = 6, value = '', onChange }) => {
  const [otp, setOtp] = useState(value.split('').slice(0, length));
  
  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    onChange?.(newOtp.join(''));
    if (val && index < length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };
  
  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          className="w-12 h-14 text-center text-xl font-semibold rounded-xl border-2 transition-all duration-200 focus:outline-none"
          style={{ 
            background: COLORS.neutral.white,
            borderColor: otp[i] ? COLORS.primary[400] : COLORS.sage[200],
            color: COLORS.neutral.dark,
          }}
        />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BADGES & CHIPS
// ─────────────────────────────────────────────────────────────────────────────

// Status Badge (Start Chat, Your Turn, etc.)
const StatusBadge = ({ variant = 'default', children }) => {
  const variants = {
    default: { bg: COLORS.sage[100], color: COLORS.sage[700], border: 'transparent' },
    coral: { bg: COLORS.coral[500], color: COLORS.neutral.white, border: 'transparent' },
    coralOutline: { bg: 'transparent', color: COLORS.coral[500], border: COLORS.coral[500] },
    primary: { bg: COLORS.primary[100], color: COLORS.primary[700], border: 'transparent' },
    success: { bg: COLORS.primary[100], color: COLORS.primary[700], border: 'transparent' },
  };
  
  const v = variants[variant] || variants.default;
  
  return (
    <span 
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
      style={{ 
        background: v.bg, 
        color: v.color,
        border: v.border !== 'transparent' ? `1.5px solid ${v.border}` : 'none',
      }}
    >
      {children}
    </span>
  );
};

// Archetype Badge
const ArchetypeBadge = ({ archetype, size = 'md' }) => {
  const arch = COLORS.archetypes[archetype];
  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };
  
  if (!arch) return null;
  
  return (
    <span 
      className={cn('inline-flex items-center rounded-full font-medium', sizes[size])}
      style={{ background: arch.light, color: arch.main }}
    >
      <span>{arch.emoji}</span>
      <span>{arch.name}</span>
    </span>
  );
};

// Archetype Match Badge (personality-based, NOT percentage)
// CORE PHILOSOPHY: No scores, no percentages, no marketplace mechanics
const ArchetypeMatchBadge = ({ type = 'likhets' }) => {
  const types = {
    likhets: { label: 'Likhets-match', bg: COLORS.primary[100], color: COLORS.primary[700] },
    motsats: { label: 'Motsats-match', bg: COLORS.coral[100], color: COLORS.coral[700] },
  };
  const t = types[type] || types.likhets;
  
  return (
    <span 
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
      style={{ background: t.bg, color: t.color }}
    >
      <Sparkles className="w-4 h-4" />
      {t.label}
    </span>
  );
};

// Interest Chip (med ikon - Dribbble stil)
const InterestChip = ({ icon: Icon, label, selected, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200',
      'hover:scale-[1.02] active:scale-[0.98]'
    )}
    style={{ 
      background: selected ? COLORS.primary[100] : COLORS.neutral.white,
      borderColor: selected ? COLORS.primary[400] : COLORS.sage[200],
      color: selected ? COLORS.primary[700] : COLORS.neutral.charcoal,
    }}
  >
    {Icon && <Icon className="w-4 h-4" />}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// CARDS
// ─────────────────────────────────────────────────────────────────────────────

// Base Card
const Card = ({ children, className, hover, ...props }) => (
  <div
    className={cn(
      'rounded-2xl p-5 transition-all duration-200',
      hover && 'hover:shadow-lg cursor-pointer',
      className
    )}
    style={{ 
      background: COLORS.neutral.white,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)',
    }}
    {...props}
  >
    {children}
  </div>
);

// Best Matches Card (Dribbble stil)
const BestMatchCard = ({ profile, onClick }) => (
  <button
    onClick={onClick}
    className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:scale-[1.02] transition-all duration-200 w-full text-left"
  >
    {profile.photo ? (
      <img src={profile.photo} alt={profile.name} className="absolute inset-0 w-full h-full object-cover" />
    ) : (
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${COLORS.sage[100]} 0%, ${COLORS.sage[200]} 100%)` }}
      >
        <User className="w-16 h-16" style={{ color: COLORS.sage[400] }} />
      </div>
    )}
    
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
    
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <h3 className="text-white font-semibold text-lg mb-2">{profile.name}</h3>
      <div className="flex flex-wrap gap-1.5">
        {profile.interests?.slice(0, 2).map((interest, i) => (
          <span 
            key={i}
            className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm flex items-center gap-1"
          >
            {interest.icon && <interest.icon className="w-3 h-3" />}
            {interest.label}
          </span>
        ))}
      </div>
    </div>
  </button>
);

// Chat List Item
const ChatListItem = ({ match, message, time, status, unread, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-black/[0.03] text-left"
  >
    <AvatarWithRing 
      src={match.photo} 
      name={match.name} 
      size={52} 
      hasRing={unread}
      showName={false}
    />
    
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold truncate" style={{ color: COLORS.neutral.dark }}>
        {match.name}
      </h4>
      <p className="text-sm truncate" style={{ color: COLORS.neutral.gray }}>
        {message}
      </p>
    </div>
    
    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
      <span className="text-xs" style={{ color: COLORS.neutral.gray }}>{time}</span>
      {status === 'start' && <StatusBadge variant="coral">Start Chat</StatusBadge>}
      {status === 'turn' && <StatusBadge variant="coralOutline">Your Turn</StatusBadge>}
    </div>
  </button>
);

// Match Profile Card - Mio/Hyperactive inspired stacked cards
// CORE PHILOSOPHY: Passa → Chatta → Se profil, no percentages, no likes
const MatchProfileCard = ({ profile, onPass, onChat, onViewProfile }) => {
  const arch = COLORS.archetypes[profile.archetype] || COLORS.archetypes.byggare;
  
  return (
    <div className="relative">
      {/* Stacked cards behind */}
      <div 
        className="absolute -top-3 left-4 right-4 h-full rounded-3xl"
        style={{ background: COLORS.coral[200], transform: 'rotate(-3deg)' }}
      />
      <div 
        className="absolute -top-2 left-2 right-2 h-full rounded-3xl"
        style={{ background: COLORS.primary[200], transform: 'rotate(2deg)' }}
      />
      
      {/* Main card */}
      <div 
        className="relative rounded-3xl overflow-hidden shadow-xl"
        style={{ background: COLORS.neutral.white }}
      >
        {/* Photo section - taller aspect ratio */}
        <div className="relative aspect-[3/4]" style={{ background: COLORS.sage[100] }}>
          {profile.photo ? (
            <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(180deg, ${COLORS.sage[100]} 0%, ${COLORS.sage[200]} 100%)` }}
            >
              <div className="text-center">
                <span className="text-8xl mb-4 block">{arch.emoji}</span>
                <p className="text-sm" style={{ color: COLORS.neutral.gray }}>Demo</p>
              </div>
            </div>
          )}
          
          {/* Floating action buttons at top */}
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            {/* Passa button (X) - Left */}
            <button
              onClick={onPass}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
              style={{ background: COLORS.primary[400] }}
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Chatta button (MessageCircle) - Right - PRIMARY ACTION */}
            <button
              onClick={onChat}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
              style={{ background: COLORS.coral[400] }}
            >
              <MessageCircle className="w-6 h-6 text-white" fill="white" />
            </button>
          </div>
          
          {/* Gradient overlay at bottom */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-48"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
          />
          
          {/* Info overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            {/* Name and age */}
            <h2 className="text-3xl font-bold text-white mb-2">
              {profile.name} <span className="font-normal">{profile.age || 26}</span>
            </h2>
            
            {/* Online status */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-white/90 text-sm">Online</span>
            </div>
            
            {/* Interest chips */}
            <div className="flex flex-wrap gap-2">
              {(profile.interests || [
                { icon: Camera, label: 'Fotografi' },
                { icon: Plane, label: 'Resor' },
              ]).map((interest, i) => (
                <span 
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  {interest.icon && <interest.icon className="w-4 h-4" />}
                  {interest.label}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom action bar - glass morphism style */}
        <div 
          className="p-4 flex items-center justify-center gap-3"
          style={{ background: COLORS.neutral.cream }}
        >
          <button
            onClick={onPass}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all hover:scale-[1.02]"
            style={{ background: COLORS.neutral.white, color: COLORS.neutral.slate, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            <X className="w-5 h-5" />
            Passa
          </button>
          
          <button
            onClick={onChat}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{ 
              background: `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`,
              color: 'white',
              boxShadow: `0 4px 16px ${COLORS.primary[500]}40`
            }}
          >
            <MessageCircle className="w-5 h-5" fill="white" />
            Chatta
          </button>
          
          <button
            onClick={onViewProfile}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all hover:scale-[1.02]"
            style={{ background: COLORS.neutral.white, color: COLORS.primary[700], boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            Se profil
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MÄÄK CLASSIC MATCH CARD (from Image 3)
// ─────────────────────────────────────────────────────────────────────────────

const MatchCardClassic = ({ profile, onPass, onChat, onViewProfile }) => {
  const arch = COLORS.archetypes[profile.archetype] || COLORS.archetypes.byggare;
  
  return (
    <div className="space-y-4">
      {/* Mini preview card */}
      <div 
        className="rounded-2xl p-4 flex items-center gap-3"
        style={{ background: COLORS.sage[100] }}
      >
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: COLORS.neutral.white }}
        >
          {arch.emoji}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold" style={{ color: COLORS.primary[800] }}>{profile.name}</h3>
          <div className="flex gap-2 mt-1">
            <span 
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: arch.main, color: 'white' }}
            >
              {arch.name}
            </span>
            <span 
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: COLORS.primary[500], color: 'white' }}
            >
              Likhets-match
            </span>
          </div>
        </div>
      </div>
      
      {/* Detailed card */}
      <Card>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold" style={{ color: COLORS.primary[800] }}>{profile.name}</h2>
            <span className="text-2xl">{arch.emoji}</span>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ color: COLORS.neutral.gray }}>matchning</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-4 h-4" style={{ color: COLORS.neutral.gray }} />
              <span className="text-sm" style={{ color: COLORS.neutral.slate }}>23h 59m</span>
            </div>
          </div>
        </div>
        
        {/* Archetype badge */}
        <div className="mb-4">
          <ArchetypeBadge archetype={profile.archetype} />
        </div>
        
        {/* Bio */}
        <p className="mb-4" style={{ color: COLORS.neutral.charcoal }}>
          {profile.bio}
        </p>
        
        {/* Traits */}
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.traits?.map((trait, i) => (
            <span 
              key={i}
              className="px-3 py-1.5 rounded-full text-sm font-medium border"
              style={{ 
                background: COLORS.neutral.white, 
                color: COLORS.primary[700],
                borderColor: COLORS.sage[200]
              }}
            >
              {trait}
            </span>
          ))}
        </div>
        
        {/* Quote */}
        {profile.quote && (
          <div className="flex gap-3 mb-5">
            <div 
              className="w-1 rounded-full flex-shrink-0"
              style={{ background: COLORS.coral[400] }}
            />
            <p className="italic" style={{ color: COLORS.neutral.slate }}>
              "{profile.quote}"
            </p>
          </div>
        )}
        
        {/* Progress bar */}
        <div 
          className="h-2 rounded-full mb-5 overflow-hidden"
          style={{ background: COLORS.sage[100] }}
        >
          <div 
            className="h-full rounded-full"
            style={{ 
              width: '75%',
              background: `linear-gradient(90deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`
            }}
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onPass}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-medium transition-all hover:scale-[1.02]"
            style={{ background: COLORS.neutral.cream, color: COLORS.neutral.slate }}
          >
            <X className="w-5 h-5" />
            Passa
          </button>
          
          <button
            onClick={onChat}
            className="flex-[2] flex items-center justify-center gap-2 h-12 rounded-xl font-semibold transition-all hover:scale-[1.02]"
            style={{ 
              background: `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`,
              color: 'white'
            }}
          >
            <MessageCircle className="w-5 h-5" />
            Chatta
          </button>
          
          <button
            onClick={onViewProfile}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-medium transition-all hover:scale-[1.02]"
            style={{ background: COLORS.neutral.cream, color: COLORS.primary[700] }}
          >
            Se profil
          </button>
        </div>
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MATCH LIST PAGE (from Image 2 - Dagens matchningar)
// ─────────────────────────────────────────────────────────────────────────────

const MatchListItem = ({ name, archetype, emoji, onClick }) => {
  const arch = COLORS.archetypes[archetype] || COLORS.archetypes.byggare;
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01]"
      style={{ background: COLORS.neutral.white, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: COLORS.sage[100] }}
      >
        {emoji}
      </div>
      <div className="flex-1 text-left">
        <h3 className="font-semibold text-lg" style={{ color: COLORS.primary[800] }}>{name}</h3>
        <div className="flex items-center gap-1.5">
          <span>{arch.emoji}</span>
          <span className="text-sm" style={{ color: COLORS.neutral.slate }}>{arch.name}</span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5" style={{ color: COLORS.neutral.gray }} />
    </button>
  );
};

const MatchListPage = () => {
  const [activeFilter, setActiveFilter] = useState('alla');
  
  const matches = [
    { name: 'Emma', archetype: 'diplomat', emoji: '🎭' },
    { name: 'Lucas', archetype: 'strateg', emoji: '🦋' },
  ];
  
  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.neutral.offWhite }}>
      {/* Header */}
      <div className="p-4 pt-6">
        <h1 
          className="text-3xl font-bold mb-1"
          style={{ 
            fontFamily: '"Playfair Display", serif',
            color: COLORS.primary[700]
          }}
        >
          Dagens matchningar
        </h1>
        <p className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.neutral.gray }}>
          <Clock className="w-4 h-4" />
          24h löpande • Kvalitetsfokus
        </p>
      </div>
      
      {/* Smart Personlighetsanalys card */}
      <div className="px-4 mb-6">
        <div 
          className="p-4 rounded-2xl"
          style={{ background: COLORS.neutral.white, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: COLORS.primary[100] }}
            >
              <Zap className="w-6 h-6" style={{ color: COLORS.primary[600] }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: COLORS.primary[800] }}>
                Smart Personlighetsanalys
              </h3>
              <p className="text-sm" style={{ color: COLORS.neutral.gray }}>
                Baserad på 30 frågor • 16 arketyper • 4 kategorier
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border"
              style={{ borderColor: COLORS.primary[300], color: COLORS.primary[700] }}
            >
              <Users className="w-4 h-4" />
              1 Likhets
            </span>
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border"
              style={{ borderColor: COLORS.coral[300], color: COLORS.coral[600] }}
            >
              <Sparkles className="w-4 h-4" />
              1 Motsats
            </span>
          </div>
        </div>
      </div>
      
      {/* Dina matchningar section */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5" style={{ color: COLORS.sage[400] }} />
          <h2 
            className="text-2xl font-semibold"
            style={{ 
              fontFamily: '"Playfair Display", serif',
              color: COLORS.primary[700]
            }}
          >
            Dina matchningar
          </h2>
        </div>
        
        {/* Match list */}
        <div className="space-y-3 mb-6">
          {matches.map((match, i) => (
            <MatchListItem key={i} {...match} onClick={() => {}} />
          ))}
        </div>
        
        {/* Filter tabs */}
        <div 
          className="flex rounded-full p-1"
          style={{ background: COLORS.neutral.cream }}
        >
          {[
            { id: 'alla', label: 'Alla (2)' },
            { id: 'likhets', label: '👥 Likhets (1)' },
            { id: 'motsats', label: '✨ Motsats (1)' },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className="flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all"
              style={{ 
                background: activeFilter === filter.id ? COLORS.neutral.white : 'transparent',
                color: activeFilter === filter.id ? COLORS.primary[700] : COLORS.neutral.gray,
                boxShadow: activeFilter === filter.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        {/* Footer */}
        <p 
          className="text-center text-sm mt-6"
          style={{ color: COLORS.neutral.gray }}
        >
          Synkflöde + Vågflöde matchningar
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PAGE MÄÄK (from Image 1 - Dark style)
// ─────────────────────────────────────────────────────────────────────────────

const ProfilePageMaak = ({ profile }) => {
  const arch = COLORS.archetypes[profile?.archetype] || COLORS.archetypes.byggare;
  
  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.neutral.dark }}>
      {/* Photo section */}
      <div className="relative h-72">
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(180deg, ${COLORS.sage[400]} 0%, ${COLORS.sage[500]} 100%)` }}
        >
          <span className="text-8xl">{arch.emoji}</span>
        </div>
        
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{ background: `linear-gradient(to top, ${COLORS.neutral.dark} 0%, transparent 50%)` }}
        />
      </div>
      
      {/* Content overlay */}
      <div className="relative -mt-32 px-6">
        {/* Name */}
        <h1 className="text-3xl font-bold text-white mb-2">
          {profile?.name || 'Samuel Pierre'}
        </h1>
        
        {/* Age | Height */}
        <p className="text-xl text-white/80 mb-2">
          {profile?.age || 29} | {profile?.height || '167 cm'}
        </p>
        
        {/* Instagram */}
        {profile?.instagram && (
          <p className="mb-3" style={{ color: COLORS.primary[300] }}>
            Instagram @{profile.instagram}
          </p>
        )}
        
        {/* Occupation */}
        <p className="text-lg text-white/90 mb-1">
          {profile?.occupation || 'Entrepenör'}
        </p>
        
        {/* Location */}
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4" style={{ color: COLORS.neutral.gray }} />
          <span style={{ color: COLORS.neutral.gray }}>
            {profile?.location || 'Spånga, Sverige'}
          </span>
        </div>
        
        {/* Archetype badge */}
        <div className="mb-6">
          <span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium"
            style={{ background: COLORS.primary[600], color: 'white' }}
          >
            <span>{arch.emoji}</span>
            {arch.name}
          </span>
        </div>
        
        {/* Edit profile button */}
        <button
          className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl font-medium mb-4 border"
          style={{ 
            background: 'rgba(255,255,255,0.1)',
            borderColor: 'rgba(255,255,255,0.2)',
            color: 'white'
          }}
        >
          <Edit2 className="w-5 h-5" />
          Redigera profil
        </button>
        
        {/* Visa mer */}
        <button 
          className="w-full flex items-center justify-center gap-2 py-3"
          style={{ color: COLORS.neutral.gray }}
        >
          <ChevronDown className="w-5 h-5" />
          Visa mer
        </button>
      </div>
    </div>
  );
};

// ChevronDown icon (add to imports if needed)
const ChevronDown = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

// Progress Steps (för onboarding)
const ProgressSteps = ({ current, total }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <div 
        key={i}
        className="h-1.5 flex-1 rounded-full transition-all duration-300"
        style={{ 
          background: i < current 
            ? `linear-gradient(90deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`
            : i === current 
              ? COLORS.primary[200]
              : COLORS.sage[200]
        }}
      />
    ))}
  </div>
);

// Bottom Navigation
const BottomNav = ({ active, onChange }) => {
  const items = [
    { id: 'home', icon: Heart, label: 'Matchning' },
    { id: 'chat', icon: MessageCircle, label: 'Chatt', badge: 3 },
    { id: 'profile', icon: User, label: 'Profil' },
  ];
  
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 flex justify-around py-2 border-t backdrop-blur-xl"
      style={{ 
        background: `${COLORS.neutral.white}ee`,
        borderColor: COLORS.sage[100],
      }}
    >
      {items.map(item => (
        <button 
          key={item.id}
          onClick={() => onChange?.(item.id)}
          className="relative flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all"
          style={{ 
            color: active === item.id ? COLORS.primary[600] : COLORS.neutral.gray,
            background: active === item.id ? COLORS.primary[50] : 'transparent',
          }}
        >
          <item.icon 
            className="w-6 h-6" 
            fill={active === item.id ? 'currentColor' : 'none'}
            strokeWidth={active === item.id ? 2.5 : 2}
          />
          <span className="text-xs font-medium">{item.label}</span>
          
          {item.badge && (
            <span 
              className="absolute -top-0.5 right-3 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
              style={{ background: COLORS.coral[500] }}
            >
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

// Online Counter Banner
const OnlineBanner = ({ count }) => (
  <div 
    className="py-2.5 px-4 text-center text-sm font-medium"
    style={{ background: COLORS.primary[500], color: COLORS.neutral.white }}
  >
    Just nu är det {count} användare online
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 💬 CHAT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Chat Bubble
const ChatBubble = ({ message, isOwn, time, status }) => (
  <div className={cn('flex mb-3', isOwn ? 'justify-end' : 'justify-start')}>
    <div className={cn('max-w-[75%]', isOwn && 'order-2')}>
      <div 
        className={cn(
          'px-4 py-3 rounded-2xl',
          isOwn ? 'rounded-br-md' : 'rounded-bl-md'
        )}
        style={{ 
          background: isOwn 
            ? `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`
            : COLORS.neutral.cream,
          color: isOwn ? COLORS.neutral.white : COLORS.neutral.charcoal,
        }}
      >
        <p className="text-sm">{message}</p>
      </div>
      <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
        <span className="text-xs" style={{ color: COLORS.neutral.gray }}>{time}</span>
        {isOwn && status === 'read' && (
          <Check className="w-3 h-3" style={{ color: COLORS.primary[500] }} />
        )}
      </div>
    </div>
  </div>
);

// Chat Input Bar with Quick Actions
const ChatInputBar = ({ onSend }) => {
  const [message, setMessage] = useState('');
  
  return (
    <div 
      className="p-4 border-t"
      style={{ background: COLORS.neutral.white, borderColor: COLORS.sage[100] }}
    >
      {/* Quick actions */}
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {[
          { icon: Image, label: 'Bild' },
          { icon: Mic, label: 'Röst' },
          { icon: Sparkles, label: 'Isbrytare' },
        ].map((action, i) => (
          <button 
            key={i}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all hover:scale-105"
            style={{ background: COLORS.sage[100], color: COLORS.primary[600] }}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </button>
        ))}
      </div>
      
      {/* Input */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Skriv ett meddelande..."
          className="flex-1 h-12 px-4 rounded-xl focus:outline-none"
          style={{ background: COLORS.neutral.cream, color: COLORS.neutral.charcoal }}
        />
        <button 
          onClick={() => { onSend?.(message); setMessage(''); }}
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
            message ? 'hover:scale-105 active:scale-95' : 'opacity-50'
          )}
          style={{ 
            background: message 
              ? `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`
              : COLORS.sage[200],
            boxShadow: message ? `0 4px 12px ${COLORS.primary[500]}40` : 'none',
          }}
          disabled={!message}
        >
          <Send className="w-5 h-5" style={{ color: message ? 'white' : COLORS.neutral.gray }} />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎉 MATCH CELEBRATION MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const MatchCelebration = ({ matchName, matchArchetype, matchType = 'likhets', onClose, onChat }) => {
  const arch = COLORS.archetypes[matchArchetype] || COLORS.archetypes.byggare;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
    >
      <div className="text-center max-w-sm">
        {/* Confetti emoji */}
        <div className="mb-6">
          <span className="text-6xl inline-block animate-bounce">🎉</span>
        </div>
        
        {/* Title */}
        <h2 className="text-3xl font-bold text-white mb-2">Ny matchning!</h2>
        <p className="text-white/70 mb-8">Du och {matchName} är en {matchType === 'motsats' ? 'motsats' : 'likhets'}-match</p>
        
        {/* Overlapping avatars */}
        <div className="flex justify-center items-center mb-8">
          <div className="relative z-10">
            <ArchetypeAvatar name="Du" archetype="byggare" size={100} />
          </div>
          <div className="relative -ml-6">
            <ArchetypeAvatar name={matchName} archetype={matchArchetype} size={100} />
          </div>
        </div>
        
        {/* Match type badge (no percentage) */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-medium">
            {matchType === 'motsats' ? 'Era olikheter kompletterar varandra' : 'Ni delar viktiga värderingar'}
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
          >
            Fortsätt
          </button>
          <ButtonCoral icon={MessageCircle} onClick={onChat}>
            Skicka meddelande
          </ButtonCoral>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📹 VIDEO CALL SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

const VideoCallScreen = ({ callerName, onEnd }) => (
  <div 
    className="min-h-screen relative"
    style={{ background: `linear-gradient(180deg, ${COLORS.sage[200]} 0%, ${COLORS.coral[100]} 100%)` }}
  >
    {/* Header */}
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
      <div 
        className="flex items-center gap-3 rounded-full pl-1 pr-4 py-1"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
      >
        <Avatar name={callerName} size={40} />
        <div>
          <p className="font-semibold text-sm" style={{ color: COLORS.neutral.dark }}>{callerName}</p>
          <p className="text-xs" style={{ color: COLORS.primary[500] }}>Kemi-Check</p>
        </div>
      </div>
      <button 
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
      >
        <X className="w-5 h-5" style={{ color: COLORS.neutral.slate }} />
      </button>
    </div>
    
    {/* Main video placeholder */}
    <div className="w-full h-full flex items-center justify-center pt-20 pb-32">
      <div className="text-center">
        <div 
          className="w-48 h-64 rounded-3xl mb-4 mx-auto flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.3)' }}
        >
          <User className="w-20 h-20" style={{ color: COLORS.neutral.white }} />
        </div>
        <p style={{ color: COLORS.neutral.slate }}>Ansluter...</p>
      </div>
    </div>
    
    {/* Self video (PiP) */}
    <div 
      className="absolute bottom-32 right-6 w-24 h-32 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center"
      style={{ background: COLORS.coral[100] }}
    >
      <User className="w-12 h-12" style={{ color: COLORS.coral[300] }} />
    </div>
    
    {/* Controls */}
    <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
      {[
        { icon: Video, active: true },
        { icon: Mic, active: true },
        { icon: Volume2, active: true },
      ].map((item, i) => (
        <button 
          key={i}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: 'rgba(255,255,255,0.95)' }}
        >
          <item.icon className="w-5 h-5" style={{ color: COLORS.neutral.charcoal }} />
        </button>
      ))}
      <button 
        onClick={onEnd}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: COLORS.coral[500] }}
      >
        <Phone className="w-6 h-6 text-white rotate-[135deg]" />
      </button>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 📷 PHOTO UPLOAD SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

const PhotoUploadScreen = ({ onNext }) => {
  const [photos, setPhotos] = useState([null, null, null, null, null, null]);
  
  return (
    <div className="min-h-screen p-6" style={{ background: COLORS.neutral.white }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" style={{ color: COLORS.neutral.charcoal }} />
        </button>
      </div>
      
      {/* Progress */}
      <div className="mb-8">
        <ProgressSteps current={4} total={6} />
      </div>
      
      {/* Title */}
      <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.primary[800] }}>
        Lägg till dina bilder
      </h1>
      <p className="mb-8" style={{ color: COLORS.neutral.gray }}>
        Visa vem du är med minst ett foto
      </p>
      
      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {photos.map((photo, i) => (
          <button
            key={i}
            className={cn(
              'aspect-[3/4] rounded-2xl flex flex-col items-center justify-center transition-all',
              'hover:scale-[1.02] active:scale-[0.98]',
              i === 0 && 'col-span-2 row-span-2'
            )}
            style={{ 
              background: photo ? 'transparent' : i === 0 ? COLORS.coral[50] : COLORS.neutral.cream,
              border: `2px dashed ${photo ? 'transparent' : COLORS.sage[300]}`,
            }}
          >
            {photo ? (
              <img src={photo} alt="" className="w-full h-full object-cover rounded-2xl" />
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
                  {i === 0 ? 'Huvudfoto' : 'Lägg till'}
                </span>
              </>
            )}
          </button>
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
      <ButtonPrimary fullWidth size="lg" icon={ChevronRight} iconRight onClick={onNext}>
        Nästa
      </ButtonPrimary>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const LandingPage = ({ onLogin, onSignup }) => (
  <div 
    className="min-h-screen"
    style={{ background: `linear-gradient(180deg, ${COLORS.sage[50]} 0%, ${COLORS.neutral.white} 100%)` }}
  >
    {/* Hero */}
    <div className="relative pt-16 px-6 pb-8">
      {/* Floating card mockup */}
      <div className="relative mx-auto w-64 h-80 mb-8">
        {/* Background cards */}
        <div 
          className="absolute top-6 -left-6 w-44 h-56 rounded-3xl rotate-[-12deg] opacity-60"
          style={{ background: COLORS.coral[100] }}
        />
        <div 
          className="absolute top-8 -right-4 w-44 h-56 rounded-3xl rotate-[8deg] opacity-60"
          style={{ background: COLORS.primary[100] }}
        />
        
        {/* Main card */}
        <div 
          className="relative z-10 rounded-3xl shadow-xl p-4 mx-auto w-52"
          style={{ background: COLORS.neutral.white }}
        >
          <div 
            className="aspect-[3/4] rounded-2xl mb-3 flex items-center justify-center"
            style={{ background: COLORS.sage[100] }}
          >
            <span className="text-5xl">🌿</span>
          </div>
          <h3 className="font-semibold" style={{ color: COLORS.primary[800] }}>Sofia, Debattören</h3>
          <p className="text-xs mb-2" style={{ color: COLORS.neutral.gray }}>
            Smart och nyfiken tänkare...
          </p>
          <div className="flex flex-wrap gap-1">
            <span 
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: COLORS.sage[100], color: COLORS.sage[700] }}
            >
              Musik
            </span>
            <span 
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: COLORS.sage[100], color: COLORS.sage[700] }}
            >
              Fika
            </span>
          </div>
        </div>
        
        {/* Floating elements */}
        <div 
          className="absolute top-0 left-2 w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
          style={{ background: COLORS.primary[100] }}
        >
          <span>💡</span>
        </div>
        <div 
          className="absolute top-16 right-0 w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
          style={{ background: COLORS.primary[100] }}
        >
          <MessageCircle className="w-6 h-6" style={{ color: COLORS.primary[500] }} fill={COLORS.primary[500]} />
        </div>
        <div 
          className="absolute bottom-16 left-0 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg"
          style={{ background: COLORS.primary[500], color: COLORS.neutral.white }}
        >
          Likhets-match
        </div>
      </div>
      
      {/* Dots */}
      <div className="flex justify-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full" style={{ background: COLORS.sage[300] }} />
        <div className="w-6 h-2 rounded-full" style={{ background: COLORS.primary[500] }} />
        <div className="w-2 h-2 rounded-full" style={{ background: COLORS.sage[300] }} />
      </div>
    </div>
    
    {/* Title */}
    <div className="text-center px-6 mb-8">
      <h1 
        className="text-3xl font-bold mb-3"
        style={{ 
          fontFamily: FONTS.serif,
          color: COLORS.primary[800],
        }}
      >
        Hitta kärlek som<br />
        <span 
          style={{ 
            background: `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          matchar din själ
        </span>
      </h1>
      <p style={{ color: COLORS.neutral.slate }}>
        Glöm ytliga swipes. MÄÄK matchar dig baserat på personlighet.
      </p>
    </div>
    
    {/* Features */}
    <div className="flex justify-center gap-6 px-6 mb-10">
      {[
        { icon: Brain, label: 'Personlighets-', sub: 'matchning' },
        { icon: Shield, label: 'Säker &', sub: 'verifierad' },
        { icon: Heart, label: 'Meningsfulla', sub: 'kopplingar' },
      ].map((f, i) => (
        <div key={i} className="text-center">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
            style={{ background: COLORS.primary[100] }}
          >
            <f.icon className="w-6 h-6" style={{ color: COLORS.primary[600] }} />
          </div>
          <p className="text-xs font-medium" style={{ color: COLORS.primary[800] }}>{f.label}</p>
          <p className="text-xs" style={{ color: COLORS.neutral.gray }}>{f.sub}</p>
        </div>
      ))}
    </div>
    
    {/* Buttons */}
    <div className="px-6 space-y-3 mb-6">
      <ButtonPrimary fullWidth size="lg" onClick={onLogin}>
        Kom igång gratis
      </ButtonPrimary>
      <ButtonSecondary fullWidth size="lg" onClick={onSignup}>
        Jag har redan ett konto
      </ButtonSecondary>
    </div>
    
    {/* Terms */}
    <p className="text-center text-xs px-6 pb-8" style={{ color: COLORS.neutral.gray }}>
      Genom att fortsätta godkänner du våra{' '}
      <span style={{ color: COLORS.primary[600] }}>Användarvillkor</span> och{' '}
      <span style={{ color: COLORS.primary[600] }}>Integritetspolicy</span>
    </p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 👤 PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const ProfilePage = ({ profile }) => {
  const arch = COLORS.archetypes[profile?.archetype] || COLORS.archetypes.byggare;
  
  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.neutral.dark }}>
      {/* Header */}
      <div className="relative h-72">
        {/* Photo */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${COLORS.sage[300]} 0%, ${COLORS.sage[200]} 100%)` }}
        >
          <span className="text-7xl">{arch.emoji}</span>
        </div>
        
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{ background: `linear-gradient(to top, ${COLORS.neutral.dark} 0%, transparent 60%)` }}
        />
        
        {/* Top actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <ButtonIcon icon={Settings} variant="glass" size="sm" />
          <ButtonIcon icon={Edit2} variant="glass" size="sm" />
        </div>
        
        {/* Photo indicator */}
        <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5">
          {[0,1,2].map(i => (
            <div 
              key={i}
              className="h-1 rounded-full"
              style={{ 
                width: i === 0 ? 24 : 8,
                background: i === 0 ? COLORS.neutral.white : 'rgba(255,255,255,0.4)'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 -mt-12 relative z-10">
        {/* Name & badges */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-white">{profile?.name || 'Ditt namn'}, 28</h1>
              <Shield className="w-5 h-5" style={{ color: COLORS.primary[400] }} />
            </div>
            <ArchetypeBadge archetype={profile?.archetype || 'byggare'} />
          </div>
        </div>
        
        {/* Stats */}
        <div 
          className="grid grid-cols-3 gap-4 p-4 rounded-2xl mb-6"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          {[
            { value: '12', label: 'Matchningar' },
            { value: 'Hög', label: 'Svarsfrekvens' },
            { value: '3', label: 'Chattar' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs" style={{ color: COLORS.neutral.gray }}>{stat.label}</p>
            </div>
          ))}
        </div>
        
        {/* Bio */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-2">Om mig</h3>
          <p style={{ color: COLORS.neutral.gray }}>
            {profile?.bio || 'Lägg till en beskrivning om dig själv...'}
          </p>
        </div>
        
        {/* Interests */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Intressen</h3>
          <div className="flex flex-wrap gap-2">
            {(profile?.interests || ['Musik', 'Fika', 'Resor']).map((interest, i) => (
              <span 
                key={i}
                className="px-3 py-1.5 rounded-full text-sm"
                style={{ 
                  background: 'rgba(255,255,255,0.1)',
                  color: COLORS.neutral.white,
                }}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
        
        {/* Info items */}
        <div className="space-y-3">
          {[
            { icon: MapPin, label: 'Stockholm' },
            { icon: Briefcase, label: 'Designer' },
            { icon: GraduationCap, label: 'KTH' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <item.icon className="w-5 h-5" style={{ color: COLORS.neutral.gray }} />
              <span style={{ color: COLORS.neutral.white }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Lägg till Briefcase och GraduationCap i importen ovan
const Briefcase = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const GraduationCap = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 💬 CHAT WINDOW
// ═══════════════════════════════════════════════════════════════════════════════

const ChatWindow = ({ match }) => {
  const messages = [
    { id: 1, message: 'Hej! Kul att vi matchade 😊', isOwn: false, time: '14:23' },
    { id: 2, message: 'Hej! Ja verkligen, såg att vi båda är intresserade av filosofi!', isOwn: true, time: '14:25', status: 'read' },
    { id: 3, message: 'Ja! Vad är din favorit-filosof?', isOwn: false, time: '14:28' },
    { id: 4, message: 'Svårt val... kanske Simone de Beauvoir. Du då?', isOwn: true, time: '14:30', status: 'read' },
  ];
  
  return (
    <div className="min-h-screen flex flex-col" style={{ background: COLORS.neutral.offWhite }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b"
        style={{ background: COLORS.neutral.white, borderColor: COLORS.sage[100] }}
      >
        <button className="p-1">
          <ChevronLeft className="w-6 h-6" style={{ color: COLORS.neutral.charcoal }} />
        </button>
        <ArchetypeAvatar name={match?.name || 'Sofia'} archetype="debattoren" size={44} />
        <div className="flex-1">
          <h3 className="font-semibold" style={{ color: COLORS.primary[800] }}>{match?.name || 'Sofia'}</h3>
          <p className="text-xs" style={{ color: COLORS.primary[500] }}>Online nu</p>
        </div>
        <ButtonIcon icon={Video} variant="ghost" size="sm" />
        <ButtonIcon icon={MoreHorizontal} variant="ghost" size="sm" />
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Date divider */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px" style={{ background: COLORS.sage[200] }} />
          <span className="text-xs" style={{ color: COLORS.neutral.gray }}>Idag</span>
          <div className="flex-1 h-px" style={{ background: COLORS.sage[200] }} />
        </div>
        
        {messages.map(msg => (
          <ChatBubble key={msg.id} {...msg} />
        ))}
      </div>
      
      {/* Input */}
      <ChatInputBar onSend={(msg) => console.log('Send:', msg)} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 DEMO PAGES (UPPDATERADE)
// ═══════════════════════════════════════════════════════════════════════════════

// Chat Page Demo
const ChatPageDemo = () => {
  const avatars = [
    { name: 'Sofia', hasRing: true },
    { name: 'Erik', hasRing: true },
    { name: 'Anna', hasRing: true },
    { name: 'Johan', hasRing: false },
    { name: 'Lisa', hasRing: false },
  ];
  
  const chats = [
    { match: { name: 'Sofia' }, message: 'Hej! Kul att vi matchade 😊', time: '12:30', status: 'start', unread: true },
    { match: { name: 'Erik' }, message: 'Vad gör du i helgen?', time: '08:00', status: 'turn', unread: false },
    { match: { name: 'Anna' }, message: '✓✓ Tack för igår!', time: '1d ago', status: null, unread: false },
  ];
  
  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-2" style={{ background: COLORS.neutral.white }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: COLORS.primary[800] }}>Chatt</h1>
          <div className="flex gap-2">
            <ButtonIcon icon={Filter} variant="ghost" size="sm" />
            <ButtonIcon icon={Search} variant="ghost" size="sm" />
          </div>
        </div>
        
        {/* Avatar row */}
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
          {avatars.map((a, i) => (
            <AvatarWithRing key={i} name={a.name} hasRing={a.hasRing} size={52} />
          ))}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b mb-2" style={{ borderColor: COLORS.sage[100] }}>
        <button 
          className="flex-1 py-3 text-center font-semibold border-b-2"
          style={{ color: COLORS.primary[800], borderColor: COLORS.primary[500] }}
        >
          Chatt
        </button>
        <button 
          className="flex-1 py-3 text-center font-medium"
          style={{ color: COLORS.neutral.gray }}
        >
          Samling grupp
        </button>
      </div>
      
      {/* Chat list */}
      <div className="px-2">
        {chats.map((chat, i) => (
          <ChatListItem key={i} {...chat} onClick={() => {}} />
        ))}
      </div>
    </div>
  );
};

// Match Page Demo - Mio/Hyperactive inspired
const MatchPageDemo = () => {
  const [cardStyle, setCardStyle] = useState('classic'); // 'classic' or 'mio'
  
  const profile = {
    name: 'Sofia',
    age: 26,
    archetype: 'debattoren',
    bio: 'Smart och nyfiken tänkare som inte kan motstå en intellektuell utmaning.',
    traits: ['Kvicktänkt', 'Kreativ', 'Karismatisk'],
    quote: 'Älskar nya idéer och en bra debatt över fika.',
    interests: [
      { icon: Camera, label: 'Fotografi' },
      { icon: Plane, label: 'Resor' },
      { icon: Music, label: 'Musik' },
    ],
  };
  
  return (
    <div 
      className="min-h-screen pb-24"
      style={{ background: COLORS.neutral.offWhite }}
    >
      {/* Style toggle */}
      <div className="p-4 pb-0">
        <div 
          className="flex rounded-full p-1 mb-4"
          style={{ background: COLORS.neutral.cream }}
        >
          <button
            onClick={() => setCardStyle('classic')}
            className="flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all"
            style={{ 
              background: cardStyle === 'classic' ? COLORS.neutral.white : 'transparent',
              color: cardStyle === 'classic' ? COLORS.primary[700] : COLORS.neutral.gray,
              boxShadow: cardStyle === 'classic' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            🃏 Klassisk MÄÄK
          </button>
          <button
            onClick={() => setCardStyle('mio')}
            className="flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all"
            style={{ 
              background: cardStyle === 'mio' ? COLORS.neutral.white : 'transparent',
              color: cardStyle === 'mio' ? COLORS.primary[700] : COLORS.neutral.gray,
              boxShadow: cardStyle === 'mio' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            ✨ Mio-stil
          </button>
        </div>
      </div>
      
      <div className="px-4">
        {cardStyle === 'classic' ? (
          <MatchCardClassic 
            profile={profile}
            onPass={() => console.log('pass')}
            onChat={() => console.log('chat')}
            onViewProfile={() => console.log('view')}
          />
        ) : (
          <MatchProfileCard 
            profile={profile}
            onPass={() => console.log('pass')}
            onChat={() => console.log('chat')}
            onViewProfile={() => console.log('view')}
          />
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 MAIN SHOWCASE
// ═══════════════════════════════════════════════════════════════════════════════

const INTERESTS = [
  { icon: Music, label: 'Musik' },
  { icon: Coffee, label: 'Fika' },
  { icon: Plane, label: 'Resor' },
  { icon: BookOpen, label: 'Böcker' },
  { icon: Film, label: 'Film' },
  { icon: Dumbbell, label: 'Träning' },
];

export default function MaakUnifiedDesignSystem() {
  const [activeView, setActiveView] = useState('overview');
  const [activeNav, setActiveNav] = useState('home');
  const [selectedInterests, setSelectedInterests] = useState(['Musik', 'Fika']);
  const [showMatch, setShowMatch] = useState(false);
  
  const toggleInterest = (label) => {
    setSelectedInterests(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };
  
  // Full screen views (no header)
  if (activeView === 'landing') {
    return (
      <div className="max-w-lg mx-auto">
        <button 
          onClick={() => setActiveView('overview')}
          className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ background: COLORS.neutral.white, color: COLORS.primary[700], boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
        >
          ← Tillbaka
        </button>
        <LandingPage onLogin={() => setActiveView('overview')} onSignup={() => setActiveView('overview')} />
      </div>
    );
  }
  
  if (activeView === 'video') {
    return (
      <div className="max-w-lg mx-auto">
        <VideoCallScreen callerName="Sofia" onEnd={() => setActiveView('overview')} />
      </div>
    );
  }
  
  if (activeView === 'photo') {
    return (
      <div className="max-w-lg mx-auto">
        <PhotoUploadScreen onNext={() => setActiveView('overview')} />
      </div>
    );
  }
  
  if (activeView === 'profile') {
    return (
      <div className="max-w-lg mx-auto">
        <button 
          onClick={() => setActiveView('overview')}
          className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <ProfilePage profile={{ name: 'Johan', archetype: 'byggare', bio: 'Designer och kaffenörd som älskar långa promenader.' }} />
        <BottomNav active="profile" onChange={(id) => { setActiveNav(id); setActiveView(id === 'profile' ? 'profile' : 'overview'); }} />
      </div>
    );
  }
  
  if (activeView === 'chatwindow') {
    return (
      <div className="max-w-lg mx-auto">
        <ChatWindow match={{ name: 'Sofia' }} />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen" style={{ background: COLORS.neutral.offWhite }}>
      {/* Match Celebration Modal */}
      {showMatch && (
        <MatchCelebration 
          matchName="Sofia"
          matchArchetype="debattoren"
          onClose={() => setShowMatch(false)}
          onChat={() => { setShowMatch(false); setActiveView('chatwindow'); }}
        />
      )}
      
      {/* Header */}
      <div 
        className="sticky top-0 z-30 border-b"
        style={{ background: COLORS.neutral.white, borderColor: COLORS.sage[100] }}
      >
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary[500]}, ${COLORS.primary[400]})` }}
            >
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: COLORS.primary[800] }}>
                MÄÄK Design System
              </h1>
              <p className="text-xs" style={{ color: COLORS.neutral.gray }}>
                Unified • Eucalyptus + Coral
              </p>
            </div>
          </div>
          
          {/* Tabs - scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {[
              { id: 'overview', label: '🎨 Översikt' },
              { id: 'mascot', label: '🐉 Mascot' },
              { id: 'components', label: '🧱 Komponenter' },
              { id: 'chat', label: '💬 Chatt' },
              { id: 'match', label: '❤️ Matchning' },
              { id: 'matchlist', label: '📋 Matchlista' },
              { id: 'matchcard', label: '🃏 Matchkort' },
              { id: 'profilemaak', label: '👤 Profil MÄÄK' },
              { id: 'landing', label: '🏠 Landing' },
              { id: 'photo', label: '📷 Foton' },
              { id: 'video', label: '📹 Video' },
              { id: 'chatwindow', label: '💭 Chattfönster' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                style={{ 
                  background: activeView === tab.id ? COLORS.primary[500] : COLORS.sage[100],
                  color: activeView === tab.id ? COLORS.neutral.white : COLORS.primary[700],
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-lg mx-auto">
        {/* OVERVIEW */}
        {activeView === 'overview' && (
          <div className="px-4 py-6 space-y-6 pb-24">
            {/* Color Palette */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>
                🎨 Färgpalett
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs mb-2 flex items-center justify-between" style={{ color: COLORS.neutral.slate }}>
                    <span>Primary (Forest Green)</span>
                    <code className="text-xs" style={{ color: COLORS.primary[500] }}>{COLORS.primary[500]}</code>
                  </p>
                  <div className="flex rounded-xl overflow-hidden">
                    {[100, 200, 300, 400, 500, 600, 700, 800].map(s => (
                      <div key={s} className="flex-1 h-10" style={{ background: COLORS.primary[s] }} />
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs mb-2 flex items-center justify-between" style={{ color: COLORS.neutral.slate }}>
                    <span>Coral (Accent)</span>
                    <code className="text-xs" style={{ color: COLORS.coral[500] }}>{COLORS.coral[500]}</code>
                  </p>
                  <div className="flex rounded-xl overflow-hidden">
                    {[100, 200, 300, 400, 500, 600, 700, 800].map(s => (
                      <div key={s} className="flex-1 h-10" style={{ background: COLORS.coral[s] }} />
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs mb-2 flex items-center justify-between" style={{ color: COLORS.neutral.slate }}>
                    <span>Sage (Secondary)</span>
                    <code className="text-xs" style={{ color: COLORS.sage[500] }}>{COLORS.sage[500]}</code>
                  </p>
                  <div className="flex rounded-xl overflow-hidden">
                    {[100, 200, 300, 400, 500, 600, 700, 800].map(s => (
                      <div key={s} className="flex-1 h-10" style={{ background: COLORS.sage[s] }} />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Archetypes */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>
                🧬 Personlighetstyper
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(COLORS.archetypes).map(([key, arch]) => (
                  <div 
                    key={key}
                    className="p-3 rounded-xl flex items-center gap-3"
                    style={{ background: arch.light }}
                  >
                    <span className="text-2xl">{arch.emoji}</span>
                    <div>
                      <p className="font-medium text-sm" style={{ color: arch.main }}>{arch.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Key principles */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>
                📐 Design-principer
              </h3>
              <div className="space-y-3">
                {[
                  { icon: '🌿', title: 'Eucalyptus Grove', desc: 'Forest Green som bas - lugn, trygg, trovärdig' },
                  { icon: '🧡', title: 'Coral Accent', desc: 'Emotionell värme för "Start Chat", chattar, notis' },
                  { icon: '🎯', title: 'Passa/Chatta/Se profil', desc: 'Inga swipes - medvetna val' },
                  { icon: '🧬', title: 'Personlighetstyper', desc: '6 arketyper med unika färger och emojis' },
                  { icon: '💫', title: 'Gradient accents', desc: 'Subtila gradienter för CTAs och progress' },
                  { icon: '🔔', title: 'Avatar-ringar', desc: 'Coral ring för olästa meddelanden' },
                ].map((p, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xl">{p.icon}</span>
                    <div>
                      <p className="font-medium text-sm" style={{ color: COLORS.primary[700] }}>{p.title}</p>
                      <p className="text-xs" style={{ color: COLORS.neutral.gray }}>{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>
                ⚡ Snabbtest
              </h3>
              <div className="space-y-3">
                <ButtonCoral fullWidth icon={Sparkles} onClick={() => setShowMatch(true)}>
                  Visa Match-celebration
                </ButtonCoral>
                <ButtonPrimary fullWidth icon={Eye} onClick={() => setActiveView('landing')}>
                  Se Landing Page
                </ButtonPrimary>
              </div>
            </Card>
            
            {/* CSS Export */}
            <div 
              className="p-5 rounded-2xl"
              style={{ background: COLORS.neutral.dark }}
            >
              <h3 className="font-semibold text-white mb-3">📋 CSS Variables</h3>
              <pre className="text-xs overflow-x-auto" style={{ color: COLORS.primary[300] }}>
{`:root {
  /* Primary - Forest Green */
  --color-primary: ${COLORS.primary[500]};
  --color-primary-light: ${COLORS.primary[100]};
  --color-primary-dark: ${COLORS.primary[800]};
  
  /* Coral - Accent */
  --color-coral: ${COLORS.coral[500]};
  --color-coral-light: ${COLORS.coral[100]};
  
  /* Sage - Secondary */
  --color-sage: ${COLORS.sage[500]};
  --color-sage-light: ${COLORS.sage[100]};
  
  /* Neutrals */
  --color-bg: ${COLORS.neutral.offWhite};
  --color-surface: ${COLORS.neutral.white};
  --color-text: ${COLORS.neutral.charcoal};
  --color-text-muted: ${COLORS.neutral.gray};
}`}
              </pre>
            </div>
          </div>
        )}
        
        {/* MASCOT */}
        {activeView === 'mascot' && (
          <div className="px-4 py-6 space-y-6 pb-24">
            {/* Mascot intro */}
            <Card>
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.primary[800] }}>
                  🐉 Möt Määk
                </h2>
                <p className="italic text-sm" style={{ color: COLORS.neutral.slate }}>
                  "En lugn vän som hjälper, inte en robot."
                </p>
              </div>
              
              <div 
                className="p-4 rounded-xl text-center"
                style={{ background: COLORS.sage[50] }}
              >
                <p className="text-sm" style={{ color: COLORS.neutral.slate }}>
                  Jag heter Määk. Jag finns här med dig – medan vi hittar någon som verkligen passar.
                </p>
              </div>
            </Card>
            
            {/* AI Assistant Personality Mode */}
            <Card>
              <h3 className="font-semibold mb-2" style={{ color: COLORS.primary[800] }}>
                🤖 AI Assistant Personality Mode
              </h3>
              <p className="text-xs mb-4 italic" style={{ color: COLORS.neutral.slate }}>
                "En lugn vän som hjälper, inte en robot."
              </p>
              <img 
                src="/mnt/user-data/uploads/ChatGPT_Image_Feb_15__2026__06_01_37_PM.png" 
                alt="AI Assistant - Listening, Thinking, Answering, Celebrating"
                className="w-full rounded-xl"
              />
              <div className="grid grid-cols-4 gap-2 mt-4">
                {['Listening', 'Thinking', 'Answering', 'Celebrating'].map(mode => (
                  <div key={mode} className="text-center">
                    <p className="text-xs font-medium" style={{ color: COLORS.primary[700] }}>{mode}</p>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Style System */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>
                🎨 Style System
              </h3>
              <img 
                src="/mnt/user-data/uploads/ChatGPT_Image_Feb_15__2026__06_01_44_PM.png" 
                alt="Style System - Line illustration, Soft 3D/plush, Micro mono"
                className="w-full rounded-xl"
              />
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-2 rounded-lg" style={{ background: COLORS.sage[50] }}>
                  <p className="font-medium text-sm" style={{ color: COLORS.primary[700] }}>1. Line illustration</p>
                  <p className="text-xs" style={{ color: COLORS.neutral.gray }}>Primary in-app</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: COLORS.sage[50] }}>
                  <p className="font-medium text-sm" style={{ color: COLORS.primary[700] }}>2. Soft 3D / plush</p>
                  <p className="text-xs" style={{ color: COLORS.neutral.gray }}>Marketing</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: COLORS.sage[50] }}>
                  <p className="font-medium text-sm" style={{ color: COLORS.primary[700] }}>3. Micro mono</p>
                  <p className="text-xs" style={{ color: COLORS.neutral.gray }}>App icon</p>
                </div>
              </div>
            </Card>
            
            {/* Placement Logic */}
            <Card>
              <h3 className="font-semibold mb-2" style={{ color: COLORS.primary[800] }}>
                📐 Placement Logic
              </h3>
              <p className="text-xs mb-4" style={{ color: COLORS.neutral.slate }}>
                Production map for assets
              </p>
              <div 
                className="rounded-xl overflow-hidden"
                style={{ background: COLORS.neutral.dark }}
              >
                <img 
                  src="/mnt/user-data/uploads/ChatGPT_Image_Feb_15__2026__06_01_51_PM.png" 
                  alt="Placement Logic - Hero, Medium, Icon"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-2 rounded-lg" style={{ background: COLORS.sage[50] }}>
                  <p className="font-bold text-lg" style={{ color: COLORS.primary[700] }}>Hero</p>
                  <p className="text-xs" style={{ color: COLORS.neutral.gray }}>Onboarding, Empty states</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: COLORS.sage[50] }}>
                  <p className="font-bold text-lg" style={{ color: COLORS.primary[700] }}>Medium</p>
                  <p className="text-xs" style={{ color: COLORS.neutral.gray }}>AI assistant</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: COLORS.sage[50] }}>
                  <p className="font-bold text-lg" style={{ color: COLORS.primary[700] }}>Icon</p>
                  <p className="text-xs" style={{ color: COLORS.neutral.gray }}>Ultra simplified</p>
                </div>
              </div>
            </Card>
            
            {/* Usage Rules */}
            <Card>
              <h3 className="font-semibold mb-2" style={{ color: COLORS.primary[800] }}>
                📋 Usage Rules (brand protection)
              </h3>
              <p className="text-sm mb-4" style={{ color: COLORS.neutral.slate }}>
                Mascoten visas <strong>endast</strong> när den:
              </p>
              <img 
                src="/mnt/user-data/uploads/ChatGPT_Image_Feb_15__2026__06_02_18_PM.png" 
                alt="Usage Rules - Teaches, Reassures, Explains, Celebrates gently"
                className="w-full rounded-xl"
              />
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[
                  { label: 'Teaches', desc: 'Lär ut' },
                  { label: 'Reassures', desc: 'Lugnar' },
                  { label: 'Explains', desc: 'Förklarar' },
                  { label: 'Celebrates', desc: 'Firar varsamt' },
                ].map(rule => (
                  <div key={rule.label} className="text-center p-2 rounded-lg" style={{ background: COLORS.sage[50] }}>
                    <p className="font-medium text-xs" style={{ color: COLORS.primary[700] }}>{rule.label}</p>
                    <p className="text-xs" style={{ color: COLORS.neutral.gray }}>{rule.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* App States */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>
                📭 App States
              </h3>
              <div 
                className="rounded-xl overflow-hidden"
                style={{ background: COLORS.neutral.dark }}
              >
                <img 
                  src="/mnt/user-data/uploads/ChatGPT_Image_Feb_15__2026__06_03_11_PM.png" 
                  alt="App States - Empty Matches, Loading, No Chats, First Match"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[
                  { label: 'Empty Matches', token: 'mascot_planting_seed' },
                  { label: 'Loading', token: 'mascot_waiting_tea' },
                  { label: 'No Chats', token: 'mascot_practicing_mirror' },
                  { label: 'First Match', token: 'mascot_lighting_lantern' },
                ].map(state => (
                  <div key={state.label} className="text-center p-2 rounded-lg" style={{ background: COLORS.sage[50] }}>
                    <p className="font-medium text-xs" style={{ color: COLORS.primary[700] }}>{state.label}</p>
                    <p className="text-xs font-mono truncate" style={{ color: COLORS.neutral.gray }}>{state.token}</p>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Base Poses */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>
                🧍 Base Poses
              </h3>
              <div 
                className="rounded-xl overflow-hidden"
                style={{ background: COLORS.neutral.dark }}
              >
                <img 
                  src="/mnt/user-data/uploads/ChatGPT_Image_Feb_15__2026__06_07_09_PM.png" 
                  alt="Base Poses - Front, Sitting, Walking, Social"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {['Front', 'Sitting', 'Walking', 'Social'].map(pose => (
                  <div key={pose} className="text-center p-2 rounded-lg" style={{ background: COLORS.sage[50] }}>
                    <p className="font-medium text-sm" style={{ color: COLORS.primary[700] }}>{pose}</p>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Emotional States */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>
                💝 Emotional States
              </h3>
              <div 
                className="rounded-xl overflow-hidden"
                style={{ background: COLORS.neutral.dark }}
              >
                <img 
                  src="/mnt/user-data/uploads/ChatGPT_Image_Feb_15__2026__06_07_20_PM.png" 
                  alt="Emotional States - Calm, Encouraging, Waiting, Social, Offline"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: 'Calm', desc: 'Lugn, avslappnad' },
                  { label: 'Encouraging', desc: 'Uppmuntrande' },
                  { label: 'Waiting', desc: 'Väntar tålmodigt' },
                  { label: 'Social', desc: 'Vänlig, öppen' },
                  { label: 'Offline', desc: 'Vilar, sovande' },
                ].map(emotion => (
                  <div key={emotion.label} className="text-center p-2 rounded-lg" style={{ background: COLORS.sage[50] }}>
                    <p className="font-medium text-xs" style={{ color: COLORS.primary[700] }}>{emotion.label}</p>
                    <p className="text-xs" style={{ color: COLORS.neutral.gray }}>{emotion.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Empty States Dark */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>
                🌙 Empty States (Dark)
              </h3>
              <div 
                className="rounded-xl overflow-hidden"
                style={{ background: COLORS.neutral.dark }}
              >
                <img 
                  src="/mnt/user-data/uploads/ChatGPT_Image_Feb_15__2026__06_03_04_PM.png" 
                  alt="Empty States Dark - Empty Matches, No Chats, First Match"
                  className="w-full"
                />
              </div>
            </Card>
            
            {/* Usage Rules Dark */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>
                🌙 Usage Rules (Dark)
              </h3>
              <div 
                className="rounded-xl overflow-hidden"
                style={{ background: COLORS.neutral.dark }}
              >
                <img 
                  src="/mnt/user-data/uploads/ChatGPT_Image_Feb_15__2026__06_02_01_PM.png" 
                  alt="Usage Rules Dark"
                  className="w-full"
                />
              </div>
            </Card>
            
            {/* Token map */}
            <div 
              className="p-5 rounded-2xl"
              style={{ background: COLORS.neutral.dark }}
            >
              <h3 className="font-semibold text-white mb-3">🔑 Token Map (API)</h3>
              <pre className="text-xs overflow-x-auto" style={{ color: COLORS.primary[300] }}>
{`const MASCOT_TOKENS = {
  // App states
  home_idle: "mascot_calm_idle",
  loading: "mascot_waiting_tea",
  empty_matches: "mascot_planting_seed",
  no_chats: "mascot_practicing_mirror",
  first_match: "mascot_lighting_lantern",
  
  // AI Assistant
  ai_listening: "mascot_ai_listening",
  ai_thinking: "mascot_ai_thinking",
  ai_answering: "mascot_ai_open_hand",
  ai_celebrating: "mascot_ai_tiny_sparkle",
  
  // Usage rules
  teaching: "mascot_teaching_book",
  reassuring: "mascot_holding_warm_light",
  explaining: "mascot_presenting_ui_card",
  waiting: "mascot_waiting_tea",
  celebrating_gently: "mascot_lighting_lantern",
  
  // Base poses
  front: "mascot_front",
  sitting: "mascot_sitting",
  walking: "mascot_walking",
  social: "mascot_social",
  
  // Emotional
  calm: "mascot_calm",
  encouraging: "mascot_encouraging",
  offline: "mascot_offline"
}`}
              </pre>
            </div>
            
            {/* Copy texts */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>
                💬 Intro Copy
              </h3>
              <div className="space-y-3">
                {[
                  { context: 'Landing', text: 'Jag heter Määk. Jag finns här med dig – medan vi hittar någon som verkligen passar.' },
                  { context: 'Onboarding', text: 'Jag guidar dig lugnt genom det här.' },
                  { context: 'Waiting', text: 'Jag är här medan vi väntar. Bra saker får ta tid.' },
                  { context: 'First match', text: 'Jag sa ju att det var värt att vänta. 💛' },
                ].map(copy => (
                  <div 
                    key={copy.context}
                    className="p-3 rounded-xl"
                    style={{ background: COLORS.sage[50] }}
                  >
                    <p className="font-medium text-xs mb-1" style={{ color: COLORS.primary[600] }}>
                      {copy.context}
                    </p>
                    <p className="text-sm italic" style={{ color: COLORS.neutral.charcoal }}>
                      "{copy.text}"
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
        
        {/* COMPONENTS */}
        {activeView === 'components' && (
          <div className="px-4 py-6 space-y-6 pb-24">
            {/* Avatars */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>👤 Avatars</h3>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="text-center">
                  <Avatar name="Sofia" size={48} />
                  <p className="text-xs mt-1" style={{ color: COLORS.neutral.gray }}>Standard</p>
                </div>
                <div className="text-center">
                  <Avatar name="Erik" size={48} online />
                  <p className="text-xs mt-1" style={{ color: COLORS.neutral.gray }}>Online</p>
                </div>
                <div className="text-center">
                  <Avatar name="Anna" size={48} verified />
                  <p className="text-xs mt-1" style={{ color: COLORS.neutral.gray }}>Verifierad</p>
                </div>
                <div className="text-center">
                  <AvatarWithRing name="Lisa" hasRing size={52} showName={false} />
                  <p className="text-xs mt-1" style={{ color: COLORS.neutral.gray }}>Coral ring</p>
                </div>
                <div className="text-center">
                  <ArchetypeAvatar name="Johan" archetype="debattoren" size={56} />
                  <p className="text-xs mt-1" style={{ color: COLORS.neutral.gray }}>Arketyp</p>
                </div>
              </div>
            </Card>
            
            {/* Buttons */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>🔘 Knappar</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs mb-2" style={{ color: COLORS.neutral.slate }}>Primary (Forest Green)</p>
                  <div className="flex flex-wrap gap-3">
                    <ButtonPrimary>Primary</ButtonPrimary>
                    <ButtonPrimary icon={Heart}>Med ikon</ButtonPrimary>
                    <ButtonPrimary size="sm">Liten</ButtonPrimary>
                  </div>
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: COLORS.neutral.slate }}>Coral (Accent)</p>
                  <div className="flex flex-wrap gap-3">
                    <ButtonCoral>Start Chat</ButtonCoral>
                    <ButtonCoral icon={MessageCircle}>Chatta</ButtonCoral>
                  </div>
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: COLORS.neutral.slate }}>Secondary & Ghost</p>
                  <div className="flex flex-wrap gap-3">
                    <ButtonSecondary>Secondary</ButtonSecondary>
                    <ButtonGhost>Ghost</ButtonGhost>
                    <ButtonGhost icon={ChevronRight}>Med ikon</ButtonGhost>
                  </div>
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: COLORS.neutral.slate }}>Icon Buttons</p>
                  <div className="flex gap-3">
                    <ButtonIcon icon={Heart} variant="primary" />
                    <ButtonIcon icon={MessageCircle} variant="coral" />
                    <ButtonIcon icon={X} variant="outline" />
                    <ButtonIcon icon={Star} variant="ghost" />
                    <ButtonIcon icon={Filter} variant="default" />
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Action Buttons */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>🎯 Action Buttons (MÄÄK)</h3>
              <ActionButtons 
                onPass={() => console.log('pass')} 
                onChat={() => setShowMatch(true)} 
                onViewProfile={() => console.log('view')} 
              />
            </Card>
            
            {/* Badges */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>🏷️ Badges</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs mb-2" style={{ color: COLORS.neutral.slate }}>Status</p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge variant="coral">Start Chat</StatusBadge>
                    <StatusBadge variant="coralOutline">Your Turn</StatusBadge>
                    <StatusBadge variant="primary">Online</StatusBadge>
                    <StatusBadge variant="default">2 dagar</StatusBadge>
                  </div>
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: COLORS.neutral.slate }}>Arketyper</p>
                  <div className="flex flex-wrap gap-2">
                    <ArchetypeBadge archetype="debattoren" />
                    <ArchetypeBadge archetype="vardaren" />
                    <ArchetypeBadge archetype="upptackare" />
                  </div>
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: COLORS.neutral.slate }}>Match-typer</p>
                  <div className="flex flex-wrap gap-2">
                    <ArchetypeMatchBadge type="likhets" />
                    <ArchetypeMatchBadge type="motsats" />
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Interest Chips */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>💝 Intressen (selectable)</h3>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(({ icon, label }) => (
                  <InterestChip
                    key={label}
                    icon={icon}
                    label={label}
                    selected={selectedInterests.includes(label)}
                    onClick={() => toggleInterest(label)}
                  />
                ))}
              </div>
            </Card>
            
            {/* Inputs */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>📝 Inputs</h3>
              <div className="space-y-4">
                <Input label="Lösenord" icon={Lock} type="password" placeholder="********" />
                <Input label="Med fel" icon={Lock} type="password" error="Felaktigt lösenord" />
                <InputSearch placeholder="Sök matcher..." />
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: COLORS.primary[800] }}>OTP / Verifiering</p>
                  <InputOTP length={6} onChange={() => {}} />
                </div>
              </div>
            </Card>
            
            {/* Progress */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>📊 Progress Steps</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs mb-2" style={{ color: COLORS.neutral.slate }}>Steg 2 av 6</p>
                  <ProgressSteps current={2} total={6} />
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: COLORS.neutral.slate }}>Steg 5 av 6</p>
                  <ProgressSteps current={5} total={6} />
                </div>
              </div>
            </Card>
            
            {/* Chat Components */}
            <Card>
              <h3 className="font-semibold mb-4" style={{ color: COLORS.primary[800] }}>💬 Chat Bubbles</h3>
              <div className="p-3 rounded-xl" style={{ background: COLORS.neutral.offWhite }}>
                <ChatBubble message="Hej! Kul att vi matchade 😊" isOwn={false} time="14:23" />
                <ChatBubble message="Hej! Ja verkligen!" isOwn={true} time="14:25" status="read" />
              </div>
            </Card>
          </div>
        )}
        
        {/* CHAT DEMO */}
        {activeView === 'chat' && <ChatPageDemo />}
        
        {/* MATCH DEMO - Mio style */}
        {activeView === 'match' && <MatchPageDemo />}
        
        {/* MATCH LIST - Dagens matchningar */}
        {activeView === 'matchlist' && <MatchListPage />}
        
        {/* MATCH CARD - Classic MÄÄK style */}
        {activeView === 'matchcard' && (
          <div className="p-4 pb-24" style={{ background: COLORS.neutral.offWhite }}>
            <MatchCardClassic 
              profile={{
                name: 'Sofia',
                archetype: 'debattoren',
                bio: 'Smart och nyfiken tänkare som inte kan motstå en intellektuell utmaning.',
                traits: ['Kvicktänkt', 'Kreativ', 'Karismatisk'],
                quote: 'Älskar nya idéer och en bra debatt över fika.',
              }}
              onPass={() => {}}
              onChat={() => {}}
              onViewProfile={() => {}}
            />
          </div>
        )}
        
        {/* PROFILE MÄÄK - Dark style */}
        {activeView === 'profilemaak' && (
          <ProfilePageMaak 
            profile={{
              name: 'Samuel Pierre',
              age: 29,
              height: '167 cm',
              instagram: 'samuelsenhet',
              occupation: 'Entrepenör',
              location: 'Spånga, Sverige',
              archetype: 'byggare',
            }}
          />
        )}
      </div>
      
      {/* Bottom Nav */}
      {(activeView === 'overview' || activeView === 'mascot' || activeView === 'components' || activeView === 'chat' || activeView === 'match' || activeView === 'matchlist' || activeView === 'matchcard') && (
        <BottomNav active={activeNav} onChange={setActiveNav} />
      )}
    </div>
  );
}
