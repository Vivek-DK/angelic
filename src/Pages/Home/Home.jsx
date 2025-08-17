import React from 'react';
import './Home.css';
import { motion } from 'framer-motion';
import introImg from '../../assets/intro.png';
import FAQ from '../../Components/FAQ/FAQ';
import Footer from '../../Components/Footer/Footer';
import Journey from '../../Components/Journey/Journey';
import Personalized from '../../Components/Personalized/Personalized';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
  import Lenis from '@studio-freight/lenis';

const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

const Home = ({theme}) => {
  const navigate = useNavigate();

  return (
    <main className="home" data-lenis-root>
      <section className="hero fancy-hero">
        <div className="hero-left">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="gradient-title"
          >
            Find the Shades That Define You
          </motion.h1>
          <p className="hero-subtitle">
            Discover your perfect style-free! Upload a photo, let AI analyze your skin tone, and instantly get outfit and color suggestions that truly suit you. No guesswork-just confidence, harmony, and personalized fashion.
          </p>
          <button className="start-btn" onClick={() => navigate('/analysis')}>Get Started</button>
          <button className="explore-btn" onClick={() => navigate('/features')}>
            Explore More <span className="arrow-icon"><FaArrowRight /></span>
          </button>
        </div>
        <motion.div
          className="hero-right"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <img src={introImg} alt="intro" className="hero-img" />
        </motion.div>
      </section>
      <Journey theme={theme}/>
      <Personalized />
      <FAQ />
      <Footer />
    </main>
  );
};

export default Home;