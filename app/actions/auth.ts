"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { FREE_TRIAL_CREDITS } from "@/lib/ai/interpretation";
import {
  LoginSchema,
  SignupSchema,
  type LoginFormState,
  type SignupFormState,
} from "@/lib/validation/auth";

export async function signupAction(
  _state: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const ip = await getClientIp();
  if (!(await checkRateLimit(`signup:${ip}`, 5, 60 * 60 * 1000))) {
    return { message: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút." };
  }

  const validatedFields = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password } = validatedFields.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["Email này đã được đăng ký."] } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        credits: FREE_TRIAL_CREDITS,
        freeCreditsGrantedAt: new Date(),
      },
    });
    await tx.creditTransaction.create({
      data: {
        userId: user.id,
        type: "FREE_GRANT",
        amount: FREE_TRIAL_CREDITS,
        balanceAfter: FREE_TRIAL_CREDITS,
      },
    });
  });

  await signIn("credentials", { email, password, redirect: false });
  // ?auth=... để client bắn conversion GA4; AuthSuccessTracker xoá param ngay sau đó.
  redirect("/?auth=signup");
}

export async function loginAction(
  _state: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const ip = await getClientIp();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!(await checkRateLimit(`login:${ip}:${email}`, 10, 15 * 60 * 1000))) {
    return { message: "Đăng nhập sai quá nhiều lần, vui lòng thử lại sau." };
  }

  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Email hoặc mật khẩu không đúng." };
    }
    throw error;
  }

  redirect("/?auth=login");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const name = String(formData.get("name") ?? "").trim().slice(0, 60);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name || null },
  });
}
