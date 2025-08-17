import React from 'react';
import './Features.css';
import { FaRobot, FaPalette, FaCameraRetro, FaTshirt, FaHistory, FaUserTie, FaMagic } from 'react-icons/fa';
import { motion } from 'framer-motion';

const features = [
  { icon: <FaRobot />, title: 'AI Chat Bot', desc: 'Your 24/7 style assistant powered by AI.' },
  { icon: <FaPalette />, title: 'Skin Tone Analysis', desc: 'Analyze your tone and get seasonal recommendations.' },
  { icon: <FaCameraRetro />, title: 'Virtual Try-On', desc: 'Try outfits virtually with a realistic preview.' },
  { icon: <FaUserTie />, title: 'Outfit Recommendations', desc: 'Smart styling based on your tone and preferences.' },
  { icon: <FaMagic />, title: 'Personalized Color Palette', desc: 'Curated shades that flatter you the most.' },
  { icon: <FaHistory />, title: 'History', desc: 'View your past analyses, try-ons, and saved outfits.' },
];

const animations = [
  { x: -30, opacity: 0 },
  { y: -30, opacity: 0 },
  { x: 30, opacity: 0 },
  { y: 30, opacity: 0 },
  { scale: 0.8, opacity: 0 },
  { rotate: -10, opacity: 0 },
  { scale: 1.2, opacity: 0 },
];

const Features = () => {
  return (
    <section className="features-section">
      <h2 className="features-title">Explore Our Features</h2>
      <div className="features-grid">
        {features.map((f, i) => (
          <motion.div
            className="feature-card"
            key={i}
            initial={animations[i % animations.length]}
            whileInView={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Features;