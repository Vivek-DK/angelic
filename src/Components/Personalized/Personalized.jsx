import React from 'react';
import './Personalized.css';
import img1 from '../../assets/img1.jpg';
import img2 from '../../assets/img2.jpg';
import img4 from '../../assets/img4.jpg';
import img5 from '../../assets/img5.jpg';
import img6 from '../../assets/img6.jpg';
import img7 from '../../assets/img7.jpg';
import { motion, transform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
const Personalized = () => {
  const navigate = useNavigate()
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 5,
      transition: { delay: i * 0.2, duration: 1, ease: 'easeOut' }
    }),
  };
  return (
    <section className="personalized">
      <motion.div
        className="text-content"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2>Personalised Outfits<br />& Styling Ideas</h2>
        <p>
          Not sure how to style it? We've got you. From full fits to trending looks,
          get inspo that matches your vibe.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          
          className="try-button"
          onClick={() => navigate('/analysis')}
        >
          Try It Now
        </motion.button>
      </motion.div>

      <div className="images-container">
        <motion.img 
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          whileHover={{ scale: 1.05 }}
          src={img1} alt="fit1" className="img img1" />
        <motion.img 
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          whileHover={{ scale: 1.05 }}
          src={img2} alt="fit2" className="img img2" />
        <img 
          src={img4} alt="fit4" className="img img4" />
        <motion.img 
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          whileHover={{ scale: 1.05 }}
          src={img5} alt="fit5" className="img img5" />
        <motion.img 
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          whileHover={{ scale: 1.05 }}
          src={img6} alt="fit6" className="img img6" />
        <motion.img 
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          whileHover={{ scale: 1.05 }}
          src={img7} alt="fit7" className="img img7" />

      </div>
    </section>
  );
};

export default Personalized;
