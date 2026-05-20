"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ContactFormState = {
  ok: boolean;
  fieldErrors?: {
    name?: string;
    email?: string;
    body?: string;
  };
  error?: string;
};

export async function sendMessage(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subjectRaw = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  const fieldErrors: ContactFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Please tell us your name.";
  if (!email || !email.includes("@"))
    fieldErrors.email = "A valid email is required.";
  if (body.length < 10)
    fieldErrors.body = "Please write at least 10 characters.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  try {
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject: subjectRaw.length > 0 ? subjectRaw : null,
        body,
      },
    });
  } catch (err) {
    console.error("Failed to save contact message", err);
    return {
      ok: false,
      error: "Something went wrong on our end. Please try again in a moment.",
    };
  }

  revalidatePath("/admin/messages");
  revalidatePath("/admin");

  return { ok: true };
}
