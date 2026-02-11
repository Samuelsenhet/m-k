/**
 * Centraliserad e-postkonfiguration för MĀĀK.
 * Alla adresser på ett ställe – enkel att uppdatera och typad.
 */
export const EMAIL_CONFIG = {
  // Huvudkonton
  MAIN: {
    admin: "samuelsenhet@maakapp.se",
    primary: "hej@maakapp.se",
  },

  // Support & Teknik
  SUPPORT: {
    technical: "support@maakapp.se",
    safety: "safety@maakapp.se",
    abuse: "report@maakapp.se", // Framtida
  },

  // Juridik & Integritet
  LEGAL: {
    privacy: "dataskydd@maakapp.se",
    legal: "juridik@maakapp.se",
    gdpr: "gdpr@maakapp.se", // Alternativ
  },

  // Affär & Partnerskap
  BUSINESS: {
    partnerships: "affar@maakapp.se",
    sales: "forsaljning@maakapp.se", // Framtida
    press: "press@maakapp.se", // Framtida
  },

  // Interna team (Google Groups)
  TEAMS: {
    all: "alla@maakapp.se",
    safetyTeam: "safety-team@maakapp.se",
    techTeam: "teknik-team@maakapp.se",
    feedbackTeam: "feedback-team@maakapp.se",
    legalTeam: "juridik-team@maakapp.se",
  },

  // Funktioner
  FUNCTIONAL: {
    feedback: "feedback@maakapp.se",
    tech: "teknik@maakapp.se",
    noReply: "noreply@maakapp.se", // Systemmeddelanden
  },
} as const;

// Hjälpfunktioner
export const getContactEmail = (type: keyof typeof EMAIL_CONFIG.MAIN) =>
  EMAIL_CONFIG.MAIN[type];
export const getSupportEmail = () => EMAIL_CONFIG.SUPPORT.technical;
export const getPrivacyEmail = () => EMAIL_CONFIG.LEGAL.privacy;
