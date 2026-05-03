import {
  User, Users, UserCircle2, Calendar, Sparkles, Droplet, Droplets, Sun,
  Wind, Flame, Heart, Moon, Coffee, Cookie, Activity, Pill, Leaf, Shield,
  Smile, Frown, HelpCircle, Check, X, Target, Wallet, Star, Beaker,
  Scissors, Brush, Palette, Hand, AlertCircle, Snowflake, CloudRain,
  Cloud, Zap, ThumbsUp, ThumbsDown, Egg, Baby,
} from "lucide-react";

// Custom inline SVG faces / body for skin concerns
const Face = ({ children, className = "" }: any) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="24" cy="24" rx="14" ry="17" />
    {children}
  </svg>
);

const ICONS: Record<string, JSX.Element> = {
  // Skin concerns - custom faces
  "Acne": <Face><circle cx="18" cy="22" r="1.4" fill="currentColor" /><circle cx="30" cy="20" r="1.4" fill="currentColor" /><circle cx="22" cy="30" r="1.4" fill="currentColor" /><circle cx="28" cy="32" r="1.4" fill="currentColor" /><circle cx="24" cy="17" r="1.2" fill="currentColor" /></Face>,
  "Acne scars": <Face><circle cx="18" cy="22" r="1.2" opacity="0.4" fill="currentColor" /><circle cx="30" cy="22" r="1.2" opacity="0.4" fill="currentColor" /><circle cx="22" cy="30" r="1.2" opacity="0.4" fill="currentColor" /><circle cx="28" cy="30" r="1.2" opacity="0.4" fill="currentColor" /></Face>,
  "Redness": <Face><ellipse cx="18" cy="26" rx="4" ry="2.5" fill="currentColor" opacity="0.35" stroke="none" /><ellipse cx="30" cy="26" rx="4" ry="2.5" fill="currentColor" opacity="0.35" stroke="none" /></Face>,
  "Wrinkles": <Face><path d="M14 18 Q17 17 20 18" /><path d="M28 18 Q31 17 34 18" /><path d="M14 33 Q24 35 34 33" /></Face>,
  "Body acne": (
    <svg viewBox="0 0 48 48" className="" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 38 Q14 22 24 22 Q34 22 40 38" />
      <circle cx="16" cy="30" r="1.4" fill="currentColor" />
      <circle cx="22" cy="27" r="1.4" fill="currentColor" />
      <circle cx="28" cy="29" r="1.4" fill="currentColor" />
      <circle cx="34" cy="32" r="1.4" fill="currentColor" />
    </svg>
  ),
  "Hyperpigmentation": <Face><circle cx="18" cy="22" r="2" fill="currentColor" /><circle cx="30" cy="24" r="2.4" fill="currentColor" /><circle cx="24" cy="32" r="1.8" fill="currentColor" /></Face>,
  "Dark spots": <Face><circle cx="20" cy="22" r="1.8" fill="currentColor" /><circle cx="29" cy="26" r="2" fill="currentColor" /></Face>,
  "Large pores": <Face><circle cx="20" cy="24" r="0.8" fill="currentColor" /><circle cx="24" cy="22" r="0.8" fill="currentColor" /><circle cx="28" cy="24" r="0.8" fill="currentColor" /><circle cx="22" cy="28" r="0.8" fill="currentColor" /><circle cx="26" cy="28" r="0.8" fill="currentColor" /></Face>,
  "Blackheads": <Face><circle cx="22" cy="24" r="1" fill="#000" stroke="none" /><circle cx="26" cy="26" r="1" fill="#000" stroke="none" /><circle cx="24" cy="22" r="1" fill="#000" stroke="none" /></Face>,
  "Whiteheads": <Face><circle cx="22" cy="24" r="1.2" fill="#fff" /><circle cx="26" cy="26" r="1.2" fill="#fff" /></Face>,
  "Dryness": <Face><path d="M16 24 L20 24 M22 28 L26 28 M28 22 L32 22 M18 32 L22 32" /></Face>,
  "Uneven texture": <Face><path d="M16 22 q2 -1 4 0 t4 0 t4 0 t4 0" /><path d="M16 28 q2 1 4 0 t4 0 t4 0 t4 0" /></Face>,
  "Fine lines": <Face><path d="M14 20 Q18 19 22 20" /><path d="M26 20 Q30 19 34 20" /></Face>,
  "Dullness": <Face><circle cx="24" cy="24" r="10" opacity="0.3" /></Face>,
  "Shaving bumps": <Face><circle cx="20" cy="34" r="1" fill="currentColor" /><circle cx="24" cy="35" r="1" fill="currentColor" /><circle cx="28" cy="34" r="1" fill="currentColor" /></Face>,
  "Freckles": <Face><circle cx="20" cy="24" r="0.7" fill="currentColor" /><circle cx="24" cy="22" r="0.7" fill="currentColor" /><circle cx="28" cy="24" r="0.7" fill="currentColor" /><circle cx="22" cy="27" r="0.7" fill="currentColor" /><circle cx="26" cy="27" r="0.7" fill="currentColor" /></Face>,
};

