"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import {
  issueVerificationToken,
  sendVerificationEmail,
} from "@/lib/auth/verification";
import {
  consumePasswordResetToken,
  issuePasswordResetToken,
  sendPasswordResetEmail,
} from "@/lib/auth/password-reset";
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResendVerificationSchema,
  ResetPasswordSchema,
  SignupSchema,
  type ForgotPasswordFormState,
  type LoginFormState,
  type ResendVerificationFormState,
  type ResetPasswordFormState,
  type SignupFormState,
} from "@/lib/validation/auth";

export async function signupAction(
  _state: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const ip = await getClientIp();
  // 10 chứ không phải 5: một tài khoản chưa xác nhận email chưa làm được gì,
  // nên trần này chỉ cần chặn việc tạo hàng loạt. Siết chặt hơn thì văn phòng
  // hay mạng di động dùng chung NAT sẽ chặn nhầm người thật.
  if (!(await checkRateLimit(`signup:${ip}`, 10, 60 * 60 * 1000))) {
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
  // Tài khoản sinh ra ở trạng thái chưa xác nhận: không đăng nhập được và
  // chưa có credit. Credit dùng thử chỉ được cộng lúc bấm link xác nhận
  // (`consumeVerificationToken`), để email bịa không đẻ ra credit.
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const token = await issueVerificationToken(user.id);
  const sent = await sendVerificationEmail({ to: email, name, token });

  // Gửi hỏng vẫn đi tiếp tới trang hướng dẫn thay vì báo lỗi rồi bỏ mặc: tài
  // khoản đã tạo nên đăng ký lại sẽ vướng "email đã đăng ký". Trang đó có nút
  // gửi lại, đó mới là đường thoát.
  redirect(sent ? "/verify-email/sent" : "/verify-email/sent?status=failed");
}

export async function resendVerificationAction(
  _state: ResendVerificationFormState,
  formData: FormData,
): Promise<ResendVerificationFormState> {
  const ip = await getClientIp();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  // Hai lưới: một chặn người gửi lại liên tục, một chặn việc mượn form này để
  // dội mail vào hộp thư người khác.
  const withinLimits =
    (await checkRateLimit(`verify-resend:ip:${ip}`, 10, 60 * 60 * 1000)) &&
    (await checkRateLimit(`verify-resend:email:${email}`, 3, 60 * 60 * 1000));
  if (!withinLimits) {
    return { message: "Bạn đã yêu cầu quá nhiều lần, vui lòng thử lại sau một giờ." };
  }

  const validatedFields = ResendVerificationSchema.safeParse({ email });
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { email: validatedFields.data.email },
  });

  // Không có tài khoản, hoặc đã xác nhận rồi: vẫn báo "đã gửi". Trả lời khác
  // nhau ở đây là biến form này thành công cụ dò xem email nào có tài khoản.
  if (!user || user.emailVerifiedAt) {
    return { sent: true };
  }

  const token = await issueVerificationToken(user.id);
  const sent = await sendVerificationEmail({ to: user.email, name: user.name, token });
  if (!sent) {
    return { message: "Chưa gửi được email lúc này. Vui lòng thử lại sau ít phút." };
  }

  return { sent: true };
}

export async function requestPasswordResetAction(
  _state: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const ip = await getClientIp();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  // Hai lưới: một chặn người bấm liên tục, một chặn việc mượn form này để dội
  // mail vào hộp thư người khác.
  const withinLimits =
    (await checkRateLimit(`reset-request:ip:${ip}`, 10, 60 * 60 * 1000)) &&
    (await checkRateLimit(`reset-request:email:${email}`, 3, 60 * 60 * 1000));
  if (!withinLimits) {
    return { message: "Bạn đã yêu cầu quá nhiều lần, vui lòng thử lại sau một giờ." };
  }

  const validatedFields = ForgotPasswordSchema.safeParse({ email });
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { email: validatedFields.data.email },
  });

  // Không có tài khoản thì vẫn báo "đã gửi", và cũng không báo lỗi khi Resend
  // từ chối. Mọi khác biệt trong câu trả lời ở đây đều là một cách để người lạ
  // dò xem địa chỉ nào có tài khoản trên site.
  if (user) {
    const token = await issuePasswordResetToken(user.id);
    await sendPasswordResetEmail({ to: user.email, name: user.name, token });
  }

  return { sent: true };
}

export async function resetPasswordAction(
  _state: ResetPasswordFormState,
  formData: FormData,
): Promise<ResetPasswordFormState> {
  const ip = await getClientIp();
  if (!(await checkRateLimit(`reset-submit:${ip}`, 20, 60 * 60 * 1000))) {
    return { message: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút." };
  }

  const validatedFields = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  // Token đi theo form chứ không đọc lại từ URL: action chạy ở server, không
  // thấy thanh địa chỉ của trình duyệt.
  const token = String(formData.get("token") ?? "");
  const result = await consumePasswordResetToken(token, validatedFields.data.password);

  if (result !== "reset") {
    return {
      message:
        result === "expired"
          ? "Link đã hết hạn. Hãy yêu cầu một link mới."
          : "Link không còn dùng được. Hãy yêu cầu một link mới.",
      tokenDead: true,
    };
  }

  // Không tự đăng nhập: người vừa đổi mật khẩu nên gõ lại nó một lần: đó là
  // lúc phát hiện mình nhớ nhầm, chứ không phải ba ngày sau.
  redirect("/login?reset=1");
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
      // `authorize` trả null cho cả mật khẩu sai lẫn tài khoản chưa xác nhận.
      // Phân biệt lại ở đây, nhưng chỉ sau khi mật khẩu đã đúng — nếu không,
      // form đăng nhập sẽ nói cho người lạ biết email nào có tài khoản.
      const user = await prisma.user.findUnique({
        where: { email: validatedFields.data.email },
        select: { passwordHash: true, emailVerifiedAt: true },
      });
      if (
        user &&
        user.passwordHash &&
        !user.emailVerifiedAt &&
        (await bcrypt.compare(validatedFields.data.password, user.passwordHash))
      ) {
        return {
          message: "Tài khoản chưa được xác nhận. Kiểm tra hộp thư của bạn để hoàn tất đăng ký.",
          needsVerification: true,
        };
      }
      // Tài khoản chỉ đăng nhập bằng Google cũng rơi vào câu này, dù mật khẩu
      // "không đúng" ở đó nghĩa là "chưa từng có". Nói thẳng ra thì form này
      // thành chỗ dò xem địa chỉ nào đăng ký bằng Google. Đường ra cho người
      // gõ nhầm chỗ là nút Google ngay bên trên, hoặc "Quên mật khẩu?" —
      // `consumePasswordResetToken` đặt mật khẩu cho cả tài khoản chưa có.
      return { message: "Email hoặc mật khẩu không đúng." };
    }
    throw error;
  }

  redirect("/?auth=login");
}

/**
 * Đẩy người dùng sang Google. Không nhận tham số và không có gì để kiểm tra:
 * `signIn` ném ra một redirect, mọi quyết định thật nằm ở callback `signIn`
 * trong `auth.ts` lúc Google gọi ngược về.
 *
 * `?auth=google` để trang chủ bắn event đăng nhập, cùng cơ chế với
 * `?auth=login` của form mật khẩu.
 */
export async function signInWithGoogleAction() {
  await signIn("google", { redirectTo: "/?auth=google" });
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
