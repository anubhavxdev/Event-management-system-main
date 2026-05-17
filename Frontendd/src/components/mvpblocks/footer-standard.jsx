"use client";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LegalModal } from "../ui/legal-modal";
import { legalContent } from "../../data/legalContent";
import { Button } from "../ui/button";
import {
  Github,
  Linkedin,
  Twitter,
  ArrowUpRight,
  MessageCircle,
  Zap,
} from "lucide-react";
import { Input } from "../ui/input";

const data = () => ({
  navigation: {
    product: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      // { name: "Integrations", href: "#integrations" },
      // { name: "Roadmap", href: "#roadmap" },
    ],
    company: [
      { name: "About", href: "/about-us" },
      // { name: "Blog", href: "/blog" },

      // { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
    ],
    resources: [
      { name: "Documentation", href: "/docs" },
      { name: "API Reference", href: "/api" },
      // { name: "Community", href: "/community" },
      // { name: "Status", href: "/status" },
    ],
    legal: [
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
      // { name: "Cookie Policy", href: "/cookies" },
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
    // { href: "/cookies", label: "Cookie Policy" },
  ],
});

export default function FooterStandard() {
  const currentYear = new Date().getFullYear();
  const [activeModal, setActiveModal] = useState(null);

  const handleLegalClick = (e, href) => {
    e.preventDefault();
    // Extract key from href (e.g., "/privacy" -> "privacy")
    const key = href.replace('/', '');
    // Map "cookies" to "cookies" (it matches), "terms" to "terms"
    if (legalContent[key]) {
      setActiveModal(key);
    }
  };

  return (
  <footer className="relative mt-0 overflow-hidden bg-[#050816] text-white">
  {/* Top Border Glow */}
  <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-70" />

  <div className="mx-auto max-w-7xl px-6 py-16">
    {/* Main Footer */}
    <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
      
      {/* Left Section */}
      <div className="lg:col-span-4">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/30">
              <Zap className="h-7 w-7 text-white" />
            </div>

            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-400" />
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Event.One
            </h2>

            <p className="text-sm text-gray-400">
              By Student Inc.
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="max-w-sm text-base leading-7 text-gray-400">
          Building innovative solutions for modern businesses.
          Fast, reliable, and scalable.
        </p>

        {/* Social Icons */}
        <div className="mt-8 flex items-center gap-4">
          {[
            Github,
            Twitter,
            MessageCircle,
            Linkedin,
          ].map((Icon, i) => (
            <a
              key={i}
              href="#"
              className="group flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/40 hover:bg-pink-500"
            >
              <Icon className="h-5 w-5 text-gray-300 transition-colors duration-300 group-hover:text-white" />
            </a>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-semibold">
            Subscribe to our newsletter
          </h3>

          <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <Input
              type="email"
              placeholder="Enter your email"
              className="h-14 border-0 bg-transparent text-white placeholder:text-gray-500 focus-visible:ring-0"
            />

            <Button className="m-1 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-6 text-white hover:from-pink-600 hover:to-rose-600">
              Subscribe
            </Button>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-500">
            Get the latest updates, tutorials, and exclusive offers.
          </p>
        </div>
      </div>

      {/* Links Section */}
      <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
        
        {/* Product */}
        <div>
          <h3 className="relative mb-8 text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Product
            <span className="absolute -bottom-3 left-0 h-[2px] w-10 bg-pink-500" />
          </h3>

          <ul className="space-y-5">
            {["Features", "Pricing"].map((item) => (
              <li key={item}>
                <a
                  href="#"
                  className="group flex items-center gap-3 text-gray-400 transition-all duration-300 hover:text-pink-400"
                >
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="relative mb-8 text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Company
            <span className="absolute -bottom-3 left-0 h-[2px] w-10 bg-pink-500" />
          </h3>

          <ul className="space-y-5">
            {["About", "Contact"].map((item) => (
              <li key={item}>
                <a
                  href="#"
                  className="group flex items-center gap-3 text-gray-400 transition-all duration-300 hover:text-pink-400"
                >
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="relative mb-8 text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Resources
            <span className="absolute -bottom-3 left-0 h-[2px] w-10 bg-pink-500" />
          </h3>

          <ul className="space-y-5">
            {["Documentation", "API Reference"].map((item) => (
              <li key={item}>
                <a
                  href="#"
                  className="group flex items-center gap-3 text-gray-400 transition-all duration-300 hover:text-pink-400"
                >
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="relative mb-8 text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Legal
            <span className="absolute -bottom-3 left-0 h-[2px] w-10 bg-pink-500" />
          </h3>

          <ul className="space-y-5">
            {["Privacy", "Terms"].map((item) => (
              <li key={item}>
                <a
                  href="#"
                  className="group flex items-center gap-3 text-gray-400 transition-all duration-300 hover:text-pink-400"
                >
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {/* Bottom Section */}
    <div className="mt-16 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 text-sm text-gray-500 md:flex-row">
      <p>
        © 2026 Eventone | All rights reserved
      </p>

      <div className="flex items-center gap-6">
        <a
          href="#"
          className="transition-colors duration-300 hover:text-pink-400"
        >
          Privacy Policy
        </a>

        <div className="h-4 w-px bg-white/10" />

        <a
          href="#"
          className="transition-colors duration-300 hover:text-pink-400"
        >
          Terms of Service
        </a>
      </div>
    </div>
  </div>

  {/* Background Glow */}
  <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-pink-500/10 blur-[140px]" />
</footer>
  );
}