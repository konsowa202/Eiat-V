"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { TextAnimate } from "./magicui/text-animate";
import Link from "next/link";
import { useClinicInfo } from "@/hooks/useClinicInfo";

/**
 * Footer component for the Ayat Dental website.
 * Includes contact information, navigation links, and a decorative background.
 *
 * Features:
 * - Responsive design with different layouts for mobile and desktop
 * - Decorative logo and wave background
 * - Contact information section
 * - Navigation links
 * - Animated tagline section
 */
const Footer = () => {
  const { clinicInfo, error } = useClinicInfo();
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  return (
    <footer className="relative mt-24 lg:mt-60 min-h-[700px] lg:min-h-[500px]">
      {/* Decorative Logo */}
      <div className="flex justify-center absolute w-full -top-40 md:-top-[18rem]">
        <Image
          src={"/2.png"}
          alt="عيادة إيات"
          width={600}
          height={600}
          className="w-[20rem] h-[20rem] md:w-[32rem] md:h-[32rem] object-contain"
          priority
        />
      </div>

      {/* Background Shape */}
      <svg
        width="1440"
        height="741"
        viewBox="0 0 1440 741"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute w-full h-full -z-1"
        preserveAspectRatio="none"
      >
        <path
          d="M724.901 0C385.766 117.489 -46.974 179.586 -220.952 195.947V741H1662.91V195.947C1406.11 179.026 930.568 58.2654 724.901 0Z"
          fill="url(#paint0_linear_22_11)"
        />
        <defs>
          <linearGradient
            id="paint0_linear_22_11"
            x1="720.98"
            y1="936.542"
            x2="720.98"
            y2="32.3253"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#6DB6AF" />
            <stop offset="1" stopColor="#E6FBFF" />
          </linearGradient>
        </defs>
      </svg>

      {/* Footer Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-8 pt-48">
        <div className="flex flex-col lg:flex-row gap-12 justify-between ">
          {/* Contact Info */}
          <div className="space-y-4 text-slate-700">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-slate-600" />
              {clinicInfo?.address && (
                <p className="text-sm sm:text-base font-medium">
                  {clinicInfo.address} <br />
                  المملكة العربية السعودية
                </p>
              )}
            </div>

            <Link href={"/contact"} className="block">
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-slate-600" />
                <div className="flex flex-col">
                  {clinicInfo?.phones.map((phone, i) => (
                    <p className="text-sm sm:text-base font-medium" key={i}>
                      {phone.phoneNumber}
                    </p>
                  ))}
                </div>
              </div>
            </Link>
            <Link href={"mailto:Eiatclinic@gmail.com"} className="block">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-slate-600" />
                {clinicInfo?.email && (
                  <p className="text-sm sm:text-base font-medium">
                    {clinicInfo.email}
                  </p>
                )}
              </div>
            </Link>
          </div>

          {/* Simple Link Section */}
          <div className="flex flex-col gap-2 text-slate-700 text-sm sm:text-base">
            <FooterLink link="/" label="الرئيسية" />
            <FooterLink link="/services" label="الخدمات" />
            <FooterLink link="/devices" label="أجهزتنا" />
            <FooterLink link="/contact" label="اتصل بنا" />
          </div>

          {/* Email Subscription */}
          <div className="w-full lg:max-w-md text-center lg:text-end space-y-4">
            <div className="w-full lg:max-w-md text-center lg:text-end space-y-4">
              <TextAnimate
                className="text-2xl sm:text-3xl font-bold text-slate-700"
                animation="blurInUp"
                by="word"
                once
              >
                رعاية متكاملة، لابتسامة وجمال يدوم
              </TextAnimate>
              <TextAnimate
                className="text-base text-slate-600"
                animation="blurInUp"
                by="word"
                once
              >
                في مجمع عيادات إيات، نلتزم بتقديم أفضل رعاية طبية في الأسنان، الجلدية، والليزر.
              </TextAnimate>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

/**
 * FooterLink component for rendering navigation links in the footer
 * @param {Object} props - Component props
 * @param {string} props.label - The text to display for the link
 * @param {string} props.link - The URL the link points to
 */
const FooterLink = ({ label, link }: { label: string; link: string }) => (
  <a href={link} className="transition hover:text-slate-900">
    {label}
  </a>
);

export default Footer;
