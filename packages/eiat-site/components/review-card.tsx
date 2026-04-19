/**
 * ReviewCard Component
 *
 * A card component that displays customer reviews/testimonials with the following features:
 * - Customer avatar with fallback initials
 * - Star rating display
 * - Treatment badge
 * - Customer quote
 * - Date and location info
 *
 * @component
 */

import React from "react";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { urlFor } from "@/lib/sanityImage";
import { Skeleton } from "./ui/skeleton";

/**
 * Props for the ReviewCard component
 * @typedef {Object} ReviewCardProps
 * @property {string} name - Customer's name
 * @property {Object} [image] - Customer's profile image from Sanity
 * @property {number} rating - Review rating (1-5)
 * @property {string} treatment - Type of treatment received
 * @property {string} quote - Customer's review text
 * @property {string} date - Review date
 * @property {string} location - Customer's location
 */
type ReviewCardProps = {
  name: string;
  image?: {
    _type: "image";
    asset: {
      _ref: string;
      _type: "reference";
    };
  };
  rating: number;
  treatment: string;
  quote: string;
  date: string;
  location: string;
};

/**
 * Renders a review card with customer testimonial information
 * @param {Object} props - Component props
 * @param {ReviewCardProps} props.testimonial - The testimonial data
 */
const ReviewCard = ({ testimonial }: { testimonial: ReviewCardProps }) => {
  const imageUrl = testimonial.image?.asset._ref
    ? urlFor(testimonial.image.asset._ref).width(500).height(500).url()
    : "/placeholder.svg?height=112&width=112";
  return (
    <Card className="group border border-gray-200 rounded-xl h-fit shadow-sm hover:shadow-md transition-all duration-300 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={imageUrl} alt={testimonial.name} />
            <AvatarFallback>
              {testimonial.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">
              {testimonial.name}
            </h3>
            <div className="flex items-center gap-[2px] mt-1">
              {Array.from({ length: testimonial.rating }).map((_, j) => (
                <Star
                  key={j}
                  className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className="mt-3 w-fit px-2 py-1 text-[11px] font-medium rounded border-emerald-500 text-emerald-600"
        >
          {testimonial.treatment}
        </Badge>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          &quot;{testimonial.quote}&quot;
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{testimonial.date}</span>
          <span>{testimonial.location}</span>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Loading skeleton for the ReviewCard component
 * Displays a placeholder layout while content is being loaded
 * @component
 */
export const ReviewCardSkeleton = () => {
  return (
    <Card className="group border border-gray-200 rounded-xl h-fit shadow-sm bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          {/* Avatar skeleton */}
          <Skeleton className="w-12 h-12 rounded-full" />

          <div className="flex-1">
            {/* Name skeleton */}
            <Skeleton className="h-4 w-24 mb-2" />

            {/* Star rating skeleton */}
            <div className="flex items-center gap-[2px] mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-3.5 h-3.5 rounded-sm" />
              ))}
            </div>
          </div>
        </div>

        {/* Treatment badge skeleton */}
        <Skeleton className="mt-3 w-20 h-6 rounded" />
      </CardHeader>

      <CardContent className="pt-0">
        {/* Quote skeleton - multiple lines */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Date and location skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
