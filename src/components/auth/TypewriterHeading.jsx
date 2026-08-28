import React, { useState, useEffect } from "react";

const PHRASES = [
  "Welcome back, **Optimizer**",
  "Calibrating **Brain Map**",
  "Syncing **Cognitive Baseline**",
  "Accessing **Neural Protocols**",
];

/**
 * Parses markdown-like `**bold**` tokens and renders them as bold styled elements.
 */
function renderFormattedText(text) {
  const parts = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <span
        key={match.index}
        className="font-extrabold text-foreground drop-shadow-[0_0_12px_hsl(75_82%_60%/0.25)]"
      >
        {match[1]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export default function TypewriterHeading({ phrases = PHRASES, typingSpeed = 70, deletingSpeed = 40, pauseDuration = 2200 }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPhrase = phrases[phraseIndex] || "";

  useEffect(() => {
    let timer;

    if (!isDeleting && charIndex <= currentPhrase.length) {
      // Typing
      if (charIndex === currentPhrase.length) {
        timer = setTimeout(() => setIsDeleting(true), pauseDuration);
      } else {
        timer = setTimeout(() => setCharIndex((prev) => prev + 1), typingSpeed);
      }
    } else if (isDeleting && charIndex >= 0) {
      // Deleting
      if (charIndex === 0) {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      } else {
        timer = setTimeout(() => setCharIndex((prev) => prev - 1), deletingSpeed);
      }
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex, currentPhrase, typingSpeed, deletingSpeed, pauseDuration, phrases.length]);

  const visibleText = currentPhrase.substring(0, charIndex);

  return (
    <div className="flex items-center justify-center min-h-[44px]">
      <h1 className="text-2xl sm:text-3xl font-display font-medium tracking-tight text-foreground/90 text-center">
        {renderFormattedText(visibleText)}
        <span className="inline-block w-[3px] h-[1.1em] ml-1 bg-primary align-middle animate-[pulse_0.9s_infinite] shadow-[0_0_8px_hsl(75_82%_60%)]" />
      </h1>
    </div>
  );
}
