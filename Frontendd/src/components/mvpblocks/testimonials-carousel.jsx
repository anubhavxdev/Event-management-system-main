"use client";
import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { motion } from "framer-motion";

const defaultTestimonials = [
  {
    text: "Eventone revolutionized how we organize our tech conferences. The ticketing and scheduling features are flawless.",
    imageSrc:
      "https://media.licdn.com/dms/image/v2/D4D03AQEAy6a-_JjNsA/profile-displayphoto-shrink_200_200/B4DZeMFLFjGgAg-/0/1750401857954?e=1767830400&v=beta&t=cbfAn8Dwtw61jTRGdOUqJ3ccUdOvvPTGNmXv-RPe7YE",
    name: "Gurjot Singh",
    username: "@gurjot_singh",
    role: "Event Organizer",
  },
  {
    text: "Finally an event platform that doesn't feel clunky. Eventone is sleek, fast, and our attendees loved the check-in process.",
    imageSrc:
      "https://media.licdn.com/dms/image/v2/D5603AQE87KyOtsDTOA/profile-displayphoto-shrink_200_200/B56ZZJzooaH0Ac-/0/1744994995178?e=1767830400&v=beta&t=ohsn9TVm4Rqjd6wBRC_Fju6dbli7cjHEhnBeHvR_dBk",
    name: "Amanpreet Kaur",
    username: "@amanpreet_kaur",
    role: "Community Manager",
  },
  {
    text: "We managed 500+ attendees with zero hiccups. Eventone's dashboard gave us real-time insights that saved the day.",
    imageSrc:
      "https://media.licdn.com/dms/image/v2/D5603AQEujuCOBChvzg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1726612370449?e=1767830400&v=beta&t=hT8d78EaEsfMy7fcLSqwae7s8eGfrlD7Ai138AWLOh0",
    name: "Simar Preet Singh",
    username: "@simar_preet_singh",
    role: "Conference Director",
  },
  {
    text: "Setting up our annual summit took minutes instead of days. Eventone handles everything from registration to post-event feedback.",
    imageSrc:
      "https://media.licdn.com/dms/image/v2/D4E03AQEVsn2bajk1sw/profile-displayphoto-scale_200_200/B4EZlx7LLZKoAY-/0/1758552962331?e=1767830400&v=beta&t=fN6wqGrwwehwUizroEvwW9TuINV8P9wiHoNXz-SB2KU",
    name: "Tracy (Cui Wang) Wang",
    username: "@tracy_wang",
    role: "Meetup Host",
  },
  {
    text: "The best investment for our community meetups. Eventone makes it incredibly easy to manage RSVPs and communicate with members.",
    imageSrc:
      "https://media.licdn.com/dms/image/v2/D4D03AQFg23agDGqOSQ/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1714443215504?e=1767830400&v=beta&t=1QIXvAm_A-c_pX0QOJx-0B4YZDkZuRfWKnMTLGmuH-g",
    name: "Vedant Gaidhanne",
    username: "@vedant_gaidhanne",
    role: "Event Planner",
  },
  {
    text: "Design is important to us, and Eventone looks beautiful out of the box. It matches our brand perfectly.",
    imageSrc:
      "https://media.licdn.com/dms/image/v2/D5603AQHRc9HyVl41QA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1727866807803?e=1767830400&v=beta&t=2WQrCIKOupXZvVCb5fSPtWHeRCaLrMTF073OhZsCxBk",
    name: "Suraj Mani",
    username: "@suraj_mani",
    role: "Marketing Lead",
  },
];

export default function TestimonialsCarousel({
  testimonials = defaultTestimonials,
  title = "What our users say",
  subtitle = "From intimate meetups to global conferences, Eventone powers the world's most successful events.",
  className,
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Duplicate items to create a seamless infinite loop
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section
      className={cn("relative overflow-hidden py-16 md:py-24", className)}
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.2),transparent_60%)]" />
        <div className="bg-primary/5 absolute top-1/4 left-1/4 h-32 w-32 rounded-full blur-3xl" />
        <div className="bg-primary/10 absolute right-1/4 bottom-1/4 h-40 w-40 rounded-full blur-3xl" />
    <section className={cn("relative py-24 bg-black border-t border-zinc-800 overflow-hidden", className)}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] translate-y-1/2"></div>
        
        {/* Moving dot grid */}
        <motion.div 
          className="absolute inset-0 z-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:32px_32px]"
          animate={{
            backgroundPosition: ["0px 0px", "32px 32px"],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "linear",
          }}
          style={{
            maskImage: "radial-gradient(ellipse at center, black 10%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 10%, transparent 70%)"
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative mb-12 text-center md:mb-16"
        >
          <h1 className="text-foreground mb-4 text-3xl font-bold md:text-5xl lg:text-6xl">
            {title}
          </h1>

          <motion.p
            className="text-muted-foreground mx-auto max-w-2xl text-base md:text-lg"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            {subtitle}
          </p>
        </motion.div>
      </div>

      <div className="relative w-full max-w-[100vw] mx-auto overflow-hidden">
        {/* Left/Right fading masks for a smooth fade-in/out effect */}
        <div className="absolute inset-y-0 left-0 w-1/6 md:w-1/4 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-1/6 md:w-1/4 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>

        <motion.div
          className="flex w-max"
          animate={{ x: isHovered ? undefined : ["0%", "-50%"] }}
          transition={{
            ease: "linear",
            duration: 40,
            repeat: Infinity,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >
          <div className="flex gap-6 lg:gap-8 px-3">
            {duplicatedTestimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${index}`}
                className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-sm transition-all hover:shadow-md hover:border-zinc-700 shrink-0 w-[320px] md:w-[400px]"
              >
                <div className="mb-8">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-zinc-300 text-base leading-relaxed">
                    "{testimonial.text}"
                  </p>
                </div>
                
                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-zinc-800">
                  <Avatar className="h-10 w-10 rounded-full border border-zinc-700">
                    <AvatarImage src={testimonial.imageSrc} alt={testimonial.name} />
                    <AvatarFallback className="bg-zinc-800 text-white">{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {testimonial.name}
                    </h4>
                    <div className="text-sm text-zinc-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
