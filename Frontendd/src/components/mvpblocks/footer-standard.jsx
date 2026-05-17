"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LegalModal } from "../ui/legal-modal";
import { legalContent } from "../../data/legalContent";
import {
  Github,
  Linkedin,
  Twitter,
  MessageCircle,
  Zap,
  Heart,
} from "lucide-react";

const data = () => ({
  navigation: {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
    ],

    company: [
      { name: "About", href: "/about" },
      { name: "Contact", href: "/contact" },
    ],

    resources: [
      { name: "Documentation", href: "/docs" },
      { name: "API Reference", href: "/api" },
    ],

    legal: [
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
    ],
  },

  socialLinks: [
    { icon: Twitter, label: "Twitter", href: "#" },
    { icon: Github, label: "GitHub", href: "#" },
    { icon: MessageCircle, label: "Discord", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
  ],

  bottomLinks: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
});

export default function FooterStandard() {
  const currentYear = new Date().getFullYear();

  const [activeModal, setActiveModal] = useState(null);

  const [email, setEmail] = useState("");

  const handleLegalClick = (e, href) => {
    e.preventDefault();
    const key = href.replace('/', '');
    if (legalContent[key]) {
      setActiveModal(key);
    }
  };

  // Subscribe Button Functionality
  const handleSubscribe = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }

    alert("Successfully Subscribed!");

    setEmail("");
  };

  return (
    <footer className="mt-20 w-full">

      <div className="animate-energy-flow via-primary h-px w-full bg-gradient-to-r from-transparent to-transparent" />

      <div className="relative w-full px-5">

        {/* Top Section */}
        <div className="container m-auto grid grid-cols-1 gap-12 py-12 md:grid-cols-2 lg:grid-cols-5">

          {/* Company Info */}
          <div className="space-y-6 lg:col-span-2">

            <a href="/" className="inline-flex items-center gap-3">

              <div className="relative">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 shadow-lg">

                  <Zap className="h-5 w-5 text-white" />

                </div>

                <div className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-green-400"></div>

              </div>

              <span className="text-xl font-semibold">
                Event.One
              </span>

            </a>

            <p className="text-muted-foreground max-w-md">
              Building innovative solutions for modern businesses.
              Fast, reliable, and scalable.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2">

              <div className="flex gap-2">

                {data().socialLinks.map(
                  ({ icon: IconComponent, label, href }) => (

                    <Button
                      key={label}
                      size="icon"
                      variant="outline"
                      asChild
                      className="hover:bg-primary dark:hover:bg-primary !border-primary/30 cursor-pointer shadow-none transition-all duration-500 hover:scale-110 hover:-rotate-12 hover:text-white hover:shadow-md"
                    >

                      <a href={href}>

                        <IconComponent className="h-4 w-4" />

                      </a>

                    </Button>
                  )
                )}

              </div>

            </div>

            {/* Newsletter */}
            <form
              onSubmit={handleSubscribe}
              className="w-full max-w-md space-y-3"
            >

              <label
                htmlFor="email"
                className="block text-sm font-medium"
              >

                Subscribe to our newsletter

              </label>

              <div className="relative w-full">

                <Input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  className="h-12 w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  className="absolute top-1.5 right-1.5 cursor-pointer transition-all duration-300 hover:px-10"
                >

                  Subscribe

                </Button>

              </div>

              <p className="text-muted-foreground text-xs">

                Get the latest updates, tutorials, and exclusive offers.

              </p>

            </form>

            <h1 className="from-muted-foreground/15 bg-gradient-to-b bg-clip-text text-5xl font-extrabold text-transparent lg:text-7xl">

              Developer

            </h1>

          </div>

          {/* Navigation */}
          <div className="grid w-full grid-cols-2 items-start justify-between gap-8 px-5 lg:col-span-3">
            {["product", "company", "resources", "legal"].map((section) => (
              <div key={section} className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  {section === "product" && "Product"}
                  {section === "company" && "Company"}
                  {section === "resources" && "Resources"}
                  {section === "legal" && "Legal"}
                </h4>
                <ul className="space-y-2">
                  {data().navigation[section].map((item) => (
                    <li key={item.name}>
                     <Link
                        to={item.href}
                        onClick={(e) => {
                          if (section === 'legal') {
                            handleLegalClick(e, item.href);
                          }
                        }}
                        className="text-xs text-slate-600 hover:text-rose-600 transition-colors cursor-pointer">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom */}
        <div className="animate-rotate-3d via-primary h-px w-full bg-gradient-to-r from-transparent to-transparent" />

        <div className="text-muted-foreground container m-auto flex flex-col items-center justify-between gap-4 p-4 text-xs md:flex-row md:px-0 md:text-sm">

          <p>
            &copy; {currentYear} Eventone | All rights reserved
          </p>

          <div className="flex items-center gap-4">

            {data().bottomLinks.map(({ href, label }) => (

        {/* Divider */}
        <div className="h-px bg-slate-200 my-10"></div>

        {/* Bottom Row - Social & Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
          {/* Social Links - Left */}
          <div className="lg:col-span-4 flex items-center gap-3">
            {data().socialLinks.map(({ icon: IconComponent, label, href }) => (
              <a
                key={label}
                href={href}
                className="p-1.5 text-slate-600 hover:text-rose-600 transition-colors"
                aria-label={label}>
                <IconComponent className="h-4 w-4" />
              </a>

            ))}

          </div>

          {/* Privacy & Terms Links - Right */}
          <div className="lg:col-span-8 flex justify-end gap-4">
            <a
              href="/privacy"
              onClick={(e) => handleLegalClick(e, '/privacy')}
              className="text-xs text-slate-600 hover:text-rose-600 transition-colors cursor-pointer">
              Privacy
            </a>
            <a
              href="/terms"
              onClick={(e) => handleLegalClick(e, '/terms')}
              className="text-xs text-slate-600 hover:text-rose-600 transition-colors cursor-pointer">
              Terms
            </a>
          </div>
        </div>

        {/* Centered Copyright */}
        <div className="flex justify-center">
          <p className="text-xs text-slate-600 flex items-center gap-1">
            © {currentYear} Event.One
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>

      {/* Legal Modal */}
      <LegalModal
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        title={activeModal ? legalContent[activeModal].title : ""}
        content={activeModal ? legalContent[activeModal].content : ""}
      />

      {/* Animation Styles */}
      <style>{`
        .animate-rotate-3d {
          animation: rotate3d 8s linear infinite;
        }

        .animate-energy-flow {
          animation: energy-flow 4s linear infinite;
          background-size: 200% 100%;
        }

        @keyframes rotate3d {
          0% {
            transform: rotateY(0);
          }

          100% {
            transform: rotateY(360deg);
          }
        }

        @keyframes energy-flow {
          0% {
            background-position: -100% 0;
          }

          100% {
            background-position: 100% 0;
          }
        }
      `}</style>

    </footer>
  );
}