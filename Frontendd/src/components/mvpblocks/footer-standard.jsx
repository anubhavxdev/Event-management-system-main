import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LegalModal } from "../ui/legal-modal";
import { legalContent } from "../../data/legalContent";
import toast from "react-hot-toast";

const navData = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ],
  resources: [
    { name: "Documentation", href: "#" },
    { name: "API Reference", href: "#" },
  ],
  legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ],
};

const navBadges = {
  Pricing: "New",
  Documentation: "Docs",
};

const socialLinks = [
  {
    label: "Twitter",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.4 5.6 3.9 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
  },
  {
    label: "Discord",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
];

const stats = [
  { num: "50k+",  label: "Events hosted" },
  { num: "2M+",   label: "Attendees" },
  { num: "99.9%", label: "Uptime SLA" },
  { num: "140+",  label: "Countries" },
];

const bottomLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms",   label: "Terms of Service" },
  { href: "/privacy", label: "Cookie Policy" },
];

const sectionLabels = {
  product:   "Product",
  company:   "Company",
  resources: "Resources",
  legal:     "Legal",
};

export default function FooterStandard() {
  const currentYear = new Date().getFullYear();
  const [activeModal, setActiveModal] = useState(null);
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState("idle");

  const handleLegalClick = (e, href) => {
    e.preventDefault();
    const key = href.replace("/", "");
    if (legalContent[key]) setActiveModal(key);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    toast.success("Successfully Subscribed!");
    setSubState("success");
    setEmail("");
    setTimeout(() => setSubState("idle"), 3000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        .ft-brand-text { font-family: 'Playfair Display', serif; }
        .ft-stat-num   { font-family: 'Playfair Display', serif; }
        .ft-body       { font-family: 'Outfit', sans-serif; }
      `}</style>

      <footer className="ft-body mt-20 w-full bg-[#0a0a0f] dark:bg-[#0a0a0f] text-[#e2e0d8]">

        {/* Accent line */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-rose-500 to-purple-600" />

        <div className="relative w-full px-5">
          {/* Main grid */}
          <div className="container mx-auto grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1fr] border-b border-white/[0.06]">

            {/* Brand column */}
            <div className="py-10 pr-0 lg:pr-9 lg:border-r border-white/[0.06]">

              {/* Logo */}
              <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
                <div className="relative">
                  <div className="w-[34px] h-[34px] rounded-[9px] bg-rose-500 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] text-white">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />
                </div>
                <span className="ft-brand-text text-[19px] font-bold tracking-tight text-[#e2e0d8]">
                  Event<span className="text-rose-500">.</span>One
                </span>
              </Link>

              <p className="text-[13px] leading-relaxed text-white/40 mb-5 max-w-[205px]">
                Building innovative solutions for modern businesses. Fast, reliable, and scalable.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {stats.map(({ num, label }) => (
                  <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-[9px] p-3">
                    <div className="ft-stat-num text-[18px] font-bold text-rose-500 leading-none">{num}</div>
                    <div className="text-[11px] text-white/35 mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* Social icons */}
              <div className="flex gap-2 mb-6">
                {socialLinks.map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-[34px] h-[34px] rounded-[8px] border border-white/10 flex items-center justify-center text-white/40 transition-all duration-200 hover:bg-rose-500 hover:border-rose-500 hover:text-white hover:-translate-y-0.5"
                  >
                    {icon}
                  </a>
                ))}
              </div>

              {/* Newsletter */}
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-2.5">
                Newsletter
              </p>
              <form onSubmit={handleSubscribe}>
                <div className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    aria-label="Newsletter email"
                    required
                    className={`flex-1 px-3 py-2 text-[13px] bg-white/5 border border-r-0 rounded-l-[8px] text-[#e2e0d8] placeholder:text-white/25 outline-none transition-colors
                      ${subState === "error" ? "border-rose-500" : "border-white/10 focus:border-rose-500"}`}
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 text-[13px] font-semibold rounded-r-[8px] text-white whitespace-nowrap transition-colors
                      ${subState === "success" ? "bg-green-600" : "bg-rose-500 hover:bg-rose-600"}`}
                  >
                    {subState === "success" ? "Done!" : "Subscribe"}
                  </button>
                </div>
                <p className={`text-[11px] mt-1.5 transition-colors ${subState === "success" ? "text-green-400" : "text-white/25"}`}>
                  {subState === "success" ? "You're on the list!" : "Get the latest updates, tutorials, and exclusive offers."}
                </p>
              </form>
            </div>

            {/* Nav columns */}
            {Object.entries(navData).map(([section, items], i) => (
              <div key={section} className={`py-10 pl-0 lg:pl-9 ${i < 3 ? "lg:border-r border-white/[0.06]" : ""}`}>
                <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-white/30 mb-4">
                  {sectionLabels[section]}
                  <span className="flex-1 h-px bg-white/[0.06]" />
                </div>
                <ul className="flex flex-col gap-0.5">
                  {items.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        onClick={(e) => {
                          if (section === "legal") handleLegalClick(e, item.href);
                        }}
                        className="group flex items-center justify-between text-[13.5px] text-white/50 px-2 py-[5px] -mx-2 rounded-[7px] transition-all duration-200 hover:text-white hover:bg-rose-500/10"
                      >
                        <span className="flex items-center gap-1.5">
                          {item.name}
                          {navBadges[item.name] && (
                            <span className="text-[10px] font-semibold bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded-[4px] tracking-wide">
                              {navBadges[item.name]}
                            </span>
                          )}
                        </span>
                        <span className="text-rose-500 text-[12px] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="container mx-auto flex flex-wrap items-center justify-between py-4 gap-3">
            <div className="flex items-center gap-3 text-[12px] text-white/25">
              <span>© {currentYear} Event.One</span>
              <span className="w-[3px] h-[3px] rounded-full bg-white/20" />
              <span>All rights reserved</span>
            </div>

            <div className="flex gap-[18px]">
              {bottomLinks.map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => handleLegalClick(e, href)}
                  className="text-[12px] text-white/25 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Legal Modal — untouched */}
        <LegalModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          title={activeModal ? legalContent[activeModal].title : ""}
          content={activeModal ? legalContent[activeModal].content : ""}
        />
      </footer>
    </>
  );
}