/**
 * PricingPlanCard component renders a single pricing plan card with features,
 * price, period, and a call-to-action button. It visually emphasizes popular plans.
 *
 * @param {Object} props
 * @param {Plan} props.plan - An object representing the pricing plan details.
 *
 * Plan interface example:
 * {
 *   _id: string;           - Unique identifier for the plan
 *   name: string;          - Display name of the plan
 *   price: string|number;  - Price amount (will be converted to number)
 *   period: string;        - Billing period (e.g., "monthly", "yearly")
 *   description: string;   - Short description of the plan
 *   features: string[];    - Array of feature descriptions
 *   popular: boolean;      - Whether to highlight this as a popular plan
 *   buttonText: string;    - Text to display on the CTA button
 *   buttonVariant: string; - Button styling variant from the design system
 * }
 *
 * @example
 * const plan = {
 *   _id: "basic",
 *   name: "Basic Plan",
 *   price: "99",
 *   period: "monthly",
 *   description: "Perfect for starters",
 *   features: ["Feature 1", "Feature 2"],
 *   popular: false,
 *   buttonText: "Get Started",
 *   buttonVariant: "default"
 * };
 *
 * <PricingPlanCard plan={plan} />
 */

import { Badge, Star, Check } from "lucide-react";
import React from "react";
import { NumberTicker } from "./magicui/number-ticker";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

/**
 * Renders a styled card for a pricing plan with conditional highlighting for popular plans.
 * Features responsive design, animated number transitions, and RTL support.
 *
 * @component
 * @param {Object} props
 * @param {Plan} props.plan - The pricing plan configuration object
 * @returns {JSX.Element} A card component displaying the pricing plan details
 */
const PricingPlanCard = ({ plan }: { plan: Plan }) => {
  const router = useRouter();

  return (
    <Card
      key={plan._id}
      className={`relative w-full max-w-sm flex flex-col justify-between ${
        plan.popular
          ? "ring-2 ring-subbg-subtitle shadow-lg scale-105"
          : "shadow-md"
      }`}
    >
      {/* Badge shown only if the plan is marked as popular */}
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-subtitle rounded-lg">
          <Star className="w-3 h-3 ml-1" />
        </Badge>
      )}

      {/* Header section with plan name, price, and description */}
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-xl font-bold text-gray-900">
          <strong>{plan.name}</strong>
        </CardTitle>

        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-gray-900">
            <NumberTicker value={parseFloat(plan.price)} />
          </span>
          <span className="text-xl font-semibold text-gray-600">ريال</span>
        </div>

        <p className="text-sm text-gray-500 font-semibold">{plan.period}</p>
        <CardDescription className="mt-2 text-gray-500 font-medium">
          <strong>{plan.description}</strong>
        </CardDescription>
      </CardHeader>

      {/* List of features */}
      <CardContent className="pb-6">
        <ul className="space-y-3">
          {plan.features.map((feature, featureIndex) => (
            <li key={featureIndex} className="flex items-start">
              <Check className="w-5 h-5 text-subtitle ml-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 text-sm font-semibold">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      {/* CTA Button */}
      <CardFooter>
        <Button
          variant={plan.buttonVariant}
          onClick={() => router.push("/#booking")}
          className={`w-full cursor-pointer ${
            plan.popular
              ? "bg-subtitle hover:bg-subtitle/80 text-white font-bold"
              : "font-bold"
          }`}
          size="lg"
        >
          {plan.buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingPlanCard;
