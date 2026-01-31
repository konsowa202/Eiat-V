"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import groq from "groq";
import { sanity } from "@/lib/sanity";
import PatientStoryCard, {
  BeforeAfterTestimonialSkeleton,
} from "./patient-story-card";
import { TextAnimate } from "./magicui/text-animate";
import { useHomepageSections } from "@/hooks/useHomepageSections";

/**
 * FeaturedSuccessStories Component
 *
 * Displays a carousel of featured patient testimonials with before/after images.
 * Fetches testimonial data from Sanity CMS and displays them in a responsive slider.
 *
 * Features:
 * - Responsive design with different layouts for mobile, tablet and desktop
 * - Auto-playing carousel with navigation controls
 * - Loading state with skeleton placeholders
 * - Animated section titles
 * - CTA button to view more stories
 *
 * @returns {JSX.Element} A section containing featured patient success stories
 */
export default function FeaturedSuccessStories() {
  // State for storing testimonials data and loading state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const { sections, error } = useHomepageSections();

  // Fetch testimonials on component mount
  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const query = groq`*[_type == "testimonial"] {
          _id,
          name,
          age,
          treatment,
          rating,
          date,
          location,
          image,
          quote,
          beforeImage,
          afterImage,
          featured,
        }`;
        const content = await sanity.fetch(query);
        setTestimonials(content);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTestimonials();
  }, []);
  if (testimonials.length === 0) {
    return null;
  }

  if (error) {
    return <p className="text-red-500 text-sm">{error.message}</p>;
  }
  const section = sections?.find((s) => s.sectionCategory === "التقيمات");
  return (
    <section className="px-4">
      <div className="max-w-7xl mx-auto space-y-5 overflow-x-hidden lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {section?.sectionTitle && (
              <TextAnimate className="section-title" animation="slideLeft" once>
                {section.sectionTitle}
              </TextAnimate>
            )}

            {section?.sectionSubtitle && (
              <TextAnimate
                className="section-subtitle"
                animation="slideLeft"
                once
              >
                {section.sectionSubtitle}
              </TextAnimate>
            )}

            {section?.sectionDesc && (
              <TextAnimate className="section-desc" animation="slideLeft" once>
                {section.sectionDesc}
              </TextAnimate>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            <button className="swiper-next rounded-full w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition">
              <span className="sr-only">Next</span>
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Swiper Section */}
        <Swiper
          modules={[Navigation, Autoplay]}
          slidesPerView={1.1} // mobile default
          spaceBetween={16}
          autoplay={{
            delay: 3000,
            disableOnInteraction: true,
          }}
          navigation={{
            nextEl: ".swiper-next",
            prevEl: ".swiper-prev",
          }}
          loop={true}
          speed={1000}
          breakpoints={{
            400: {
              slidesPerView: 1,
              spaceBetween: 10,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: 2,
              spaceBetween: 32,
            },
          }}
          className="w-full !overflow-visible"
        >
          {loading
            ? [...Array(3)].map((_, idx) => (
                <SwiperSlide key={idx}>
                  <BeforeAfterTestimonialSkeleton />
                </SwiperSlide>
              ))
            : testimonials
                .slice(0, 6) // show more if needed
                .map((testimonial) => (
                  <SwiperSlide key={testimonial._id}>
                    <PatientStoryCard testimonial={testimonial} />
                  </SwiperSlide>
                ))}
        </Swiper>

        {/* CTA */}
        <div className="col-span-full flex justify-center mt-6">
          <Link
            href="/patients"
            className="px-6 py-2 rounded bg-gradient-to-r from-[#307BC4] to-[#396A90] text-white font-semibold hover:bg-primary-700 transition"
          >
            عرض المزيد من القصص
          </Link>
        </div>
      </div>
    </section>
  );
}
