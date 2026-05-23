"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";
function FAQItem({ question, answer, index }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.15,
        ease: "easeOut",
      }}
      className={cn(
        "group border-border/60 rounded-lg border",
        "transition-all duration-200 ease-in-out",
        isOpen ? "bg-card/30 shadow-sm" : "hover:bg-card/50",
      )}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4">
        <h3
          className={cn(
            "text-left text-base font-medium transition-colors duration-200",
            "text-foreground/80",
            isOpen && "text-foreground",
          )}>
          {question}
        </h3>
        <motion.div
          animate={{
            rotate: isOpen ? 180 : 0,
            scale: isOpen ? 1.1 : 1,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className={cn(
            "shrink-0 rounded-full p-0.5",
            "transition-colors duration-200",
            isOpen ? "text-primary" : "text-muted-foreground",
          )}>
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: {
                  duration: 0.4,
                  ease: [0.04, 0.62, 0.23, 0.98],
                },
                opacity: {
                  duration: 0.25,
                  delay: 0.1,
                },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: {
                  duration: 0.3,
                  ease: "easeInOut",
                },
                opacity: {
                  duration: 0.25,
                },
              },
            }}>
            <div className="border-border/40 border-t px-6 pt-2 pb-4">
              <motion.p
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut",
                }}
                className="text-muted-foreground text-sm leading-relaxed">
                {answer}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
export default function Faq3() {

  const navigate = useNavigate();
  const faqs = [
    {
  question: "What makes EventOne unique?",
  answer:
    "EventOne is purpose-built for communities and organizations to host events end-to-end. From event creation and registrations to team roles, certificates, and analytics—everything is managed in one fast, simple, and intuitive platform.",
},
{
  question: "Who can use EventOne?",
  answer:
    "EventOne is ideal for student communities, tech clubs, colleges, startups, and organizations. Whether you're hosting meetups, workshops, hackathons, or large-scale events, EventOne adapts to your needs.",
},
{
  question: "What features does EventOne provide?",
  answer:
    "EventOne offers event creation, registrations, automated notifications, team and role management, certificate distribution, user profiles, and a powerful admin dashboard with real-time analytics.",
},
{
  question: "How can I get started with EventOne?",
  answer:
    "Getting started is simple—sign up, create your organization, and launch your first event in minutes. Our intuitive interface ensures you can manage everything without any technical complexity.",
},
{
  question: "Is EventOne free to use?",
  answer:
    "Yes! EventOne offers a free plan suitable for most communities. You can host events, manage participants, and distribute certificates without worrying about hidden costs.",
},

  ];
  return (
    <section className="bg-background relative w-full overflow-hidden py-16">
      {/* Decorative elements */}
      <div className="bg-primary/5 absolute top-20 -left-20 h-64 w-64 rounded-full blur-3xl" />
      <div className="bg-primary/5 absolute -right-20 bottom-20 h-64 w-64 rounded-full blur-3xl" />

      <div className="relative container mx-auto max-w-6xl px-4">
        <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  className="mx-auto mb-16 max-w-3xl text-center">

  <Badge
    variant="outline"
    className={cn(
      "border-primary/30 bg-primary/5 text-primary",
      "mb-5 px-4 py-1.5",
      "rounded-full text-xs font-semibold tracking-[0.2em]",
      "uppercase shadow-sm backdrop-blur-sm"
    )}>
    Frequently Asked Questions
  </Badge>

  <h2
    className={cn(
  "text-4xl md:text-5xl font-extrabold tracking-tight",
  "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
  "bg-clip-text text-transparent",
  "drop-shadow-sm"
)}>
    Got Questions?
  </h2>

  <h3
    className={cn(
      "mt-3 text-2xl md:text-3xl font-bold",
      "text-foreground"
    )}>
    We’ve Got Answers.
  </h3>

  <p
    className={cn(
      "text-muted-foreground",
      "mx-auto mt-5 max-w-2xl",
      "text-base md:text-lg leading-relaxed"
    )}>
    Learn everything about EventOne — from event management
    and registrations to certificates, dashboards, and support.
  </p>

  <div className="bg-primary/20 mx-auto mt-8 h-1 w-24 rounded-full" />
</motion.div>

        <div className="mx-auto max-w-2xl space-y-2">
          {faqs.map((faq, index) => (
            <FAQItem key={index} {...faq} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={cn("mx-auto mt-12 max-w-md rounded-lg p-6 text-center")}>
          <div className="bg-primary/10 text-primary mb-4 inline-flex items-center justify-center rounded-full p-2">
            <Mail className="h-4 w-4" />
          </div>
          <p className="text-foreground mb-1 text-sm font-medium">
            Still have questions?
          </p>
          <p className="text-muted-foreground mb-4 text-xs">
            We&apos;re here to help you
          </p>
          <button
            type="button"
            onClick={() => navigate("/support")}
            className={cn(
              "rounded-md px-4 py-2 text-sm",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90",
              "transition-colors duration-200",
              "font-medium",
            )}>
            Contact Support
          </button>
        </motion.div>
      </div>
    </section>
  );
}