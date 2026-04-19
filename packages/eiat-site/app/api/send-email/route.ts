// app/api/send-email/route.ts
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

/**
 * Handles POST requests to send an email using the provided request body.
 *
 * Expects a JSON payload containing `name`, `email`, and `message` fields.
 * Utilizes Nodemailer to send an email from the provided sender's email address
 * to the configured recipient email address (`EMAIL_USER` environment variable).
 *
 * @param req - The incoming HTTP request containing the email data in JSON format.
 * @returns A JSON response indicating success or failure of the email sending operation.
 *
 * @throws Returns a 500 status code with an error message if the email fails to send.
 *
 * @example
 *  Example request body:
 *  {
 *    "name": "John Doe",
 *    "email": "john@example.com",
 *    "message": "Hello, this is a test message."
 *  }
 */
export async function POST(req: Request) {
  const { name, email, message } = await req.json();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // 👈 this ignores invalid/self-signed certs
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: `New message from ${name}`,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
