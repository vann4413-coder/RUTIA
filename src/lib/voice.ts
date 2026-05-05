import { useState, useRef, useCallback } from 'react';

// Web Speech API types — not yet in TypeScript's DOM lib
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onstart: ((e: Event) => void) | null;
  onend: ((e: Event) => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
}
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}
declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

type VoiceError = 'no-speech' | 'not-allowed' | 'network' | 'unsupported' | 'unknown';

export type UseVoiceInputResult = {
  start: () => void;
  stop: () => void;
  transcript: string;
  clearTranscript: () => void;
  isListening: boolean;
  error: VoiceError | null;
  isSupported: boolean;
};

const RecognitionClass: ISpeechRecognitionConstructor | null =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null)
    : null;

export function useVoiceInput(): UseVoiceInputResult {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<VoiceError | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isSupported = RecognitionClass !== null;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    if (!RecognitionClass) return;
    setError(null);

    if (isListening) {
      stop();
      return;
    }

    const recognition = new RecognitionClass();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        if (result.isFinal) {
          final += result[0]?.transcript ?? '';
        } else {
          interim += result[0]?.transcript ?? '';
        }
      }
      setTranscript(final || interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const code = event.error;
      if (code === 'no-speech') setError('no-speech');
      else if (code === 'not-allowed' || code === 'service-not-allowed') setError('not-allowed');
      else if (code === 'network') setError('network');
      else setError('unknown');
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, stop]);

  const clearTranscript = useCallback(() => setTranscript(''), []);

  return { start, stop, transcript, clearTranscript, isListening, error, isSupported };
}
