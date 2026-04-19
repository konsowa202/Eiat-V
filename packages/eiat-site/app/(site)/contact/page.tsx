"use client";

import { ContactFormCard } from "@/components/contact-form-card";
import { ContactInformationCard } from "@/components/contact-information-card";
import { ContactMapCard } from "@/components/contact-map-card";
import { BlurFade } from "@/components/magicui/blur-fade";
import { TextAnimate } from "@/components/magicui/text-animate";
import { useHomepageSections } from "@/hooks/useHomepageSections";

/**
 * ContactPage Component
 *
 * This page renders the "Contact Us" section of the website.
 * It includes:
 *  - A header with animated text.
 *  - A grid layout with:
 *    - Contact information (address, phone, etc.).
 *    - A contact form for inquiries.
 *    - An embedded map for location reference.
 *
 * All major sections are animated using BlurFade and TextAnimate
 * for a smooth, elegant user experience.
 */
export default function ContactPage() {
  const { sections, error } = useHomepageSections();

  if (error) {
    return <p className="text-red-500 text-sm">{error.message}</p>;
  }
  const section = sections?.find((s) => s.sectionCategory === "تواصل معنا");
  return (
    <main className="min-h-screen pt-40">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <BlurFade>
          <div className="mb-12">
            {section?.sectionTitle && (
              <TextAnimate
                className="section-title"
                animation="blurInUp"
                by="word"
                once
              >
                {section.sectionTitle}
              </TextAnimate>
            )}
            {section?.sectionSubtitle && (
              <TextAnimate
                className="section-subtitle"
                animation="blurInUp"
                by="word"
                once
              >
                {section.sectionSubtitle}
              </TextAnimate>
            )}
            {section?.sectionDesc && (
              <TextAnimate
                className="section-desc"
                animation="blurInUp"
                by="word"
                once
              >
                {section.sectionDesc}
              </TextAnimate>
            )}
          </div>
        </BlurFade>

        {/* Contact Grid Section */}
        <div className="grid lg:grid-cols-2 gap-8 mx-auto">
          <div className="space-y-6">
            {/* Contact Info Card */}
            <BlurFade>
              <ContactInformationCard />
            </BlurFade>

            {/* Contact Form Card */}
            <BlurFade>
              <ContactFormCard />
            </BlurFade>
          </div>

          {/* Map Card */}
          <BlurFade>
            <ContactMapCard />
          </BlurFade>
        </div>
      </div>
    </main>
  );
}
