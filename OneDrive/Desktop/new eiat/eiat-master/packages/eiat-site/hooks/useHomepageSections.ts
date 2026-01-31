"use client";
// hooks/useHomepageSections.ts
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const query = groq`*[_type == "homepage"] {
          sectionTitle,
          sectionSubtitle,
          sectionDesc,
          sectionCategory
        }`;
        const data = await sanity.fetch(query);

        setSections(data);
      } catch (err) {
        console.error("Error fetching homepage:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSections();
  }, []);

  return { sections, isLoading, error };
}
