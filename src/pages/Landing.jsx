import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import HeroMap from "@/components/landing/HeroMap";
import LandingSections from "@/components/landing/LandingSections";
import { ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background aqla-glow relative aqla-grain">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div>
          <span className="font-display text-xl tracking-tight text-foreground">AQLA</span>
          <span className="hidden sm:inline ml-3 text-xs text-muted-foreground">Understand your brain. Improve your life.</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">Sign in</Link>
          <Link to="/register" className="text-sm px-4 py-2 rounded-full border border-border hover:border-foreground/30 transition-colors text-foreground">Get started</Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-12 grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-4xl md:text-6xl font-light leading-[1.08] text-foreground">
            Your brain is giving you signals.{" "}
            <span className="text-primary">AQLA helps you understand them.</span>
          </h1>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-lg">
            AQLA analyzes your cognitive performance, lifestyle, sleep, stress, habits, and goals to create a
            personalized brain-health protocol that continuously learns what works for you.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/assessment" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Build My Brain Map <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#science" className="inline-flex items-center px-7 py-3.5 rounded-full border border-border text-foreground hover:border-foreground/30 transition-colors">
              Explore the Science
            </a>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.3 }}>
          <HeroMap />
        </motion.div>
      </section>

      <LandingSections />
    </div>
  );
}