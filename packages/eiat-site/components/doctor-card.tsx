"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { urlFor } from "@/lib/sanityImage";
import { Skeleton } from "@/components/ui/skeleton"; // make sure this exists in your UI lib
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

/**
 * DoctorCard component displays detailed information about a medical professional
 * including their photo, name, experience, location, and availability.
 */
const DoctorCard = ({ doctor }: { doctor: Doctor }) => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const initials = doctor.name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const imageUrl = doctor.image?.asset._ref
    ? urlFor(doctor.image.asset._ref).width(500).height(500).url()
    : "/placeholder.svg?height=112&width=112";

  const isDoctorsPage = pathname === "/doctors";

  return (
    <Card
      id={`doctor-${doctor._id}`}
      className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden relative"
    >
      {/* Decorative background pattern */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full -translate-y-16 -translate-x-16" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-indigo-100/30 to-transparent rounded-full translate-y-12 translate-x-12" />

      <CardHeader className="text-center pb-6 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-white shadow-lg ring-2 ring-blue-200/50 group-hover:ring-blue-300/70 transition-all duration-300">
              <AvatarImage
                src={imageUrl || "/placeholder.svg"}
                alt={`صورة د.${doctor.name}`}
                className="object-cover"
                aria-label={`صورة د.${doctor.name}`}
              />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-foreground to-indigo-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-800 group-hover:text-foreground transition-colors duration-300">
            د. {doctor.name}
          </h2>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 relative z-10">
        {/* Experience Badge */}
        {doctor.experience && (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className="bg-blue-100 text-foreground hover:bg-blue-200 transition-colors"
            >
              <Clock className="w-3 h-3 ml-1" />
              {doctor.experience} سنة خبرة
            </Badge>
          </div>
        )}

        <div className="space-y-4">
          {doctor.about && (
            <div className="p-3 bg-white/60 rounded-lg border border-blue-100/50 hover:bg-white/80 transition-colors">
              <p
                className={`text-gray-700 font-medium text-sm overflow-hidden text-ellipsis ${isExpanded || !isDoctorsPage ? "" : "line-clamp-3"
                  } ${!isExpanded && !isDoctorsPage ? "line-clamp-3" : ""}`}
                style={
                  isExpanded
                    ? {}
                    : {
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                    }
                }
              >
                {doctor.about}
              </p>
              {isDoctorsPage ? (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-primary mt-1 inline-block hover:underline focus:outline-none cursor-pointer"
                >
                  {isExpanded ? "عرض أقل" : "عرض المزيد"}
                </button>
              ) : (
                <Link
                  href={`/doctors#doctor-${doctor._id}`}
                  className="text-xs text-primary mt-1 inline-block hover:underline"
                >
                  عرض المزيد
                </Link>
              )}
            </div>
          )}
          {doctor.availability && doctor.availability.length > 0 && (
            <div className="p-3 bg-white/60 rounded-lg border border-blue-100/50 hover:bg-white/80 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <CalendarCheck className="w-4 h-4 text-green-600" />
                </div>
                <div className="space-y-2 flex-1">
                  <p className="font-semibold text-gray-800 text-sm">
                    الأيام المتاحة:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {doctor.availability.map((day, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 transition-colors"
                      >
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {doctor.joinedAt && (
          <div className="pt-4 border-t border-gray-200/50">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>انضم في {doctor.joinedAt}</span>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Link
            href={`/?doctor=${encodeURIComponent(doctor.name)}&department=${doctor.department || "dental"
              }#booking`}
            className="block w-full text-center py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors font-semibold shadow-md active:scale-95 duration-200"
          >
            احجز موعد
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * DoctorCardSkeleton component displays a loading state version of the DoctorCard
 * Used while fetching doctor data or during loading states
 */
const DoctorCardSkeleton = () => {
  return (
    <Card
      dir="rtl"
      className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-200/50 shadow-lg overflow-hidden"
    >
      {/* Decorative BG Circles */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full -translate-y-16 -translate-x-16" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-indigo-100/30 to-transparent rounded-full translate-y-12 translate-x-12" />

      <CardHeader className="text-center pb-6 relative z-10">
        <div className="flex justify-center mb-6">
          <Skeleton className="w-28 h-28 rounded-full" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-6 w-40 mx-auto" />
          <div className="flex justify-center items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-4 h-4 rounded-full" />
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 relative z-10">
        <div className="flex justify-center">
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-blue-100/50">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>

          <div className="p-3 bg-white/60 rounded-lg border border-blue-100/50">
            <div className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-full mt-1" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-28" />
                <div className="flex flex-wrap gap-1.5">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-5 w-16 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200/50">
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </CardContent>
    </Card>
  );
};

export { DoctorCard, DoctorCardSkeleton };
