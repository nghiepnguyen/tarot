import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { isGoogleLoginEnabled, linkGoogleAccount } from "@/lib/auth/google";
import { LoginSchema } from "@/lib/validation/auth";

/**
 * Khoảng giữa hai lần đối chiếu `passwordChangedAt` với database.
 *
 * Session là JWT, không tra database ở mỗi request — nhanh, nhưng nghĩa là
 * không có chỗ nào để "thu hồi" một phiên. Đối chiếu ở mọi lần `auth()` thì
 * mất đúng cái nhanh đó (Header đã tra một lần rồi, và `auth()` được gọi vài
 * lần mỗi request). Năm phút là chỗ đứng giữa: đổi mật khẩu hạ được phiên cũ
 * trong vòng năm phút, mà mỗi người chỉ tốn thêm một truy vấn khoá chính mỗi
 * năm phút.
 *
 * Cùng truy vấn đó đọc luôn `role`, nên khoảng này cũng là cận trên cho độ trễ
 * lan quyền quản trị: cấp hay thu quyền có hiệu lực trên token trong vòng năm
 * phút, hoặc ngay lập tức nếu đăng xuất rồi đăng nhập lại. Token chỉ là bản
 * cache — mọi thao tác chạm dữ liệu vẫn đi qua `lib/auth/admin.ts`, chỗ đọc
 * thẳng database, nên thu quyền chặn được thao tác ngay không cần chờ.
 */
const PASSWORD_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        // Tài khoản chỉ có Google thì `passwordHash` là null và không có mật
        // khẩu nào khớp được. Phải chặn trước `bcrypt.compare`: hàm đó ném lỗi
        // khi nhận null chứ không trả false.
        if (!user.passwordHash) return null;

        const passwordsMatch = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!passwordsMatch) return null;

        // Chưa bấm link xác nhận thì chưa có tài khoản dùng được. Chặn ở đây
        // để mọi đường đăng nhập đều đi qua cùng một luật; `loginAction` chỉ
        // lo phân biệt thông báo cho người dùng.
        if (!user.emailVerifiedAt) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          passwordChangedAt: user.passwordChangedAt,
          role: user.role,
        };
      },
    }),
    // Thiếu `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` thì không đăng ký provider:
    // `/api/auth/signin/google` trả 404 thay vì 500, và giao diện hỏi cùng một
    // biến môi trường trước khi vẽ nút (xem `isGoogleLoginEnabled`).
    ...(isGoogleLoginEnabled()
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    /**
     * Chốt duy nhất của đường Google, và nó chỉ hỏi một câu: Google có xác
     * nhận địa chỉ email này là của người đang đăng nhập không?
     *
     * Câu đó quyết định tất cả, vì `linkGoogleAccount` gắn danh tính Google
     * vào tài khoản trùng email. Không có `email_verified`, bất kỳ ai dựng
     * được một tài khoản Google mang địa chỉ người khác cũng đăng nhập được
     * vào tài khoản của người đó ở đây.
     */
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      return profile?.email_verified === true && typeof profile.email === "string";
    },
    async jwt({ token, user, account, profile }) {
      // Với Google, `user.id` là `sub` bên Google chứ không phải id trong
      // database — nên phải đi qua `linkGoogleAccount` để lấy đúng tài khoản
      // (tạo mới, hoặc gắn vào tài khoản email sẵn có). Từ dòng return trở đi
      // token không còn khác gì token của người đăng nhập bằng mật khẩu: các
      // lần làm mới sau đó dùng chung một đường ở dưới.
      if (user && account?.provider === "google") {
        const linked = await linkGoogleAccount({
          googleId: String(profile?.sub ?? account.providerAccountId),
          email: String(profile?.email),
          name: typeof profile?.name === "string" ? profile.name : null,
        });
        token.id = linked.id;
        token.pwdAt = linked.passwordChangedAt?.getTime() ?? 0;
        token.role = linked.role;
        token.pwdCheckedAt = Date.now();
        return token;
      }

      if (user) {
        token.id = user.id as string;
        token.pwdAt = user.passwordChangedAt?.getTime() ?? 0;
        token.role = user.role ?? "USER";
        token.pwdCheckedAt = Date.now();
        return token;
      }

      // Các trường tự đặt trên token về đây dưới dạng `unknown` — khai báo bổ
      // sung cho `@auth/core/jwt` không tới được chỗ này trong cây pnpm, nên
      // thu hẹp kiểu tại chỗ, đúng như `token.id` vẫn làm.
      const checkedAt = typeof token.pwdCheckedAt === "number" ? token.pwdCheckedAt : 0;
      if (Date.now() - checkedAt < PASSWORD_CHECK_INTERVAL_MS) {
        return token;
      }

      const current = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { passwordChangedAt: true, role: true },
      });

      // Trả `null` là cách Auth.js hạ phiên: cookie session bị xoá và request
      // này coi như chưa đăng nhập.
      if (!current) return null;

      // Token phát trước khi có `pwdAt` không mang giá trị nào; đọc nó là 0 —
      // đúng bằng giá trị của một tài khoản chưa từng đổi mật khẩu — để lần
      // deploy đầu tiên không đá mọi người đang đăng nhập ra ngoài.
      const knownPwdAt = typeof token.pwdAt === "number" ? token.pwdAt : 0;
      if ((current.passwordChangedAt?.getTime() ?? 0) !== knownPwdAt) {
        return null;
      }

      token.role = current.role;
      token.pwdCheckedAt = Date.now();
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      // Token phát trước khi có cột `role` không mang trường này; đọc là USER
      // để lần deploy đầu tiên không biến người đang đăng nhập thành admin.
      session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
      return session;
    },
  },
});
