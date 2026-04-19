import { Skeleton } from "@/components/ui/skeleton";
import { BeforeAfterTestimonialSkeleton } from "@/components/patient-story-card";
import { ReviewCardSkeleton } from "@/components/review-card";

export default function Loading() {
    return (
        <main className="min-h-screen space-y-20 lg:space-y-40">
            {/* Hero Section Skeleton */}
            <section className="pt-60 pb-20 bg-gradient-to-r from-[#7BC6DB] to-[#4499B2] relative opacity-70">
                <div className="relative max-w-7xl mx-auto text-center px-4">
                    {/* Title */}
                    <Skeleton className="h-12 w-3/4 md:w-1/2 mx-auto mb-6 bg-white/20" />
                    {/* Subtitle */}
                    <Skeleton className="h-6 w-full md:w-2/3 mx-auto mb-2 bg-white/20" />
                    <Skeleton className="h-6 w-full md:w-1/2 mx-auto bg-white/20" />
                </div>
            </section>

            {/* Featured Testimonials Skeleton */}
            <section className="px-4">
                <div className="max-w-7xl mx-auto lg:px-12">
                    <div className="flex items-center justify-between mb-6">
                        <Skeleton className="h-10 w-64" />
                        <div className="flex gap-2">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="w-10 h-10 rounded-full" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <BeforeAfterTestimonialSkeleton />
                        <BeforeAfterTestimonialSkeleton />
                    </div>
                </div>
            </section>

            {/* Reviews Skeleton */}
            <section className="px-4 pb-20">
                <div className="max-w-7xl mx-auto px-12">
                    <div className="flex items-center justify-between mb-6">
                        <Skeleton className="h-10 w-48" />
                        <div className="flex gap-2">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="w-10 h-10 rounded-full" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <ReviewCardSkeleton />
                        <ReviewCardSkeleton />
                        <ReviewCardSkeleton />
                    </div>
                </div>
            </section>
        </main>
    );
}
