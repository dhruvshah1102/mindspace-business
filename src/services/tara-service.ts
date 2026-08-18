/**
 * Tara — the voice/chat companion. This is a UI-preview stub: no real model,
 * no voice API, no network call. `sendMessage` is the entire surface the UI
 * depends on, so wiring the real agent later is a one-function swap here —
 * nothing in `TaraPage.tsx` needs to change.
 */

const CANNED_REPLIES = [
  "That sounds like it's been sitting heavy with you. Want to tell me more about what's making it hard right now?",
  "Thank you for sharing that with me. It's okay to not be okay — what would help most in this moment?",
  "It sounds like work has been taking a lot out of you lately. Have you had a chance to rest today?",
  "I hear you. That's a real thing to be carrying. Would it help to talk through what's driving it?",
  "You don't have to carry that alone. If it ever feels like too much, booking a private session with a therapist is always here for you.",
];

export async function sendMessage(_text: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 500));
  return CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];
}
