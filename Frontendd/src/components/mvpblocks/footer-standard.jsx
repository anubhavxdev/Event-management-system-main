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
});

export default function FooterStandard() {
  const currentYear = new Date().getFullYear();
  const [activeModal, setActiveModal] = useState(null);

  const handleLegalClick = (e, href) => {
    e.preventDefault();
    const key = href.replace('/', '');
    if (legalContent[key]) {
      setActiveModal(key);
    }
  };

  return (
    <footer className="w-full border-t border-slate-200 bg-white">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        {/* Top Row - Logo & Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-8">
          {/* Logo & Description */}
          <div className="lg:col-span-4">
            <a href="/" className="inline-flex items-center gap-2 mb-3">
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 shadow-sm">
                  <Zap className="h-4 w-4 text-white" />
                </div>
              </div>
              <span className="text-lg font-semibold text-slate-900">
                Event.One
              </span>
            </a>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
              Building innovative event management solutions for modern businesses.
            </p>
          </div>

          {/* Navigation Columns - Right Aligned */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-12 justify-end">
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
    </footer>
  );
}