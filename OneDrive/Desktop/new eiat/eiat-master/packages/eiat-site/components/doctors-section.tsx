"use client";

/**
 * @component DoctorsSection
 * @description A section component that displays a carousel of doctors with their information.
 * Features loading states, responsive design, and animated transitions.
 */

import React, { useEffect, useState } from "react";
import groq from "groq";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { DoctorCard, DoctorCardSkeleton } from "@/components/doctor-card";
import { TextAnimate } from "./magicui/text-animate";
import { BlurFade } from "./magicui/blur-fade";
import { sanity } from "@/lib/sanity";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { cn } from "@/lib/utils";

interface DoctorsSectionProps {
  explicitDoctors?: Doctor[];
}

const TABS = [
  { id: "all", label: "الكل" },
  { id: "dental", label: "الأسنان" },
  { id: "dermatology", label: "الجلدية" },
  { id: "laser", label: "الليزر" },
];

export default function DoctorsSection({ explicitDoctors }: DoctorsSectionProps) {
  const [doctors, setDoctors] = useState<Doctor[]>(explicitDoctors || []);
  const [isLoading, setIsLoading] = useState(!explicitDoctors);
  const { sections, error } = useHomepageSections();
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (explicitDoctors) return;

    const fetchDoctors = async () => {
      try {
        const query = groq`*[_type == "doctor"]{...}`;
        // Fetch fresh data without cache
        const data = await sanity.fetch(query, {}, {
          cache: 'no-store' // Always fetch fresh data
        });
        setDoctors(data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
    
    // Refetch every 30 seconds to get latest updates
    const interval = setInterval(fetchDoctors, 30000);
    
    return () => clearInterval(interval);
  }, [explicitDoctors]);

  if (!doctors || doctors.length === 0) {
    return null;
  }
  if (error) {
    return <p className="text-red-500 text-sm">{error.message}</p>;
  }
  const section = sections?.find((s) => s.sectionCategory === "الأطباء");

  const filteredDoctors = activeTab === "all"
    ? doctors
    : doctors.filter(doctor => {
      // Default to dental if department is missing
      const dept = doctor.department || "dental";
      return dept === activeTab;
    });

  return (
    <BlurFade inView>
      <section className="px-4 sm:px-6 flex justify-center py-12" id="doctors">
        <div className="w-full max-w-7xl mx-auto space-y-8 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-6 mb-6">
            <div className="w-full lg:w-3xl space-y-5 text-right">
              {section?.sectionTitle && (
                <TextAnimate
                  className="section-title"
                  animation="slideLeft"
                  by="word"
                >
                  {section.sectionTitle}
                </TextAnimate>
              )}
              {section?.sectionSubtitle && (
                <TextAnimate
                  className="section-subtitle text-gray-500"
                  animation="slideLeft"
                  by="word"
                >
                  {section.sectionSubtitle}
                </TextAnimate>
              )}
              {section?.sectionDesc && (
                <TextAnimate
                  className="section-desc"
                  animation="slideLeft"
                  by="word"
                >
                  {section.sectionDesc}
                </TextAnimate>
              )}
            </div>

            {/* Tabs */}
            <div className="flex justify-center lg:justify-end flex-wrap gap-3 w-full lg:w-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border border-transparent",
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-md transform scale-105"
                      : "bg-gray-50 text-gray-600 hover:bg-white hover:border-gray-200 hover:shadow-sm"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="hidden lg:flex gap-2">
              <button className="swiper-next rounded-full w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition">
                <span className="sr-only">Next</span>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <button className="swiper-prev rounded-full w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition">
                <span className="sr-only">Previous</span>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>
          </div>

          {isLoading ? (
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={24}
              slidesPerView={1}
              navigation
              className="!overflow-visible"
              pagination={{ clickable: true }}
              breakpoints={{
                640: { slidesPerView: 1.2 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
            >
              {[...Array(3)].map((_, idx) => (
                <SwiperSlide key={idx}>
                  <DoctorCardSkeleton />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : filteredDoctors.length > 0 ? (
            <Swiper
              key={activeTab} // Force re-render on tab change to fix swiper sync
              modules={[Navigation, Autoplay]}
              spaceBetween={24}
              slidesPerView={1}
              navigation={{
                prevEl: ".swiper-next",
                nextEl: ".swiper-prev",
              }}
              autoplay={{
                delay: 3000,
                disableOnInteraction: true,
              }}
              className=" !overflow-visible"
              loop={true}
              speed={1000}
              breakpoints={{
                640: { slidesPerView: 2 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
            >
              {filteredDoctors.map((doctor, idx) => (
                <SwiperSlide key={doctor._id ?? idx}>
                  <DoctorCard doctor={doctor} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-2xl">
              <p className="text-gray-500">لا يوجد أطباء في هذا القسم حالياً</p>
            </div>
          )}
        </div>
      </section>
    </BlurFade>
  );
}
