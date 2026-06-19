const { createEmailTransporter, getEmailFromAddress, getFrontendUrl } = require("./email");

const EMAIL_TYPES = {
  REGISTRATION_WELCOME: "registration_welcome",
  REGISTRATION_PENDING: "registration_pending",
  PASSWORD_RESET_REQUEST: "password_reset_request",
  PASSWORD_RESET_SUCCESS: "password_reset_success",
  PAYMENT_SUCCESS: "payment_success",
  BOOKING_SUCCESS: "booking_success",
};

const BRAND = {
  name: "C-CBMS",
  tagline: "Café & Cinema Platform",
};

function buildBaseHtml({ title, preheader, bodyHtml }) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,sans-serif;color:#1f2937;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f6;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,118,110,0.08);">
          <tr>
            <td style="background:#0f766e;padding:24px 32px;color:#ffffff;">
              <div style="font-size:22px;font-weight:700;">🎬 ${BRAND.name}</div>
              <div style="font-size:13px;opacity:0.9;margin-top:4px;">${BRAND.tagline}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
              © ${new Date().getFullYear()} ${BRAND.name}. Email tự động, vui lòng không trả lời.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildButton(href, label) {
  return `
<a href="${href}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;margin-top:16px;">
  ${label}
</a>`;
}

const templates = {
  [EMAIL_TYPES.REGISTRATION_WELCOME]: ({ fullName, loginUrl }) => ({
    subject: `[${BRAND.name}] Chào mừng bạn đến với hệ thống`,
    html: buildBaseHtml({
      title: "Chào mừng",
      preheader: "Tài khoản của bạn đã được kích hoạt.",
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:24px;color:#111827;">Chào mừng, ${fullName}!</h1>
        <p style="line-height:1.6;margin:0 0 12px;">Tài khoản C-CBMS của bạn đã được tạo và kích hoạt thành công.</p>
        <p style="line-height:1.6;margin:0 0 12px;">Bạn có thể đăng nhập ngay để quản lý đặt chỗ, khách hàng và báo cáo.</p>
        ${buildButton(loginUrl, "Đăng nhập ngay")}
      `,
    }),
    text: `Chào mừng ${fullName}! Tài khoản C-CBMS đã được kích hoạt. Đăng nhập tại: ${loginUrl}`,
  }),

  [EMAIL_TYPES.REGISTRATION_PENDING]: ({ fullName, roleName }) => ({
    subject: `[${BRAND.name}] Yêu cầu đăng ký đã được ghi nhận`,
    html: buildBaseHtml({
      title: "Đăng ký thành công",
      preheader: "Tài khoản đang chờ phê duyệt.",
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:24px;color:#111827;">Xin chào, ${fullName}!</h1>
        <p style="line-height:1.6;margin:0 0 12px;">Cảm ơn bạn đã đăng ký tài khoản trên C-CBMS.</p>
        <p style="line-height:1.6;margin:0 0 12px;">
          Yêu cầu của bạn với vai trò <strong>${roleName}</strong> đang chờ quản trị viên phê duyệt.
          Chúng tôi sẽ gửi email thông báo khi tài khoản được kích hoạt.
        </p>
        <p style="line-height:1.6;margin:0;color:#6b7280;font-size:14px;">Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.</p>
      `,
    }),
    text: `Xin chào ${fullName}, yêu cầu đăng ký vai trò ${roleName} đang chờ phê duyệt trên C-CBMS.`,
  }),

  [EMAIL_TYPES.PASSWORD_RESET_REQUEST]: ({ fullName, resetUrl, expiresMinutes }) => ({
    subject: `[${BRAND.name}] Đặt lại mật khẩu`,
    html: buildBaseHtml({
      title: "Đặt lại mật khẩu",
      preheader: "Liên kết đặt lại mật khẩu có hiệu lực 15 phút.",
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:24px;color:#111827;">Đặt lại mật khẩu</h1>
        <p style="line-height:1.6;margin:0 0 12px;">Xin chào ${fullName || "bạn"},</p>
        <p style="line-height:1.6;margin:0 0 12px;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản C-CBMS của bạn.</p>
        <p style="line-height:1.6;margin:0 0 12px;">Liên kết có hiệu lực trong <strong>${expiresMinutes} phút</strong> và chỉ dùng một lần.</p>
        ${buildButton(resetUrl, "Đặt lại mật khẩu")}
        <p style="line-height:1.6;margin:16px 0 0;font-size:13px;color:#6b7280;word-break:break-all;">
          Nếu nút không hoạt động, copy link: ${resetUrl}
        </p>
        <p style="line-height:1.6;margin:16px 0 0;color:#6b7280;font-size:14px;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      `,
    }),
    text: `Đặt lại mật khẩu C-CBMS (hết hạn sau ${expiresMinutes} phút): ${resetUrl}`,
  }),

  [EMAIL_TYPES.PASSWORD_RESET_SUCCESS]: ({ fullName, loginUrl, resetAt }) => ({
    subject: `[${BRAND.name}] Mật khẩu đã được cập nhật`,
    html: buildBaseHtml({
      title: "Mật khẩu đã cập nhật",
      preheader: "Mật khẩu tài khoản của bạn vừa được thay đổi.",
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:24px;color:#111827;">Mật khẩu đã được cập nhật</h1>
        <p style="line-height:1.6;margin:0 0 12px;">Xin chào ${fullName || "bạn"},</p>
        <p style="line-height:1.6;margin:0 0 12px;">
          Mật khẩu tài khoản C-CBMS của bạn đã được đổi thành công lúc <strong>${resetAt}</strong>.
        </p>
        <p style="line-height:1.6;margin:0 0 12px;">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
        ${buildButton(loginUrl, "Đăng nhập")}
        <p style="line-height:1.6;margin:16px 0 0;color:#b45309;font-size:14px;">
          Nếu bạn không thực hiện thay đổi này, hãy liên hệ quản trị viên ngay lập tức.
        </p>
      `,
    }),
    text: `Mật khẩu C-CBMS đã được cập nhật lúc ${resetAt}. Đăng nhập: ${loginUrl}`,
  }),

  [EMAIL_TYPES.PAYMENT_SUCCESS]: ({ fullName, bookingId, amount, paymentMethod, date }) => ({
    subject: `[${BRAND.name}] Thanh toán thành công đơn đặt lịch #${bookingId}`,
    html: buildBaseHtml({
      title: "Thanh toán thành công",
      preheader: `Cảm ơn bạn đã thanh toán cho đơn hàng #${bookingId}.`,
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:24px;color:#111827;">Thanh toán thành công</h1>
        <p style="line-height:1.6;margin:0 0 12px;">Xin chào ${fullName},</p>
        <p style="line-height:1.6;margin:0 0 12px;">
          Chúng tôi xác nhận đã nhận được khoản thanh toán cho đơn đặt phòng phim/café của bạn:
        </p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin-bottom:16px;">
          <p style="margin:4px 0;"><strong>Mã đơn hàng:</strong> #${bookingId}</p>
          <p style="margin:4px 0;"><strong>Số tiền đã trả:</strong> ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)}</p>
          <p style="margin:4px 0;"><strong>Phương thức:</strong> ${paymentMethod}</p>
          <p style="margin:4px 0;"><strong>Thời gian:</strong> ${date}</p>
        </div>
        <p style="line-height:1.6;margin:0 0 12px;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
      `,
    }),
    text: `Chào ${fullName}, bạn đã thanh toán thành công ${amount} VND cho đơn đặt phòng #${bookingId} qua ${paymentMethod} lúc ${date}.`,
  }),

  [EMAIL_TYPES.BOOKING_SUCCESS]: ({ fullName, bookingId, branchName, roomName, bookingDate, timeRange, totalHours, finalTotal }) => ({
    subject: `[${BRAND.name}] Đặt phòng thành công - Mã đơn #${bookingId}`,
    html: buildBaseHtml({
      title: "Đặt phòng thành công",
      preheader: `Đơn đặt phòng #${bookingId} của bạn đã được ghi nhận thành công.`,
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:24px;color:#111827;">Đặt phòng thành công</h1>
        <p style="line-height:1.6;margin:0 0 12px;">Xin chào <strong>${fullName}</strong>,</p>
        <p style="line-height:1.6;margin:0 0 12px;">
          Chúng tôi xin thông báo đơn đặt phòng của bạn đã được ghi nhận thành công trên hệ thống ${BRAND.name}:
        </p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin-bottom:16px;">
          <p style="margin:4px 0;"><strong>Mã đơn hàng:</strong> #${bookingId}</p>
          <p style="margin:4px 0;"><strong>Chi nhánh:</strong> ${branchName}</p>
          <p style="margin:4px 0;"><strong>Phòng:</strong> ${roomName}</p>
          <p style="margin:4px 0;"><strong>Ngày đặt:</strong> ${bookingDate}</p>
          <p style="margin:4px 0;"><strong>Khung giờ:</strong> ${timeRange} (${totalHours} giờ)</p>
          <p style="margin:4px 0;"><strong>Tổng tiền:</strong> ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(finalTotal)}</p>
        </div>
        <p style="line-height:1.6;margin:0 0 12px;">Đơn đặt phòng của bạn hiện đang ở trạng thái <strong>Chờ xác nhận</strong> (Pending). Vui lòng hoàn tất thanh toán để giữ chỗ.</p>
        <p style="line-height:1.6;margin:0 0 12px;">Cảm ơn bạn đã lựa chọn dịch vụ của chúng tôi!</p>
      `,
    }),
    text: `Chào ${fullName}, đơn đặt phòng #${bookingId} tại ${branchName}, phòng ${roomName} ngày ${bookingDate} lúc ${timeRange} đã được tạo thành công với tổng tiền ${finalTotal} VND.`,
  }),
};

class EmailService {
  async send(type, { to, ...data }) {
    const templateBuilder = templates[type];

    if (!templateBuilder) {
      throw new Error(`Unsupported email type: ${type}`);
    }

    const { subject, html, text } = templateBuilder(data);
    const transporter = createEmailTransporter();

    if (!transporter) {
      console.warn(`[Email] SMTP chưa cấu hình — bỏ qua gửi email "${type}" tới ${to}`);
      return { sent: false, skipped: true, type, to };
    }

    await transporter.sendMail({
      from: getEmailFromAddress(),
      to,
      subject,
      html,
      text,
    });

    return { sent: true, skipped: false, type, to };
  }

  async sendRegistrationEmail({ to, fullName, isActive, roleName }) {
    const loginUrl = `${getFrontendUrl()}/login`;

    if (isActive) {
      return this.send(EMAIL_TYPES.REGISTRATION_WELCOME, { to, fullName, loginUrl });
    }

    return this.send(EMAIL_TYPES.REGISTRATION_PENDING, { to, fullName, roleName });
  }

  async sendPasswordResetRequestEmail({ to, fullName, token, expiresMinutes = 15 }) {
    const resetUrl = `${getFrontendUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    return this.send(EMAIL_TYPES.PASSWORD_RESET_REQUEST, {
      to,
      fullName,
      resetUrl,
      expiresMinutes,
    });
  }

  async sendPasswordResetSuccessEmail({ to, fullName }) {
    const loginUrl = `${getFrontendUrl()}/login`;
    const resetAt = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    return this.send(EMAIL_TYPES.PASSWORD_RESET_SUCCESS, { to, fullName, loginUrl, resetAt });
  }

  async sendPaymentSuccessEmail({ to, fullName, booking, payment }) {
    const amount = payment.amountPaid || payment.amount;
    const paymentMethod = payment.method === "payos" ? "Chuyển khoản VietQR (PayOS)" : payment.method;
    const date = (payment.paidAt || new Date()).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const bookingId = booking._id.toString();
    return this.send(EMAIL_TYPES.PAYMENT_SUCCESS, {
      to,
      fullName,
      bookingId,
      amount,
      paymentMethod,
      date,
    });
  }

  async sendBookingSuccessEmail({ to, fullName, booking }) {
    const bookingId = booking._id.toString();
    const branchName = booking.branchId?.name || "Chi nhánh C-CBMS";
    const roomName = booking.roomId?.roomName || "Phòng C-CBMS";
    
    const d = new Date(booking.bookingDate);
    const dateStr = d.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    const timeRange = `${booking.startTime} - ${booking.endTime}`;
    const totalHours = booking.totalHours;
    const finalTotal = booking.finalTotal;

    return this.send(EMAIL_TYPES.BOOKING_SUCCESS, {
      to,
      fullName,
      bookingId,
      branchName,
      roomName,
      bookingDate: dateStr,
      timeRange,
      totalHours,
      finalTotal,
    });
  }
}

module.exports = {
  EmailService: new EmailService(),
  EMAIL_TYPES,
};