const LUCIDE: Record<string, any> = {
  // Gender
  "Female": User, "Male": User, "Non-binary": Users, "Prefer not to say": HelpCircle,
  // Focus
  "Skin": Smile, "Hair": Scissors, "Nails": Hand,
  // Conditions
  "Eczema": AlertCircle, "Psoriasis": AlertCircle, "Rosacea": Flame, "Seborrheic dermatitis": Droplet,
  "PCOS": Activity, "Alopecia": Wind, "Fungal acne": Leaf, "None": X, "Unsure": HelpCircle,
  // Life
  "Pregnant": Baby, "Breastfeeding": Baby, "Neither": X,
  // Sensitivities / ingredients
  "Fragrance": Wind, "Retinol": Beaker, "Adapalene": Beaker, "Benzoyl peroxide": Beaker,
  "Salicylic acid": Beaker, "Sulfur": Beaker, "Essential oils": Leaf,
  // Skin type
  "Oily": Droplets, "Dry": Sun, "Combination": Droplet, "Sensitive": Heart, "Normal": Smile,
  // Triggers
  "Stress": Zap, "Hormones": Activity, "Dairy": Cookie, "Sugar": Cookie, "Sweating": Droplets,
  "Lack of sleep": Moon, "Makeup": Brush, "Skincare products": Beaker, "Shaving": Scissors,
  "Weather changes": Cloud, "Unknown": HelpCircle,
  // Tried
  "Tretinoin": Beaker, "Niacinamide": Beaker, "Vitamin C": Beaker, "Prescription medication": Pill,
  // Routine level
  "Minimal (1–3 steps)": Star, "Moderate": Star, "Detailed": Star,
  // Hair
  "Straight": Scissors, "Wavy": Scissors, "Curly": Scissors, "Coily": Scissors,
  "Flaky": Snowflake,
  "Hair loss": Wind, "Hair thinning": Wind, "Breakage": Scissors, "Frizz": Wind,
  "Dandruff": Snowflake, "Oily hair": Droplets, "Split ends": Scissors, "Slow growth": Activity,
  "Scalp acne": AlertCircle, "Heat damage": Flame, "Itchy scalp": Hand,
  "Mild": Smile, "Severe": Frown,
  "Dyed": Palette, "Bleached": Palette, "Relaxed": Palette, "Permed": Palette, "Keratin treated": Palette,
  "Hair oils": Droplet, "Growth serums": Beaker, "Anti-dandruff shampoo": Beaker,
  "Scalp treatments": Beaker, "Prescription treatments": Pill,
  // Nails
  "Brittle nails": Hand, "Peeling": Hand, "Weak nails": Hand, "Discoloration": Palette,
  "Ridges": Hand, "Thick nails": Hand, "Nail biting damage": Hand, "Dry cuticles": Hand,
  "Splitting nails": Hand,
  "Yellow": Sun, "White": Snowflake, "Brown": Coffee, "Green": Leaf, "Black": Moon, "Multiple colors": Palette,
  "Gel polish": Brush, "Acrylics": Brush, "Press-ons": Hand, "Regular polish": Brush,
  "Nail glue": Beaker, "Nail hardeners": Shield,
  // Goals
  "Clear acne": Sparkles, "Improve hydration": Droplet, "Reduce redness": Heart,
  "Strengthen hair": Shield, "Improve scalp health": Sparkles, "Reduce hair loss": Shield,
  "Grow healthier nails": Sparkles, "Reduce discoloration": Sparkles, "Build a routine": Calendar,
  "Learn about ingredients": Beaker,
  // Budget
  "Budget-friendly": Wallet, "Mid-range": Wallet, "Premium": Wallet, "No preference": HelpCircle,
  // Preferences
  "Fragrance-free": Wind, "Vegan/cruelty-free": Leaf, "Dermatologist-recommended": Shield,
  "Natural ingredients": Leaf, "Prescription-strength": Pill,
  // Areas
  "Forehead": UserCircle2, "Nose": UserCircle2, "Cheeks": UserCircle2, "Chin/Jawline": UserCircle2,
  "Neck": UserCircle2, "Chest": User, "Back": User, "Shoulders": User, "Everywhere": User,
  "Face": Smile, "Underarms": User, "Legs": User, "Other": HelpCircle,
  "Painful cysts": AlertCircle, "Small bumps": AlertCircle, "Occasional breakouts": Calendar,
};

export const OptionIcon = ({ label, className = "h-6 w-6" }: { label: string; className?: string }) => {
  if (ICONS[label]) {
    return <span className={className + " inline-block text-navy"}>{ICONS[label]}</span>;
  }
  const L = LUCIDE[label] || Sparkles;
  return <L className={className + " text-navy"} strokeWidth={2} />;
};
