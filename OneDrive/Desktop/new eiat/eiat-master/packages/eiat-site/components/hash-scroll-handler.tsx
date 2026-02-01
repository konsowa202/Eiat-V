"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * HashScrollHandler Component
 * 
 * Handles automatic scrolling to hash anchors when:
 * 1. Page loads with a hash in the URL
 * 2. URL search params (doctor/offer) are present (which should scroll to booking)
 */
export default function HashScrollHandler() {
  const searchParams = useSearchParams();
  const hasBookingParams = searchParams.get("doctor") || searchParams.get("offer") || searchParams.get("department");

  useEffect(() => {
    // Function to scroll to hash
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const elementId = hash.substring(1); // Remove the #
        const element = document.getElementById(elementId);
        if (element) {
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset
          
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      } else if (hasBookingParams) {
        // If we have booking params but no hash, scroll to booking section
        setTimeout(() => {
          const bookingElement = document.getElementById("booking");
          if (bookingElement) {
            const elementPosition = bookingElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - 100;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        }, 500); // Wait a bit for the page to render
      }
    };

    // Check if we have hash or booking params
    const hash = window.location.hash;
    
    // Scroll on mount if hash or params exist
    if (hash || hasBookingParams) {
      // Wait for page to be fully loaded
      if (document.readyState === "complete") {
        setTimeout(scrollToHash, 300);
      } else {
        window.addEventListener("load", () => {
          setTimeout(scrollToHash, 300);
        });
      }
    }

    // Also handle hash changes (when clicking anchor links)
    const handleHashChange = () => {
      setTimeout(scrollToHash, 100);
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("load", scrollToHash);
    };
  }, [hasBookingParams]);

  return null; // This component doesn't render anything
}

