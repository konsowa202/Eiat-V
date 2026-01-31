import { MapPin, Phone, Mail, Clock } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { TextAnimate } from "./magicui/text-animate";
import Link from "next/link";
import { useClinicInfo } from "@/hooks/useClinicInfo";

/**
 * A visual card component displaying clinic contact information.
 * - Includes address, phone, email, and working hours.
 * - Uses animated text via `TextAnimate`.
 * - Built with reusable UI components for consistency.
 */
export const ContactInformationCard = () => {
  const { clinicInfo, error } = useClinicInfo();
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Card>
      {/* ======= Header ======= */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <TextAnimate animation="blurInUp" by="word" once>
            عيادتنا
          </TextAnimate>
        </CardTitle>
        <CardDescription className="text-subtitle">
          <TextAnimate animation="blurInUp" by="word" once>
            يسعدنا زيارتكم في مقر عيادتنا
          </TextAnimate>
        </CardDescription>
      </CardHeader>

      {/* ======= Content ======= */}
      <CardContent className="space-y-5">
        {/* 📍 Address Section */}
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-subtitle mt-0.5" />
          <div>
            {clinicInfo?.address && (
              <p className="text-sm text-gray-500">
                {clinicInfo.address} <br />
                المملكة العربية السعودية
              </p>
            )}
          </div>
        </div>

        {/* 📞 Phone Number */}
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-subtitle" />
          <div>
            <div className="flex flex-col">
              {clinicInfo?.phones.map((phone, i) => (
                <TextAnimate
                  className="text-gray-500"
                  animation="blurInUp"
                  by="word"
                  once
                  key={i}
                >
                  {phone.phoneNumber}
                </TextAnimate>
              ))}
            </div>
            {clinicInfo?.workingDaysAndHours && (
              <p className="text-sm text-gray-500">
                {clinicInfo.workingDaysAndHours}
              </p>
            )}
          </div>
        </div>

        {/* ✉️ Email Address */}
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-subtitle" />
          <div>
            {clinicInfo?.email && (
              <Link
                href={`mailto:${clinicInfo.email}`}
                className="font-medium text-foreground hover:underline block"
              >
                {clinicInfo.email}
              </Link>
            )}
            <p className="text-sm text-gray-500">نرد خلال أقل من ٢٤ ساعة</p>
          </div>
        </div>

        {/* 🕒 Working Hours */}
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-subtitle mt-0.5" />
          <div>
            <p className="font-medium text-foreground">ساعات العمل</p>
            {clinicInfo?.workingDaysAndHours && (
              <p className="text-sm text-gray-500">
                {clinicInfo.workingDaysAndHours}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
