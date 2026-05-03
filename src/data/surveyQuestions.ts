export type Option = { value: string; label: string };
export type Question = {
  id: string;
  type: "text" | "date" | "single" | "multi";
  question: string;
  options?: Option[];
  branch?: "skin" | "hair" | "nails";
  showIf?: (answers: Record<string, any>) => boolean;
};

const opts = (...arr: string[]): Option[] =>
  arr.map((v) => ({ value: v, label: v }));

const has = (a: Record<string, any>, key: string, val: string) =>
  Array.isArray(a[key]) && a[key].includes(val);

export const questions: Question[] = [
  { id: "firstName", type: "text", question: "What is your first name?" },
  { id: "dob", type: "date", question: "What is your date of birth?" },
  {
    id: "gender",
    type: "single",
    question: "What is your gender?",
    options: opts("Female", "Male", "Non-binary", "Prefer not to say"),
  },
  {
    id: "focus",
    type: "multi",
    question: "What are you using Dermo AI for?",
    options: opts("Skin", "Hair", "Nails"),
  },
  {
    id: "conditions",
    type: "multi",
    question: "Do you currently have any diagnosed conditions?",
    options: opts(
      "Eczema", "Psoriasis", "Rosacea", "Seborrheic dermatitis",
      "PCOS", "Alopecia", "Fungal acne", "None", "Unsure"
    ),
  },
  {
    id: "lifeStage",
    type: "single",
    question: "Are you currently:",
    options: opts("Pregnant", "Breastfeeding", "Neither", "Prefer not to say"),
  },
  {
    id: "sensitivities",
    type: "multi",
    question: "Do you have sensitivities to any ingredients?",
    options: opts(
      "Fragrance", "Retinol", "Adapalene", "Benzoyl peroxide",
      "Salicylic acid", "Sulfur", "Essential oils", "None", "Unsure"
    ),
  },

  // SKIN
  {
    id: "skinType", branch: "skin", type: "single",
    question: "How would you describe your skin?",
    options: opts("Oily", "Dry", "Combination", "Sensitive", "Normal", "Unsure"),
    showIf: (a) => has(a, "focus", "Skin"),
  },
  {
    id: "skinConcerns", branch: "skin", type: "multi",
    question: "What are your main skin concerns?",
    options: opts(
      "Acne", "Dark spots", "Acne scars", "Redness", "Large pores",
      "Blackheads", "Whiteheads", "Dryness", "Uneven texture",
      "Fine lines", "Wrinkles", "Dullness", "Body acne",
      "Shaving bumps", "Hyperpigmentation", "Freckles"
    ),
    showIf: (a) => has(a, "focus", "Skin"),
  },
  {
    id: "acneType", branch: "skin", type: "single",
    question: "What type of acne do you experience most?",
    options: opts("Whiteheads", "Blackheads", "Painful cysts", "Small bumps", "Occasional breakouts", "Unsure"),
    showIf: (a) => has(a, "skinConcerns", "Acne"),
  },
  {
    id: "acneAreas", branch: "skin", type: "multi",
    question: "Where do you experience breakouts most?",
    options: opts("Forehead", "Nose", "Cheeks", "Chin/Jawline", "Neck", "Chest", "Back", "Shoulders", "Everywhere"),
    showIf: (a) => has(a, "skinConcerns", "Acne"),
  },
  {
    id: "discolorationAreas", branch: "skin", type: "multi",
    question: "Which areas have discoloration or dark spots?",
    options: opts("Face", "Neck", "Underarms", "Back", "Chest", "Legs", "Other"),
    showIf: (a) => has(a, "skinConcerns", "Dark spots") || has(a, "skinConcerns", "Hyperpigmentation"),
  },
  {
    id: "skinTriggers", branch: "skin", type: "multi",
    question: "What seems to trigger your skin concerns?",
    options: opts("Stress", "Hormones", "Dairy", "Sugar", "Sweating", "Lack of sleep", "Makeup", "Skincare products", "Shaving", "Weather changes", "Unknown"),
    showIf: (a) => has(a, "focus", "Skin"),
  },
  {
    id: "skinTried", branch: "skin", type: "multi",
    question: "What skincare treatments or ingredients have you tried?",
    options: opts("Salicylic acid", "Benzoyl peroxide", "Retinol", "Adapalene", "Tretinoin", "Niacinamide", "Vitamin C", "Prescription medication", "None"),
    showIf: (a) => has(a, "focus", "Skin"),
  },
  {
    id: "routineLevel", branch: "skin", type: "single",
    question: "What level of skincare routine do you prefer?",
    options: opts("Minimal (1–3 steps)", "Moderate", "Detailed"),
    showIf: (a) => has(a, "focus", "Skin"),
  },

  // HAIR
  {
    id: "hairTexture", branch: "hair", type: "single",
    question: "What is your hair texture?",
    options: opts("Straight", "Wavy", "Curly", "Coily", "Unsure"),
    showIf: (a) => has(a, "focus", "Hair"),
  },
  {
    id: "scalp", branch: "hair", type: "single",
    question: "How would you describe your scalp?",
    options: opts("Oily", "Dry", "Flaky", "Sensitive", "Normal"),
    showIf: (a) => has(a, "focus", "Hair"),
  },
  {
    id: "hairConcerns", branch: "hair", type: "multi",
    question: "What are your main hair concerns?",
    options: opts(
      "Hair loss", "Hair thinning", "Breakage", "Frizz", "Dryness",
      "Dandruff", "Oily hair", "Split ends", "Slow growth",
      "Scalp acne", "Heat damage", "Itchy scalp"
    ),
    showIf: (a) => has(a, "focus", "Hair"),
  },
  {
    id: "sheddingSeverity", branch: "hair", type: "single",
    question: "How severe is your hair shedding?",
    options: opts("Mild", "Moderate", "Severe", "Unsure"),
    showIf: (a) => has(a, "hairConcerns", "Hair loss") || has(a, "hairConcerns", "Hair thinning"),
  },
  {
    id: "dandruffSeverity", branch: "hair", type: "single",
    question: "How severe is your dandruff or flaking?",
    options: opts("Mild", "Moderate", "Severe", "Unsure"),
    showIf: (a) => has(a, "hairConcerns", "Dandruff"),
  },
  {
    id: "hairChemical", branch: "hair", type: "multi",
    question: "Have you chemically treated your hair?",
    options: opts("Dyed", "Bleached", "Relaxed", "Permed", "Keratin treated", "None"),
    showIf: (a) => has(a, "focus", "Hair"),
  },
  {
    id: "hairTried", branch: "hair", type: "multi",
    question: "What hair products or treatments have you tried?",
    options: opts("Hair oils", "Growth serums", "Anti-dandruff shampoo", "Scalp treatments", "Prescription treatments", "None"),
    showIf: (a) => has(a, "focus", "Hair"),
  },

  // NAILS
  {
    id: "nailConcerns", branch: "nails", type: "multi",
    question: "What are your main nail concerns?",
    options: opts(
      "Brittle nails", "Peeling", "Weak nails", "Slow growth",
      "Discoloration", "Ridges", "Thick nails", "Nail biting damage",
      "Dry cuticles", "Splitting nails"
    ),
    showIf: (a) => has(a, "focus", "Nails"),
  },
  {
    id: "nailDiscolorColor", branch: "nails", type: "single",
    question: "What color is the discoloration?",
    options: opts("Yellow", "White", "Brown", "Green", "Black", "Multiple colors", "Unsure"),
    showIf: (a) => has(a, "nailConcerns", "Discoloration"),
  },
  {
    id: "nailProducts", branch: "nails", type: "multi",
    question: "Which nail products do you use?",
    options: opts("Gel polish", "Acrylics", "Press-ons", "Regular polish", "Nail glue", "Nail hardeners", "None"),
    showIf: (a) => has(a, "focus", "Nails"),
  },

  // FINAL
  {
    id: "goals", type: "multi",
    question: "What are your main goals?",
    options: opts(
      "Clear acne", "Improve hydration", "Reduce redness", "Strengthen hair",
      "Improve scalp health", "Reduce hair loss", "Grow healthier nails",
      "Reduce discoloration", "Build a routine", "Learn about ingredients"
    ),
  },
  {
    id: "budget", type: "single",
    question: "What product budget do you prefer?",
    options: opts("Budget-friendly", "Mid-range", "Premium", "No preference"),
  },
  {
    id: "preferences", type: "multi",
    question: "What product preferences do you have?",
    options: opts("Fragrance-free", "Vegan/cruelty-free", "Dermatologist-recommended", "Natural ingredients", "Prescription-strength", "No preference"),
  },
];
