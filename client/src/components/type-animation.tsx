
import { useState, useEffect } from "react";

interface TypeAnimationProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenPhrases?: number;
}

export function TypeAnimation({ 
  phrases, 
  typingSpeed = 60, 
  deletingSpeed = 30, 
  delayBetweenPhrases = 1000 
}: TypeAnimationProps) {
  const [currentText, setCurrentText] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    
    if (isTyping) {
      if (currentText.length < currentPhrase.length) {
        const timeout = setTimeout(() => {
          setCurrentText(currentPhrase.substring(0, currentText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, delayBetweenPhrases);
        return () => clearTimeout(timeout);
      }
    } else {
      if (currentText.length > 0) {
        const timeout = setTimeout(() => {
          setCurrentText(currentText.substring(0, currentText.length - 1));
        }, deletingSpeed);
        return () => clearTimeout(timeout);
      } else {
        setIsTyping(true);
        setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
      }
    }
  }, [currentText, currentPhraseIndex, isTyping, phrases, typingSpeed, deletingSpeed, delayBetweenPhrases]);

  return (
    <span className="text-primary font-medium">{currentText}<span className="animate-pulse">|</span></span>
  );
}
