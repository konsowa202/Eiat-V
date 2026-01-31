"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { TextAnimate } from "./magicui/text-animate";

// ✅ Validation schema using Zod
const contactFormSchema = z.object({
  firstName: z.string().trim().min(2, "الاسم الأول مطلوب"),
  lastName: z.string().trim().min(2, "الاسم الأخير مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(10, "رقم الهاتف غير صالح"),
  subject: z.string().trim().min(3, "يرجى تحديد الموضوع"),
  message: z.string().trim().min(10, "يرجى كتابة رسالة مفصلة"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Renders a styled card component that includes a full-featured contact form.
 * - Validates using Zod + react-hook-form.
 * - Displays inline error messages.
 * - Submits data to a backend API endpoint `/api/send-email`.
 * - Includes `TextAnimate` for subtle entrance effects.
 */
export const ContactFormCard = () => {
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  /**
   * Handles form submission
   * Sends contact form data to the `/api/send-email` endpoint via POST.
   */
  const onSubmit = async (data: ContactFormData) => {
    try {
      // Transform ContactFormData to match /api/send-email expectations
      const payload = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        message: `Subject: ${data.subject}\nPhone: ${data.phone}\nMessage: ${data.message}`,
      };

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "فشل في إرسال الرسالة");
      }

      toast.success("تم إرسال الرسالة بنجاح!");
      reset(); // clear form
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إرسال الرسالة."
      );
    }
  };

  return (
    <Card>
      {/* ======= Header ======= */}
      <CardHeader>
        <CardTitle className="text-foreground">
          <TextAnimate animation="blurInUp" by="word" once>
            أرسل لنا رسالة
          </TextAnimate>
        </CardTitle>
        <CardDescription className="text-subtitle">
          املأ النموذج التالي وسنعود إليك في أقرب وقت ممكن.
        </CardDescription>
      </CardHeader>

      {/* ======= Form Content ======= */}
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">الاسم الأول</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-sm text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">الاسم الأخير</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input id="phone" type="tel" {...register("phone")} />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">الموضوع</Label>
            <Input id="subject" {...register("subject")} />
            {errors.subject && (
              <p className="text-sm text-red-500">{errors.subject.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">الرسالة</Label>
            <Textarea
              id="message"
              className="min-h-[120px]"
              {...register("message")}
            />
            {errors.message && (
              <p className="text-sm text-red-500">{errors.message.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "جاري الإرسال..." : "إرسال الرسالة"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
