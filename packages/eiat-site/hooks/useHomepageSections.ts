"use client";
// hooks/useHomepageSections.ts
import { useEffect, useState, useCallback } from "react";
import groq from "groq";
import { sanity } from "@/lib/sanity";

type Section = {
  sectionTitle: string;
  sectionSubtitle?: string;
  sectionDesc?: string;
  sectionCategory:
    | "الأطباء"
    | "التقيمات"
    | "الحجز"
    | "معرض الصور"
    | "خدمات"
    | "نبذة عنا"
    | "تواصل معنا";
};

export function useHomepageSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSections = useCallback(async () => {
    try {
      const query = groq`*[_type == "homepage"] {
        sectionTitle,
        sectionSubtitle,
        sectionDesc,
        sectionCategory
      }`;
      
      // Fetch with fresh data - useCdn: false in sanity.ts ensures no CDN cache
      // For client-side, we create a new client instance to ensure fresh fetch
      const data = await sanity.fetch(query);

      setSections(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching homepage:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchSections();
    
    // Refetch every 15 seconds to get latest updates (reduced from 30s for faster updates)
    const interval = setInterval(fetchSections, 15000);
    
    // Also listen for focus and visibility change events to refresh when user returns
    const handleFocus = () => {
      fetchSections();
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSections();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSections]);

  return { sections, isLoading, error, refetch: fetchSections };
}
