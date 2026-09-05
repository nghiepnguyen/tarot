import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().trim().min(2, "Tên cần ít nhất 2 ký tự.").max(60),
  email: z.email("Email không hợp lệ.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Mật khẩu cần ít nhất 8 ký tự.")
    .regex(/[a-zA-Z]/, "Mật khẩu cần ít nhất một chữ cái.")
    .regex(/[0-9]/, "Mật khẩu cần ít nhất một chữ số."),
});

export const LoginSchema = z.object({
  email: z.email("Email không hợp lệ.").trim().toLowerCase(),
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
    }
  | undefined;
