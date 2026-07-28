// Turns an AQLA reply into a natural sentence for text-to-speech.
export default function replyToSpeech(message) {
  if (!message) return "";
  if (message.mode === "chat") return message.chat_reply || "";
  return `${message.observed} ${message.explanation} Recommended next action: ${message.next_action}. Confidence: ${message.confidence}.${message.safety_note ? ` Safety note: ${message.safety_note}` : ""}`;
}