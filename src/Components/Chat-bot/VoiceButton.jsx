import React, { useState, useEffect, useRef } from 'react';
import './VoiceButton.css';
import { FaMicrophone } from 'react-icons/fa';
const VoiceButton = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (event.results[event.results.length - 1].isFinal) {
        onTranscript(transcript.trim());
      }
    };

    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <button className={`voice-button ${isListening ? 'listening' : ''}`} onClick={toggleListening} title="Click to speak">
      <span className="mic-icon"><FaMicrophone /></span>
      {isListening && <span className="pulse" />}
    </button>
  );
};

export default VoiceButton;
