import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = process.env.MAIL_FROM || "Foodi <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Foodi — Đặt lại mật khẩu",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Đặt lại mật khẩu Foodi</h2>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu. Bấm nút bên dưới (link có hiệu lực 30 phút):</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${resetUrl}" style="background:#006c49;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Đặt mật khẩu mới
          </a>
        </p>
        <p style="color:#666;font-size:13px">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>
    `,
  });

  if (error) {
    console.error("[Mail] Gửi email thất bại:", error);
    throw new Error("Không gửi được email. Vui lòng thử lại sau.");
  }
}