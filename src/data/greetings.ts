export interface Greeting {
  title: string;
  subtitle: string;
}

export const greetings: Greeting[] = [
  {
    title: "Hey there! 👋",
    subtitle: "How can I help you today?",
  },
  {
    title: "Hello! 🌟",
    subtitle: "What can I do for you?",
  },
  {
    title: "Hi! 😊",
    subtitle: "What's on your mind?",
  },
  {
    title: "Hey! 💬",
    subtitle: "How can I assist you today?",
  },
  {
    title: "Welcome! ✨",
    subtitle: "What would you like to explore?",
  },
  {
    title: "Hi there! 🚀",
    subtitle: "Ready to get started?",
  },
  {
    title: "Hello friend! 🙂",
    subtitle: "What brings you here today?",
  },
  {
    title: "Hey! 🌈",
    subtitle: "What can I help with?",
  },
  {
    title: "Howdy! 🤠",
    subtitle: "What brings you here today?",
  },
  {
    title: "Hi! 💡",
    subtitle: "What would you like to know?",
  },
  {
    title: "Good to see you! 👀",
    subtitle: "How may I help?",
  },
  {
    title: "Hey there! 🎯",
    subtitle: "What are you working on?",
  },
  {
    title: "Aloha! 🌺",
    subtitle: "What would you like to accomplish?",
  },
  {
    title: "Hiya! 🌸",
    subtitle: "How can I support you?",
  },
  {
    title: "Hello! 🌸",
    subtitle: "What can I do for you today?",
  },
  {
    title: "Hi! ⚡",
    subtitle: "Let's dive in—what do you need?",
  },
  {
    title: "Hey! 🎨",
    subtitle: "What project can I help with?",
  },
  {
    title: "Welcome! 🌻",
    subtitle: "How can I make your day easier?",
  },
  {
    title: "Hello! 🔮",
    subtitle: "What question can I answer?",
  },
  {
    title: "Hi there! 🌺",
    subtitle: "What would you like to create?",
  },
  {
    title: "Hey! ☀️",
    subtitle: "Ready to tackle something new?",
  },
  {
    title: "Hello! 🎪",
    subtitle: "What adventure should we start?",
  },
  {
    title: "Hi! 🌙",
    subtitle: "What can I help you with?",
  },
];

/**
 * Returns a random greeting from the greetings array
 */
export function getRandomGreeting(): Greeting {
  return greetings[Math.floor(Math.random() * greetings.length)];
}
