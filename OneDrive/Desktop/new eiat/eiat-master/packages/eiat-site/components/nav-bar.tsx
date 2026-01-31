"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AnimatePresence, motion, Variants } from "motion/react";
import Image from "next/image";
import { toast } from "sonner";
import { FaInstagram, FaSnapchatGhost } from "react-icons/fa";

/**
 * Responsive navigation bar component with animated mobile menu
 * Features:
 * - Responsive design with mobile and desktop layouts
 * - Animated transitions and hover effects
 * - RTL (Right-to-Left) support
 * - Mobile menu with smooth animations
 * - Logo with hover/tap animations
 */
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /**
   * Navigation items configuration
   * @type {Array<{name: string, href: string}>}
   */
  const navItems = [
    { name: "الرئيسية", href: "/" },
    { name: "الخدمات والأسعار", href: "/services" },
    { name: "أجهزتنا", href: "/devices" },
    { name: "العروض", href: "/offers" },
    { name: "أطباءنا", href: "/doctors" },
    { name: "تواصل معنا", href: "/contact" },
  ];

  /**
   * Toggles the mobile menu state
   */
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  /**
   * Animation variants for the mobile menu container
   */
  const menuVariants: Variants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
        when: "afterChildren",
      },
    },
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  /**
   * Animation variants for individual menu items
   */
  const itemVariants: Variants = {
    closed: {
      opacity: 0,
      x: -20,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  /**
   * Animation variants for the mobile menu icon
   */
  const iconVariants: Variants = {
    closed: {
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    open: {
      rotate: 180,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: 0.1,
      },
    },
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 mx-6 lg:mx-auto w-fit rounded-2xl bg-slate-200/80 backdrop-blur-sm px-4 py-2 mt-6 border border-white overflow-hidden"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-8" dir="rtl">
        {/* Logo */}
        <Link href="." className="flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className=" bg-white p-2 rounded-lg"
          >
            <Image src="/1.png" alt="logo" width={40} height={40} />
          </motion.div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center  space-x-8">
          {navItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                delay: index * 0.1,
              }}
            >
              <motion.div
                whileHover="hover"
                initial="initial"
                className="relative"
              >
                <Link
                  href={item.href}
                  className="text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200"
                >
                  {item.name}
                </Link>
                <motion.div
                  variants={{
                    hover: {
                      width: "100%",
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      },
                    },
                    initial: { width: 0 },
                  }}
                  className="h-0.5 bg-foreground absolute bottom-0 right-0"
                />
              </motion.div>
            </motion.div>
          ))}
          {/* Social Icons Desktop */}
          <div className="flex items-center gap-2">
            <Link
              href="https://www.instagram.com/eiat.clinics?igsh=MWhpNGxtYTg3aWlnOQ=="
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-pink-600 transition-colors"
            >
              <FaInstagram size={20} />
            </Link>
            <Link
              href="https://snapchat.com/t/AVfd6UWc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-yellow-500 transition-colors"
            >
              <FaSnapchatGhost size={20} />
            </Link>
          </div>
          {/* Language Switcher Desktop */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex gap-1 text-slate-600 hover:text-slate-900"
            onClick={() => toast.info("English version is coming soon!")}
          >
            <span className="font-bold">EN</span>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          size="icon"
          variant="ghost"
          className="md:hidden"
          onClick={toggleMenu}
        >
          <motion.svg
            className="size-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            variants={iconVariants}
            animate={isMenuOpen ? "open" : "closed"}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"
              }
            />
          </motion.svg>
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden overflow-hidden"
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="pt-4 border-t border-slate-300 mt-4">
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <motion.div key={item.name} variants={itemVariants}>
                    <Link
                      href={item.href}
                      className="text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200 py-2 block hover:bg-slate-100 rounded-lg px-3"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
                {/* Social Icons Mobile */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-4 px-3 py-2"
                >
                  <Link
                    href="https://www.instagram.com/eiat.clinics?igsh=MWhpNGxtYTg3aWlnOQ=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-pink-600 transition-colors flex items-center gap-2"
                  >
                    <FaInstagram size={24} />
                    <span>انستجرام</span>
                  </Link>
                  <Link
                    href="https://snapchat.com/t/AVfd6UWc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-yellow-500 transition-colors flex items-center gap-2"
                  >
                    <FaSnapchatGhost size={24} />
                    <span>سناب شات</span>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-600 font-medium hover:bg-slate-100 rounded-lg px-3"
                    onClick={() => toast.info("English version is coming soon!")}
                  >
                    <span className="font-bold">English</span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
