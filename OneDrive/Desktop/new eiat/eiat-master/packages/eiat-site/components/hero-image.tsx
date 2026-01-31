"use client";

import { motion } from "motion/react";
import ImageWithSkeleton from "./image-with-skeleton";

export default function HeroImage() {
    return (
        <div className="relative w-full h-full flex justify-center items-center p-4">
            {/* Animated Background Blob */}
            <motion.div
                animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/20 rounded-full blur-3xl opacity-60"
            />

            {/* Creative Frame Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-fit"
            >
                {/* Decorative Ring 1 */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-8 border border-dashed border-primary/20 rounded-full w-[110%] h-[110%] -left-[5%] -top-[5%]"
                />

                {/* Decorative Ring 2 */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-12 border border-dotted border-secondary/20 rounded-full w-[120%] h-[120%] -left-[10%] -top-[10%]"
                />

                {/* Main Image Container with Float Animation */}
                <motion.div
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                >
                    {/* Glassmorphic Backplate */}
                    <div className="absolute inset-4 bg-white/30 backdrop-blur-sm rounded-[3rem] -z-10 border border-white/50 shadow-lg transform rotate-6 scale-105" />

                    {/* The Image */}
                    <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-white/80 shadow-2xl bg-gradient-to-b from-transparent to-primary/5">
                        <ImageWithSkeleton
                            src="/hero-doctor-new.png"
                            alt="طاقم إيات الطبي"
                            width={600}
                            height={700}
                            className="object-cover max-h-[500px] lg:max-h-[600px] w-auto"
                            skeletonClassName="bg-gray-100"
                            priority
                        />
                    </div>

                    {/* Floating badge feature (optional creative touch) */}
                    <motion.div
                        animate={{ y: [5, -5, 5] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-10 -right-6 bg-white p-3 rounded-2xl shadow-xl flex items-center gap-2 border border-gray-100"
                    >
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                            ✓
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 font-medium">أطباء معتمدون</p>
                            <p className="text-sm font-bold text-gray-800">خبرة وكفاءة</p>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
}
