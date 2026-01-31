"use client";

import { useEffect, useState } from "react";
import groq from "groq";
import { sanity } from "@/lib/sanity";

type Phone = {
  phoneNumber: string;
};

type ClinicInfo = {
  address: string;
  phones: Phone[];
  workingDaysAndHours: string;

  email: string;
};

export function useClinicInfo() {
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClinicInfo = async () => {
      try {
        // Fixed ID query if it's a singleton
        const query = groq`*[_type == "clinicInfo"][0]{
          address,
          phones[],
          workingDaysAndHours,
          email,
        
        }`;

        const data = await sanity.fetch<ClinicInfo>(query);
        setClinicInfo(data);
      } catch (err) {
        console.error("Error fetching clinic info:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicInfo();
  }, []);

  return { clinicInfo, isLoading, error };
}
