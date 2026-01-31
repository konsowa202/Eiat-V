"use client";
import Link from "next/link";
import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useMediaQuery } from "react-responsive";
const WhatsApp = () => {
  const isTabletOrMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });
  if (!isTabletOrMobile) {
    return null;
  }
  return (
    <Link
      className="bg-foreground  rounded-full p-3 fixed bottom-4 z-30 right-4 cursor-pointer hover:opacity-90 transition-opacity"
      href="https://wa.me/966536777889"
    >
      <FaWhatsapp color="white" size={30} />
    </Link>
  );
};

export default WhatsApp;
