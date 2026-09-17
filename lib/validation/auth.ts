import { z } from "zod";

const EmailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Email không hợp lệ."));

// Một chỗ định nghĩa duy nhất cho luật mật khẩu: đăng ký và đặt lại mật khẩu
// phải cùng một luật, nếu không thì đường đặt lại thành cửa sau để đặt một mật
// khẩu mà đường đăng ký đã từ chối.
const PasswordField = z
  .string()
  .min(8, "Mật khẩu cần ít nhất 8 ký tự.")
  .regex(/[a-zA-Z]/, "Mật khẩu cần ít nhất một chữ cái.")
  .regex(/[0-9]/, "Mật khẩu cần ít nhất một chữ số.");

export const SignupSchema = z.object({
  name: z.string().trim().min(2, "Tên cần ít nhất 2 ký tự.").max(60),
  email: EmailField,
  password: PasswordField,
});

export const ResendVerificationSchema = z.object({
  email: EmailField,
});

export const ForgotPasswordSchema = z.object({
  email: EmailField,
});

export const ResetPasswordSchema = z
  .object({
    password: PasswordField,
    confirmPassword: z.string(),
  })
  .refine((fields) => fields.password === fields.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp.",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: EmailField,
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export type SignupFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
      /** Đúng mật khẩu nhưng tài khoản chưa xác nhận email — form hiện nút gửi lại. */
      needsVerification?: boolean;
    }
  | undefined;

export type ForgotPasswordFormState =
  | {
      errors?: {
        email?: string[];
      };
      message?: string;
      sent?: boolean;
    }
  | undefined;

export type ResetPasswordFormState =
  | {
      errors?: {
        password?: string[];
        confirmPassword?: string[];
      };
      message?: string;
      /** Link chết giữa chừng — form biến mất, nhường chỗ cho đường xin link mới. */
      tokenDead?: boolean;
    }
  | undefined;

export type ResendVerificationFormState =
  | {
      errors?: {
        email?: string[];
      };
      message?: string;
      sent?: boolean;
    }
  | undefined;
