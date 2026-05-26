"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, easeInOut } from "framer-motion";
import {
  Menu,
  X,
  ArrowRight,
  Zap,
  Search,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../ui/NotificationBell";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about-us" },
  { name: "Contact", href: "/contact" },
];

function isNavActive(pathname, hash, href) {
  if (href === "/") {
    return pathname === "/";
  }
  if (href.startsWith("#")) {
    return pathname === "/" && hash === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header2() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === "dark";

  const getDashboardLink = () => {
    if (!user) return "/";

    switch (user.role) {
      case "admin":
        return "/admin/dashboard";
      case "organizer":
        return "/organizer/dashboard";
      default:
        return "/customer/dashboard";
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        duration: 0.3,
        ease: easeInOut,
      },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: easeInOut,
        staggerChildren: 0.1,
      },
    },
  };

  const mobileItemVariants = {
    closed: { opacity: 0, x: 20 },
    open: { opacity: 1, x: 0 },
  };

  return (
    <>
      <motion.header
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 px-4 sm:px-6 lg:px-8 pt-4 ${
          isScrolled
            ? "border-border/50"
            : ""
        }`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div
          className={`mx-auto max-w-6xl transition-all duration-500 rounded-full ${
            isScrolled
              ? "bg-background/80 backdrop-blur-xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              : "bg-transparent"
          }`}
        >
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <motion.div
              className="flex items-center space-x-3"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link to="/" className="flex items-center space-x-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-foreground text-xl font-extrabold tracking-tight">
                    Event
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                      .One
                    </span>
                  </span>
                </div>
              </Link>
            </motion.div>

            <nav className="hidden items-center gap-3 lg:flex">
              {navItems.map((item) => {
                const isActive = isNavActive(
                  location.pathname,
                  location.hash,
                  item.href,
                );
                const isHovered = hoveredItem === item.name;
                const showIndicator = isActive || isHovered;

                return (
                  <motion.div
                    key={item.name}
                    variants={itemVariants}
                    className="relative"
                    onMouseEnter={() => setHoveredItem(item.name)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Link
                      to={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative block rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? "text-foreground"
                          : "text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      {showIndicator && (
                        <motion.div
                          className={`absolute inset-0 rounded-full ${
                            isActive
                              ? "bg-indigo-500/15 ring-1 ring-indigo-500/30"
                              : "bg-muted/80"
                          }`}
                          layoutId={
                            isActive ? "navbar-active" : "navbar-hover"
                          }
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                      <span
                        className={`relative z-10 ${
                          isActive ? "font-semibold" : ""
                        }`}
                      >
                        {item.name}
                      </span>
                      {isActive && (
                        <motion.span
                          layoutId="navbar-active-dot"
                          className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <motion.div
              className="hidden items-center space-x-3 lg:flex"
              variants={itemVariants}
            >
              <motion.button
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </motion.button>

              <motion.button
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Search className="h-5 w-5" />
              </motion.button>

              {user ? (
                <div className="flex items-center space-x-3">
                  <NotificationBell />
                  <div className="relative">
                  <motion.button
                    className="flex items-center space-x-2 text-foreground/80 hover:text-foreground px-4 py-2 text-sm font-medium transition-colors duration-200 bg-muted/30 hover:bg-muted/50 rounded-full"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 overflow-hidden">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-indigo-600" />
                      )}
                    </div>
                    <span>Account</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isProfileMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute -right-12 mt-2 w-56 rounded-xl border border-border/50 bg-background/95 shadow-xl overflow-hidden z-50 backdrop-blur"
                      >
                        <div className="p-2 space-y-1">
                          <div className="px-3 py-2 border-b border-border/50 mb-1">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {user.name || "User"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>

                          <Link
                            to="/profile"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                          >
                            <User className="h-4 w-4" />
                            <span>Profile</span>
                          </Link>

                          <Link
                            to={getDashboardLink()}
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            <span>Dashboard</span>
                          </Link>

                          <div className="border-t border-border/50 my-1" />

                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              logout(navigate);
                            }}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-foreground/80 hover:text-foreground px-4 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    Sign In
                  </Link>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to="/signup"
                      className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center space-x-2 rounded-lg px-5 py-2.5 text-sm font-medium shadow-sm transition-all duration-200"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                </>
              )}
            </motion.div>

            <motion.button
              className="text-foreground hover:bg-muted rounded-lg p-2 transition-colors duration-200 lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variants={itemVariants}
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed top-16 right-4 z-50 w-[88%] max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white/70 backdrop-blur-2xl shadow-[0_8px_32px_rgba(15,23,42,0.18)] supports-[backdrop-filter]:bg-white/55 lg:hidden"
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <div className="space-y-6 p-6">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = isNavActive(
                      location.pathname,
                      location.hash,
                      item.href,
                    );

                    return (
                      <motion.div key={item.name} variants={mobileItemVariants}>
                        <Link
                          to={item.href}
                          aria-current={isActive ? "page" : undefined}
                          className={`block rounded-xl px-4 py-3 font-medium transition-all duration-200 active:scale-[0.98] ${
                            isActive
                              ? "bg-indigo-500/15 text-foreground ring-1 ring-indigo-500/25"
                              : "text-foreground/90 hover:bg-white/40 hover:text-foreground"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                <motion.button
                  type="button"
                  onClick={toggleTheme}
                  className="border-border text-foreground hover:bg-muted flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors duration-200"
                  variants={mobileItemVariants}
                >
                  <span>{isDark ? "Light mode" : "Dark mode"}</span>
                  {isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </motion.button>

                <motion.div
                  className="border-border space-y-3 border-t pt-6"
                  variants={mobileItemVariants}
                >
                  {user ? (
                    <div className="space-y-1">
                      <div className="px-4 py-2 mb-2">
                        <p className="text-sm font-semibold text-foreground">
                          {user.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-foreground hover:bg-muted rounded-lg font-medium transition-colors duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-foreground hover:bg-muted rounded-lg font-medium transition-colors duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout(navigate);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors duration-200"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="text-foreground hover:bg-muted block w-full rounded-lg py-3 text-center font-medium transition-colors duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        className="bg-foreground text-background hover:bg-foreground/90 block w-full rounded-lg py-3 text-center font-medium transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
