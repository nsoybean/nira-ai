export interface Greeting {
  title: string;
  subtitle: string;
}

export const greetings: Greeting[] = [
  {
    title: "Hey there! 👋",
    subtitle: "What can I help you with?",
  },
  {
    title: "Howdy! 🤠",
    subtitle: "What brings you here?",
  },
  {
    title: "Hi 😊",
    subtitle: "What's on your mind?",
  },
  {
    title: "Welcome back! ✨",
    subtitle: "Ready to dive in?",
  },
  {
    title: "G'day! 🦘",
    subtitle: "What are we building today?",
  },
  {
    title: "Aloha! 🌺",
    subtitle: "Let's make something happen",
  },
  {
    title: "Yo! 🎯",
    subtitle: "What's the plan?",
  },
  {
    title: "Greetings! 🚀",
    subtitle: "Where should we start?",
  },
  {
    title: "What's up? 💬",
    subtitle: "How can I assist?",
  },
  {
    title: "Ready when you are! ⚡",
    subtitle: "What do you need?",
  },
  {
    title: "Let's get to work! 💪",
    subtitle: "What's the task?",
  },
  {
    title: "Good to see you! 👋",
    subtitle: "What are you working on?",
  },
  {
    title: "Hola! 🌮",
    subtitle: "How can I help today?",
  },
  {
    title: "Sup! 🎮",
    subtitle: "What's the mission?",
  },
  {
    title: "Welcome! 🌟",
    subtitle: "What would you like to explore?",
  },
  {
    title: "Heyo! 🎨",
    subtitle: "What are we creating?",
  },
  {
    title: "Ahoy! ⛵",
    subtitle: "What adventure awaits?",
  },
  {
    title: "Howdy partner! 🤝",
    subtitle: "What's the challenge?",
  },
  {
    title: "Ready to roll! 🎲",
    subtitle: "What's first?",
  },
  {
    title: "Let's do this! 🔥",
    subtitle: "What's on the agenda?",
  },
  {
    title: "At your service! 🎩",
    subtitle: "How may I assist?",
  },
  {
    title: "Bonjour! 🥐",
    subtitle: "What can I do for you?",
  },
  {
    title: "What's cooking? 👨‍🍳",
    subtitle: "How can I help?",
  },
  {
    title: "All ears! 👂",
    subtitle: "What do you need?",
  },
  {
    title: "Let's make it happen! 💫",
    subtitle: "What's the goal?",
  },
  {
    title: "Right here! 📍",
    subtitle: "What can I help with?",
  },
  {
    title: "Good timing! ⏰",
    subtitle: "What brings you in?",
  },
  {
    title: "Locked and loaded! 🎯",
    subtitle: "What's the target?",
  },
  {
    title: "Present! 🙋",
    subtitle: "How can I support you?",
  },
  {
    title: "Let's build! 🏗️",
    subtitle: "What's the vision?",
  },
];

/**
 * Returns a random greeting from the greetings array
 */
export function getRandomGreeting(): Greeting {
  return greetings[Math.floor(Math.random() * greetings.length)];
}
