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
import { Link, useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "Pricing", href: "#pricing" },
  { name: "About", href: "/about-us" },
  { name: "Contact", href: "/contact" },
];

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

  const isActiveNavItem = (href) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
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
        staggerChildren: 0.08,
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
        staggerChildren: 0.08,
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
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8 py-3 ${
          isScrolled ? "pt-3" : "pt-4"
        }`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div
          className={`mx-auto max-w-7xl transition-all duration-300 rounded-2xl ${
            isScrolled
              ? "bg-muted/40 backdrop-blur-lg border border-muted/60 shadow-[0_4px_16px_rgb(0,0,0,0.06)]"
              : "bg-transparent"
          }`}
        >
          <div className="flex h-14 items-center justify-between px-5 sm:px-6 lg:px-8">
            {/* Logo */}
            <motion.div
              className="flex items-center flex-shrink-0"
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-foreground text-background group-hover:scale-110 transition-transform duration-200">
                  <Zap className="h-5 w-5 stroke-[2.5]" />
                </div>
                <span className="text-lg font-bold tracking-tight text-foreground hidden sm:inline">
                  Event.One
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => {
                const isActive = isActiveNavItem(item.href);
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
                      className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "text-foreground"
                          : "text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      {hoveredItem === item.name && !isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-lg bg-muted/50"
                          layoutId="navbar-hover"
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
                      {isActive && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-1 bg-foreground rounded-full"
                          layoutId="navbar-active"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                      )}
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Right section with icons and CTA */}
            <motion.div
              className="hidden items-center gap-2 lg:flex"
              variants={itemVariants}
            >
              {/* Theme Toggle */}
              <motion.button
                className="text-foreground/60 hover:text-foreground hover:bg-muted rounded-lg p-2 transition-colors duration-200"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? (
                  <Sun className="h-4.5 w-4.5" />
                ) : (
                  <Moon className="h-4.5 w-4.5" />
                )}
              </motion.button>

              {/* Search Icon */}
              <motion.button
                className="text-foreground/60 hover:text-foreground hover:bg-muted rounded-lg p-2 transition-colors duration-200"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                aria-label="Search"
                title="Search"
              >
                <Search className="h-4.5 w-4.5" />
              </motion.button>

              {user ? (
                /* Authenticated User Menu */
                <div className="relative">
                  <motion.button
                    className="flex items-center gap-2 text-foreground/80 hover:text-foreground px-3 py-1.5 text-sm font-medium transition-colors duration-200 bg-muted/20 hover:bg-muted/40 rounded-lg"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-muted-foreground/20">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-3.5 w-3.5 text-foreground/60" />
                      )}
                    </div>
                    <span className="hidden sm:inline">Account</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-300 ${
                        isProfileMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute -right-20 mt-2 w-56 rounded-xl border border-border/50 bg-background/98 shadow-lg overflow-hidden z-50 backdrop-blur-sm"
                      >
                        <div className="p-3 space-y-1">
                          <div className="px-3 py-2.5 border-b border-border/40 mb-2">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {user.name || "User"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {user.email}
                            </p>
                          </div>

                          <Link
                            to="/profile"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground/80 hover:bg-muted/60 hover:text-foreground rounded-lg transition-colors duration-150"
                          >
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span>Profile</span>
                          </Link>

                          <Link
                            to={getDashboardLink()}
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground/80 hover:bg-muted/60 hover:text-foreground rounded-lg transition-colors duration-150"
                          >
                            <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                            <span>Dashboard</span>
                          </Link>

                          <div className="border-t border-border/40 my-2" />

                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              logout(navigate);
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors duration-150"
                          >
                            <LogOut className="h-4 w-4 flex-shrink-0" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Guest User Actions */
                <>
                  <Link
                    to="/login"
                    className="text-foreground/70 hover:text-foreground px-3.5 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    Sign In
                  </Link>

                  <motion.div
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Link
                      to="/signup"
                      className="bg-foreground text-background hover:bg-foreground/95 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                </>
              )}
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              className="text-foreground hover:bg-muted rounded-lg p-2 transition-colors duration-200 lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variants={itemVariants}
              whileTap={{ scale: 0.92 }}
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed top-14 right-4 z-50 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-border/50 bg-background/95 backdrop-blur-lg shadow-lg lg:hidden"
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <div className="space-y-4 p-4">
                {/* Mobile Navigation */}
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = isActiveNavItem(item.href);
                    return (
                      <motion.div key={item.name} variants={mobileItemVariants}>
                        <Link
                          to={item.href}
                          className={`block rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ${
                            isActive
                              ? "bg-muted text-foreground"
                              : "text-foreground/80 hover:bg-muted/60 hover:text-foreground"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Theme Toggle */}
                <motion.button
                  type="button"
                  onClick={toggleTheme}
                  className="border border-border/50 text-foreground hover:bg-muted w-full flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-150"
                  variants={mobileItemVariants}
                >
                  <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                  {isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </motion.button>

                {/* Auth Actions */}
                <motion.div
                  className="border-t border-border/40 space-y-3 pt-4"
                  variants={mobileItemVariants}
                >
                  {user ? (
                    <div className="space-y-1.5">
                      <div className="px-3.5 py-2 mb-2 border-b border-border/40">
                        <p className="text-sm font-semibold text-foreground">
                          {user.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground rounded-lg font-medium transition-colors duration-150"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground rounded-lg font-medium transition-colors duration-150"
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
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive rounded-lg font-medium transition-colors duration-150"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="text-foreground/80 hover:bg-muted/60 hover:text-foreground block w-full rounded-lg py-2.5 px-3.5 text-center text-sm font-medium transition-colors duration-150"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        className="bg-foreground text-background hover:bg-foreground/95 block w-full rounded-lg py-2.5 px-3.5 text-center text-sm font-semibold transition-all duration-200"
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
