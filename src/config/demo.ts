// Demo configuration for presentation mode
export const DEMO_CONFIG = {
  // Enable demo mode (uses mock data)
  ENABLED: true,
  
  // Mock data settings
  MOCK: {
    // Reddit mock data
    REDDIT: {
      POSTS_PER_SUBREDDIT: 5,
      DEFAULT_SUBREDDIT: 'artificial',
      MOCK_DELAY_MS: 1000, // Simulate network delay
    },
    
    // LLM mock responses
    LLM: {
      RESPONSE_DELAY_MS: 1500, // Simulate API delay
    },
    
    // Discord webhook
    DISCORD: {
      SUCCESS_RATE: 1.0, // 100% success rate for demo
    }
  },
  
  // UI Settings
  UI: {
    // Show debug info by default in demo mode
    SHOW_DEBUG_BY_DEFAULT: true,
    
    // Auto-run the workflow after loading
    AUTO_RUN: true,
    
    // Show helpful tooltips
    SHOW_TOOLTIPS: true,
  },
  
  // Default workflow to load in demo mode
  DEFAULT_WORKFLOW: 'ai-agent-demo',
  
  // Help text to show in the UI
  HELP_TEXT: {
    title: 'Demo Mode Active',
    message: 'This is a demonstration of the workflow editor. All data is simulated and no API keys are required.'
  }
};

// Check if demo mode should be enabled
export function isDemoMode() {
  // Enable demo mode if no API keys are set
  const hasOpenAIKey = !!import.meta.env.VITE_OPENAI_API_KEY;
  const hasDiscordWebhook = !!import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  
  // Enable demo mode if either:
  // 1. Demo mode is explicitly enabled in this config, or
  // 2. No API keys are provided
  return DEMO_CONFIG.ENABLED || (!hasOpenAIKey && !hasDiscordWebhook);
}
