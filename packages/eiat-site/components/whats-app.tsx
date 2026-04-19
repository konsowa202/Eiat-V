"use client";
import Link from "next/link";
import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const WhatsApp = () => {
  // Always show on all devices as requested
  
  const phoneNumber = "966126150299";
  const message = encodeURIComponent("مرحباً عيادة إيات، أود الاستفسار عن خدماتكم.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <Link
      className="bg-[#25D366] text-white rounded-full p-4 fixed bottom-6 z-50 left-6 cursor-pointer hover:scale-110 shadow-2xl transition-all duration-300 flex items-center justify-center group"
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
    >
      <FaWhatsapp size={32} />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:mr-2 transition-all duration-500 font-bold whitespace-nowrap">
        تواصل معنا
      </span>
    </Link>
  );
};

export default WhatsApp;
