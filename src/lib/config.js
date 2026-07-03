const config = {
  appName: "Geo Checker",
  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    webhook_url: process.env.WEBHOOK_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    plans: {
      basic: { id: "basic", name: "Basic Pack", credits: 1000, price: 500 },
      standard: { id: "standard", name: "Standard Pack", credits: 2000, price: 1000 },
      pro: { id: "pro", name: "Professional Pack", credits: 4000, price: 2000 },
      business: { id: "business", name: "Business Pack", credits: 10000, price: 5000 },
    }
  },
  ai: {
    // provider: "muapi" or "openrouter"
    provider: process.env.AI_PROVIDER || "openrouter",
    // OpenRouter: set OPENROUTER_API_KEY and optionally OPENROUTER_API_URL
    apiKey: process.env.OPENROUTER_API_KEY || process.env.MUAPIAPP_API_KEY,
    openrouterUrl: process.env.OPENROUTER_API_URL || "https://api.openrouter.ai",
    generationCost: 18, // Deducted per AI call for GEO Checker (recalibrar conforme provider)
  }
};
export default config;
