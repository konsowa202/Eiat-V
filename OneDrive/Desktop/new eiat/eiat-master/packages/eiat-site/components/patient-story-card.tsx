/**
 * A component that displays a patient testimonial card with before/after images
 * and patient details including name, age, treatment info, and quote.
 *
 * @component
 * @param {Object} props
 * @param {Testimonial} props.testimonial - The testimonial data object containing patient information
 */

import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { Calendar, MapPin, Star, Quote } from "lucide-react";
import React from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { urlFor } from "@/lib/sanityImage";
import { Skeleton } from "./ui/skeleton";
import Image from "next/image";

interface Testimonial {
  image?: { asset: { _ref: string } };
  beforeImage?: { asset: { _ref: string } };
  afterImage?: { asset: { _ref: string } };
  featured?: boolean;
  name: string;
  age: number;
  treatment: string;
  date: string;
  location: string;
  rating: number;
  quote: string;
}

const PatientStoryCard = ({ testimonial }: { testimonial: Testimonial }) => {
  const imageUrl = testimonial.image?.asset._ref
    ? urlFor(testimonial.image.asset._ref).width(500).height(500).url()
    : "/placeholder.svg?height=112&width=112";

  const beforeImage = testimonial.beforeImage?.asset._ref
    ? urlFor(testimonial.beforeImage.asset._ref).width(500).height(500).url()
    : "/placeholder.svg?height=112&width=112";

  const afterImage = testimonial.afterImage?.asset._ref
    ? urlFor(testimonial.afterImage.asset._ref).width(500).height(500).url()
    : "/placeholder.svg?height=112&width=112";

  return (
    <Card className="overflow-hidden shadow-xl border-0">
      <div className="relative">
        <div className="grid grid-cols-2 gap-1">
          <div className="relative">
            <Image
              src={beforeImage}
              width={800}
              height={800}
              alt="قبل العلاج"
              className="w-full h-48 object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              قبل
            </div>
          </div>
          <div className="relative">
            <Image
              src={afterImage}
              width={800}
              height={800}
              alt="بعد العلاج"
              className="w-full h-48 object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-subtitle text-white px-2 py-1 rounded text-xs">
              بعد
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={imageUrl} alt={testimonial.name} />
            <AvatarFallback>
              {testimonial.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">
                {testimonial.name}
              </h3>
              <span className="text-gray-500 text-sm">
                • العمر {testimonial.age}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <Badge variant="secondary">{testimonial.treatment}</Badge>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {testimonial.date}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {testimonial.location}
              </div>
            </div>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 transition-colors ${
                    i < testimonial.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
              <span className="text-sm text-gray-500 ml-1">
                ({testimonial.rating}/5)
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <Quote className="absolute -top-2 -left-2 w-8 h-8 text-subtitle/40" />
          <p className="text-gray-700 italic leading-relaxed pl-6">
            &quot;{testimonial.quote}&quot;
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * A skeleton loading state component for the PatientStoryCard
 * Shows placeholder animations while content is being loaded
 *
 * @component
 */
export const BeforeAfterTestimonialSkeleton = () => {
  return (
    <Card className="overflow-hidden shadow-xl border-0">
      <div className="relative">
        {/* Featured badge skeleton (randomly show/hide for variety) */}
        <Skeleton className="absolute top-4 left-4 z-10 w-20 h-6 rounded" />

        {/* Before/After images grid skeleton */}
        <div className="grid grid-cols-2 gap-1">
          <div className="relative">
            <Skeleton className="w-full h-48" />
            {/* "Before" label skeleton */}
            <div className="absolute bottom-2 left-2">
              <Skeleton className="w-8 h-5 rounded" />
            </div>
          </div>
          <div className="relative">
            <Skeleton className="w-full h-48" />
            {/* "After" label skeleton */}
            <div className="absolute bottom-2 left-2">
              <Skeleton className="w-8 h-5 rounded" />
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* User info section */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar skeleton */}
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />

          <div className="flex-1">
            {/* Name and age skeleton */}
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>

            {/* Treatment, date, location skeleton */}
            <div className="flex items-center gap-4 mb-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <div className="flex items-center gap-1">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>

            {/* Star rating skeleton */}
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-4 h-4 rounded-sm" />
              ))}
            </div>
          </div>
        </div>

        {/* Quote section skeleton */}
        <div className="relative">
          {/* Quote icon skeleton */}
          <Skeleton className="absolute -top-2 -left-2 w-8 h-8 rounded" />

          {/* Quote text skeleton */}
          <div className="pl-6 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientStoryCard;
