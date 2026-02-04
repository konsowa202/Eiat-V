"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import PatientStoryCard from "@/components/patient-story-card";
import ReviewCard from "@/components/review-card";
import { BlurFade } from "@/components/magicui/blur-fade";
import { TextAnimate } from "@/components/magicui/text-animate";

interface TestimonialsViewProps {
    testimonials: Testimonial[];
}

export default function TestimonialsView({
    testimonials,
}: TestimonialsViewProps) {
    if (testimonials.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <svg
                    className="w-16 h-16 mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                    لا توجد قصص نجاح معروضة حالياً
                </h1>
                <p className="text-gray-600">يرجى المحاولة مرة أخرى لاحقاً</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen space-y-20 lg:space-y-40">
            {/* =========================
          HERO SECTION
       ========================= */}
            <section className="pt-60 pb-20 bg-gradient-to-r from-[#7BC6DB] to-[#4499B2] text-white relative">
                {/* Background logo for large screens */}
                <div className="absolute top-0 w-full h-full overflow-hidden hidden lg:block">
                    <Image
                        src="/logo.svg"
                        alt="شعار العيادة"
                        width={1000}
                        height={1000}
                        className="opacity-20"
                    />
                </div>

                {/* Animated headline and stats */}
                <BlurFade inView>
                    <div className="relative max-w-7xl mx-auto text-center">
                        <TextAnimate
                            className="text-4xl md:text-5xl font-bold mb-6"
                            once
                            animation="blurInDown"
                        >
                            قصص نجاحنا
                        </TextAnimate>
                        <TextAnimate
                            className="text-xl text-neutral-200 max-w-3xl mx-auto mb-8"
                            once
                            animation="blurInDown"
                        >
                            اكتشف كيف ساعدنا مرضانا في تحسين ابتسامتهم وتغيير حياتهم. اقرأ قصص
                            حقيقية وشاهد النتائج المذهلة بنفسك.
                        </TextAnimate>
                    </div>
                </BlurFade>
            </section>

            {/* =========================
          FEATURED TESTIMONIALS
       ========================= */}
            <section className="px-4">
                <div className="max-w-7xl mx-auto overflow-x-clip lg:px-12">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6">
                        <TextAnimate className="section-title" once animation="slideLeft">
                            قصص مميزة من مرضانا
                        </TextAnimate>
                        <div className="flex gap-2">
                            <button className="featured-next rounded-full w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition">
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
                            <button className="featured-prev rounded-full w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition">
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

                    {/* Swiper for Featured Stories */}
                    <BlurFade inView>
                        <Swiper
                            modules={[Navigation, Autoplay]}
                            slidesPerView={1.1}
                            spaceBetween={16}
                            autoplay={{ delay: 3000, disableOnInteraction: true }}
                            navigation={{
                                prevEl: ".featured-prev",
                                nextEl: ".featured-next",
                            }}
                            loop
                            speed={1000}
                            breakpoints={{
                                400: { slidesPerView: 1, spaceBetween: 10 },
                                768: { slidesPerView: 2, spaceBetween: 24 },
                                1024: { slidesPerView: 2, spaceBetween: 32 },
                            }}
                            className="w-full !overflow-visible"
                        >
                            {testimonials.map((testimonial) => (
                                <SwiperSlide key={testimonial._id}>
                                    <PatientStoryCard testimonial={testimonial} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </BlurFade>
                </div>
            </section>

            {/* =========================
          GENERAL REVIEWS SECTION
       ========================= */}
            <section className="px-4">
                <div className="max-w-7xl mx-auto overflow-x-clip px-12">
                    <div className="flex items-center justify-between mb-6">
                        <TextAnimate className="section-title" once animation="slideLeft">
                            آراء المرضى
                        </TextAnimate>
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

                    {/* Swiper for Patient Reviews */}
                    <BlurFade inView>
                        <Swiper
                            modules={[Navigation, Autoplay]}
                            slidesPerView={1}
                            spaceBetween={24}
                            autoplay={{ delay: 3000, disableOnInteraction: true }}
                            navigation={{
                                prevEl: ".swiper-prev",
                                nextEl: ".swiper-next",
                            }}
                            loop
                            speed={1000}
                            breakpoints={{
                                640: { slidesPerView: 1.2 },
                                768: { slidesPerView: 2 },
                                1024: { slidesPerView: 3 },
                            }}
                            className="!overflow-visible"
                        >
                            {testimonials.map((testimonial) => (
                                <SwiperSlide key={testimonial._id}>
                                    <ReviewCard
                                        testimonial={{
                                            name: testimonial.name,
                                            image: testimonial.image,
                                            rating: testimonial.rating,
                                            treatment: testimonial.treatment,
                                            quote: testimonial.quote,
                                            date: testimonial.date,
                                            location: testimonial.location,
                                        }}
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </BlurFade>
                </div>
            </section>
        </main>
    );
}
