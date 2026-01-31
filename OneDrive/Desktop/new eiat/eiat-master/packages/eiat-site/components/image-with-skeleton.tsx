"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ImageWithSkeletonProps extends ImageProps {
    skeletonClassName?: string;
}

export default function ImageWithSkeleton({
    className,
    skeletonClassName,
    alt,
    ...props
}: ImageWithSkeletonProps) {
    const [isLoading, setIsLoading] = useState(true);
    const { fill } = props;

    return (
        <div
            className={cn(
                "relative overflow-hidden",
                fill ? "w-full h-full block" : "inline-block",
            )}
            suppressHydrationWarning
        >
            <Skeleton
                className={cn(
                    "absolute inset-0 w-full h-full z-10 transition-opacity duration-300",
                    skeletonClassName,
                    isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            />
            <Image
                className={cn(
                    "transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100",
                    className
                )}
                alt={alt}
                onLoad={() => setIsLoading(false)}
                suppressHydrationWarning
                {...props}
            />
        </div>
    );
}
