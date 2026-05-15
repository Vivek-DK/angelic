  import React, { useState, useRef, useEffect } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import { FaCloudMeatball,FaTimes } from "react-icons/fa";
  import VoiceButton from "./VoiceButton";
  import "./ChatWindow.css";
  import { sendMessage } from '../../api/chatAPI'
  import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer'

  const ChatWindow = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const chatRef = useRef(null);
    const offset = useRef({ x: 0, y: 0 });
    const dragging = useRef(false);
    const bottomRef = useRef();

    useEffect(() => {
      const timeout = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 50); 

      return () => clearTimeout(timeout);
    }, [messages, loading]);

    const handleSend = async (text) => {
      if (!text.trim()) return;

      const userMessage = { text, type: "user" };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const response = await sendMessage(userMessage);

        if (response.type === "text") {
          setMessages((prev) => [
            ...prev,
            { text: response.data, type: "bot" },
          ]);
        }else if (response.type === "error") {
          setMessages((prev) => [
            ...prev,
            { text: `${response.data}`, type: "bot" },
          ]);
        }
      } catch (error) {
        console.error("Error contacting backend:", error.response?.data || error.message);
        setMessages((prev) => [
          ...prev,
          { text: "Failed to get response. Try again later.", type: "bot" },
        ]);
      }
      finally {
        setLoading(false);
      }
    };

    const handleTranscript = (transcript) => {
      handleSend(transcript);
    };

    const onMouseDown = (e) => {
      dragging.current = true;
      const chat = chatRef.current;
      offset.current = {
        x: e.clientX - chat.getBoundingClientRect().left,
        y: e.clientY - chat.getBoundingClientRect().top,
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!dragging.current) return;
      const chat = chatRef.current;
      chat.style.left = `${e.clientX - offset.current.x}px`;
      chat.style.top = `${e.clientY - offset.current.y}px`;
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    return (
      <>
        {!visible && (
          <motion.button
            className="chat-launch-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            onClick={() => setVisible(true)}
          >
            < FaCloudMeatball/> Fashion Adviser
          </motion.button>
        )}

        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.3 }}
              className="chat-wrapper"
              ref={chatRef}
            >
              <div className="chat-box resizable">
                <div className="chat-header" onMouseDown={onMouseDown}>
                  <span>AI Assistant</span>
                  <button className="chat-close" onClick={() => setVisible(false)}>
                    <FaTimes />
                  </button>
                </div>

                <div className="chat-messages" data-lenis-prevent>
                  <p className="chat-heading">Hi, How Can I Help You..!</p>
                  <AnimatePresence>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        className={`chat-bubble ${msg.type === "user" ? "user" : "bot"}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                      >
                        {msg.type === "bot" ? (
                          <MarkdownRenderer content={msg.text} />
                        ) : (
                          msg.text
                        )}

                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {loading && (
                    <motion.div
                      className="chat-bubble bot typing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </motion.div>
                  )}
                  <div ref={bottomRef}></div>
                </div>

                <div className="chat-input-area">
                  <input
                    type="text"
                    placeholder="Type something magical..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                  />
                  <button
                    className="send-button"
                    onClick={() => handleSend(input)}
                    disabled={loading}
                  >
                    send
                  </button>
                  <VoiceButton onTranscript={handleTranscript} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  export default ChatWindow;
