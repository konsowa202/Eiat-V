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

        // Fetch fresh data without cache
        const data = await sanity.fetch<ClinicInfo>(query, {}, {
          cache: 'no-store' // Always fetch fresh data
        });
        setClinicInfo(data);
      } catch (err) {
        console.error("Error fetching clinic info:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicInfo();
    
    // Refetch every 30 seconds to get latest updates
    const interval = setInterval(fetchClinicInfo, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { clinicInfo, isLoading, error };
}
