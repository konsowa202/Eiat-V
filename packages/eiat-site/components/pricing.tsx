"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TextAnimate } from "./magicui/text-animate";
import { sanity } from "@/lib/sanity";
import groq from "groq";
import PricingPlanCard from "./pricing-plan-card";

/**
 * Renders a skeleton loading state for a feature item with animated gradient background
 * @param index - Index of the feature item, used to determine width
 * @param delay - Animation delay in milliseconds
 */
const FeatureSkeleton = ({
  index,
  delay,
}: {
  index: number;
  delay: number;
}) => {
  const widths = ["w-4/5", "w-3/4", "w-5/6", "w-2/3", "w-3/5", "w-4/6"];
  return (
    <li
      className="flex items-start animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="w-5 h-5 ml-3 mt-0.5 rounded-full flex-shrink-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] "
        style={{ animationDelay: `${delay + 100}ms` }}
      />
      <div
        className={`h-4 ${
          widths[index % widths.length]
        } ml-3 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] `}
        style={{ animationDelay: `${delay + 200}ms` }}
      />
    </li>
  );
};

/**
 * Pricing section component that displays pricing plans with loading states
 * Fetches pricing data from Sanity CMS and falls back to static data if fetch fails
 */
export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPricing() {
      setLoading(true);
      try {
        const query = groq`*[_type == "plan"] {
          _id,
          name,
          price,
          period,
          description,
          features,
          popular,
          buttonText,
          buttonVariant
        }`;
        const content = await sanity.fetch(query);
        setPlans(Array.isArray(content) ? content : []);
      } catch (error) {
        console.error("Error fetching pricing data from Sanity:", error);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPricing();
  }, []);

  // Configuration for skeleton loading states
  const skeletonConfigs = [
    { popular: false, features: 4, delay: 0 },
    { popular: true, features: 6, delay: 200 },
    { popular: false, features: 5, delay: 400 },
  ];

  if (plans.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <svg
          className="w-16 h-16 mb-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
          لا يتواجد عروض حاليا
        </h1>
        <p className="text-gray-600">يرجى المحاولة مرة أخرى لاحقاً</p>
      </div>
    );
  }
  return (
    <section className="px-4 pt-40 !pb-20 text-right">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <TextAnimate
            className="section-title mb-4"
            animation="blurInDown"
            by="word"
            once
          >
            باقات علاجية مصمّمة لك بأسعار واضحة وجودة عالية
          </TextAnimate>
          <TextAnimate
            className="section-subtitle text-center mx-auto"
            animation="blurInDown"
            by="word"
            once
          >
            استكشف خياراتنا المرنة التي تغطي كل احتياجاتك الصحية — من الفحوصات
            الروتينية إلى العلاجات التجميلية المتقدّمة، مع التزام كامل بالوضوح،
            الجودة، وراحة البال في كل زيارة.
          </TextAnimate>
        </div>

        <div className="flex flex-col items-center lg:flex-row  flex-wrap gap-8 gap-y-12  justify-center max-w-7xl mx-auto">
          {loading
            ? skeletonConfigs.map((config, index) => (
                <Card
                  key={index}
                  className={`relative flex w-full max-w-sm flex-col justify-between transition-all duration-500 hover:shadow-xl ${
                    config.popular
                      ? "ring-2 ring-gray-300 shadow-lg scale-105 transform"
                      : "shadow-md hover:shadow-lg"
                  } ${
                    loading
                      ? "opacity-0 translate-y-4"
                      : "opacity-100 translate-y-0"
                  }`}
                  style={{
                    transitionDelay: `${config.delay}ms`,
                    animationDelay: `${config.delay}ms`,
                  }}
                >
                  {/* Popular badge skeleton */}
                  {config.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-200 to-gray-300 border-0 px-4 py-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] "
                          style={{ animationDelay: `${config.delay + 300}ms` }}
                        />
                        <div
                          className="h-3 w-16 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] "
                          style={{ animationDelay: `${config.delay + 400}ms` }}
                        />
                      </div>
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-6 space-y-4">
                    {/* Plan name */}
                    <div
                      className="h-7 w-32 mx-auto rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] "
                      style={{ animationDelay: `${config.delay + 100}ms` }}
                    />

                    {/* Price section */}
                    <div className="mt-6 flex items-baseline justify-center gap-2">
                      <div
                        className="h-12 w-24 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] "
                        style={{ animationDelay: `${config.delay + 200}ms` }}
                      />
                      <div
                        className="h-6 w-12 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] "
                        style={{ animationDelay: `${config.delay + 250}ms` }}
                      />
                    </div>

                    {/* Period */}
                    <div
                      className="h-4 w-20 mx-auto rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] "
                      style={{ animationDelay: `${config.delay + 300}ms` }}
                    />

                    {/* Description */}
                    <div className="space-y-2">
                      <div
                        className="h-4 w-4/5 mx-auto rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] "
                        style={{ animationDelay: `${config.delay + 350}ms` }}
                      />
                      <div
                        className="h-4 w-3/5 mx-auto rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] "
                        style={{ animationDelay: `${config.delay + 400}ms` }}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="pb-6 flex-grow">
                    <ul className="space-y-4">
                      {[...Array(config.features)].map((_, i) => (
                        <FeatureSkeleton
                          key={i}
                          index={i}
                          delay={config.delay + 500 + i * 100}
                        />
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-6">
                    <div
                      className={`h-12 w-full rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]  ${
                        config.popular
                          ? "from-gray-300 via-gray-400 to-gray-300"
                          : ""
                      }`}
                      style={{ animationDelay: `${config.delay + 800}ms` }}
                    />
                  </CardFooter>
                </Card>
              ))
            : plans.map((plan) => (
                <PricingPlanCard key={plan._id} plan={plan} />
              ))}
        </div>
      </div>
    </section>
  );
}
