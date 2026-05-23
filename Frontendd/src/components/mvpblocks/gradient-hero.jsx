import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight, Github, Lock, Search } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { Link } from 'react-router-dom';

const PLACEHOLDERS = [
  "Search for events...",
  "Search for communities...",
  "Search for organizers...",
];

export default function GradientHero() {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (

    <div className="bg-background text-foreground relative w-full overflow-hidden transition-colors duration-300">
      {/* Background gradient */}
      <div className="absolute inset-0 z-0">
        <div className="from-primary/20 via-background to-background absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]"></div>
        <div className="bg-primary/5 absolute top-0 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full blur-3xl"></div>

      </div>

      <div className="relative z-10 container mx-auto px-4 pt-36 pb-24 sm:px-6 lg:px-8 lg:pt-48 lg:pb-32">
        <div className="mx-auto max-w-5xl">


          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}

            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-4xl tracking-tight sm:text-6xl lg:text-7xl"
 
          >
            <span className="text-foreground">Run Events </span>
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Smarter</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-muted-foreground mx-auto mt-8 max-w-3xl text-center text-lg sm:text-xl leading-relaxed"
          >
            A modern event management platform designed to help organizations plan, manage, and host impactful events with ease.
            Trusted by GDG Jalandhar, AWS Cloud Clubs, and Coding Ninjas.
          </motion.p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mx-auto mt-8 max-w-2xl relative z-20"
          >
            <form
              className="relative flex items-center w-full h-16 rounded-full border border-border/50 bg-background/80 pl-6 pr-2 shadow-2xl backdrop-blur-xl focus-within:border-indigo-500/50 focus-within:bg-background transition-all hover:border-border"
              onSubmit={(e) => { e.preventDefault(); /* Handle search */ }}
            >
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="relative w-full h-full flex items-center overflow-hidden">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full h-full bg-transparent px-4 text-base text-foreground focus:outline-none relative z-10"
                />
                {!inputValue && (
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={placeholderIndex}
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -15, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-muted-foreground text-base"
                      >
                        {PLACEHOLDERS[placeholderIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                className="h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-indigo-500/25 px-8 font-medium transition-all hover:scale-105 active:scale-95"
              >
                Search
              </Button>
            </form>
          </motion.div>

          {/* Feature Image */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1,
              delay: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative mx-auto mt-20 max-w-5xl"
          >
            <div className="group relative rounded-2xl border border-border/50 bg-background/50 shadow-2xl backdrop-blur-sm transition-all hover:border-border/80">
              <div className="flex h-12 items-center rounded-t-2xl border-b border-border/50 bg-muted/30 px-4">
                <div className="flex space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="mx-auto flex items-center rounded-md bg-background/50 px-4 py-1.5 text-xs text-muted-foreground shadow-sm">
                  <Lock className="mr-1 h-3 w-3" />
                  eventone.com
                </div>
              </div>
              <div className="relative overflow-hidden rounded-b-2xl">
                <img
                  src="https://media.licdn.com/dms/image/v2/D4D22AQGQg2icfwXVIg/feedshare-shrink_800/feedshare-shrink_800/0/1720784648784?e=2147483647&v=beta&t=e0WuYddqklXYs6OZQZ0COm4VKHasJhsL9jpAjF9XgOo"
                  alt="Dashboard Preview"
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/5 to-transparent"></div>
              </div>
            </div>

            {/* Decorative glows around the image */}
            <div className="absolute -left-10 -top-10 -z-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-[100px]"></div>
            <div className="absolute -right-10 -bottom-10 -z-10 h-64 w-64 rounded-full bg-purple-500/20 blur-[100px]"></div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
