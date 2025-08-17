import React, { useState } from 'react';
import './FAQ.css';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const data = [
  { q: 'Is Angelic free?', a: 'Yes, Angelic is absolutely free!' },
  { q: 'Does Angelic provide color palette for all skin types?', a: 'Yes, our AI supports all skin tones and undertones to generate accurate palettes.' },
  { q: 'Does my dressing sense improve with this?', a: "Definitely! You'll discover the colors that suit you best and shop more confidently. "},
  { q: 'Is it only limited to dressing color palette?', a: 'No! Angelic also recommends accessories based on your face shape.' },
];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq-wrapper">
      <h2 className="faq-title">FAQ'S - Frequently Asked Questions</h2>
      <div className="faq-container">
        {data.map((item, i) => (
          <div key={i} className={`faq-box ${activeIndex === i ? 'active' : ''}`}>
            <button className="faq-toggle" onClick={() => toggle(i)}>
              <span>{activeIndex === i ? <FaMinus /> : <FaPlus />}</span>
              {item.q}
            </button>
            <AnimatePresence>
              {activeIndex === i && (
                <motion.div
                  className="faq-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p>{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;
