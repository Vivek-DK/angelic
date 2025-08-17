import React from 'react';
import './Journey.css';
import { delay, motion } from 'framer-motion';
import img1 from '../../assets/one.png';
import img2 from '../../assets/two.png';
import img3 from '../../assets/three.png';
import img4 from '../../assets/four.png';
import imgdark1 from '../../assets/onedark.png';
import imgdark2 from '../../assets/twodark.png';
import imgdark3 from '../../assets/threedark.png';
import imgdark4 from '../../assets/fourDark.png';

const Journey = ({ theme }) => {
  const steps = [
    {
      title: 'Upload a Selfie',
      description: 'Upload a clear photo in natural lighting',
      img: theme === "light" ? img1 : imgdark1,
    },
    {
      title: 'Skin Analysis',
      description: 'Our AI identifies your unique Skin Tone',
      img: theme === "light" ? img2 : imgdark2,
    },
    {
      title: 'Get Your Palette',
      description: 'Receive your seasonal color type and custom palettes',
      img: theme === "light" ? img3 : imgdark3,
    },
    {
      title: 'Shop Confidently',
      description: 'Use your palette to make perfect color choices',
      img: theme === "light" ? img4 : imgdark4,
    },
  ];

  // Parent container with stagger settings
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // delay between each card
        delayChildren: 0.1,   // small delay before first card
      },
    },
  };

  // Each card's animation
  const cardVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        stiffness: 70,
        damping: 12,
      },
    },
  };

  return (
    <section className="journey-section">
      <h2 className="journey-title">Your Personal Color Journey</h2>

      <motion.div
        className="journey-steps"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
      >
        {steps.map((step, index) => (
          <motion.div
            className="journey-card"
            key={index}
            custom={index}
            variants={cardVariants}
          >
            <div className="circle-number">{index + 1}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            <img src={step.img} alt={step.title} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default Journey;
