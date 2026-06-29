package com.poll.email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
@Service @RequiredArgsConstructor @Slf4j
public class EmailService {
    private final JavaMailSender mailSender;
    @Value("${app.email.from}")    private String from;
    @Value("${app.frontend.url}") private String frontendUrl;

    @Async public void sendWelcomeVerification(String to, String name, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        log.info("\n\n=== [Developer Fallback] Verification Link: {} ===\n\n", link);
        send(to, "Verify your Ditto account", """
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <div style="background:#5b4fe9;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
                <h1 style="color:#fff;margin:0;font-size:24px">Welcome to Ditto</h1>
                <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px">India's first Aadhaar-verified polling platform</p>
              </div>
              <h2 style="font-size:18px;color:#1a1830">Hi %s 👋</h2>
              <p style="color:#555;line-height:1.6">Please verify your email to activate your account.</p>
              <div style="text-align:center;margin:28px 0">
                <a href="%s" style="background:#5b4fe9;color:#fff;padding:13px 32px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">Verify my email</a>
              </div>
              <p style="color:#999;font-size:12px;text-align:center">This link expires in 24 hours.</p>
              <p style="color:#bbb;font-size:11px;text-align:center">Ditto — One person. One vote. Always.</p>
            </div>""".formatted(name, link));
    }

    @Async public void sendPollCreated(String to, String ownerName, String question, String pollId) {
        String link = frontendUrl + "/poll/" + pollId;
        send(to, "Your poll is live — " + question, """
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <div style="background:#1a1830;border-radius:12px;padding:20px;margin-bottom:20px">
                <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 6px">Your poll is live</p>
                <p style="color:#fff;font-size:17px;font-weight:600;margin:0">%s</p>
              </div>
              <h2 style="font-size:17px;color:#1a1830">Hi %s, your poll is ready!</h2>
              <p style="color:#555;line-height:1.6">Share the link below with your audience.</p>
              <div style="text-align:center;margin:20px 0">
                <a href="%s" style="background:#5b4fe9;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">Share poll link</a>
              </div>
              <p style="color:#bbb;font-size:11px;text-align:center">Ditto — One person. One vote. Always.</p>
            </div>""".formatted(question, ownerName, link));
    }

    @Async public void sendPollInvite(String to, String fromName, String question, String pollId) {
        String link = frontendUrl + "/poll/" + pollId;
        send(to, fromName + " invited you to vote on Ditto", """
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <div style="background:#5b4fe9;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">
                <p style="color:rgba(255,255,255,0.7);margin:0 0 6px;font-size:12px">%s invited you to vote on</p>
                <p style="color:#fff;font-size:17px;font-weight:600;margin:0">%s</p>
              </div>
              <div style="text-align:center;margin:24px 0">
                <a href="%s" style="background:#5b4fe9;color:#fff;padding:13px 32px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">Vote now</a>
              </div>
              <p style="color:#bbb;font-size:11px;text-align:center">Ditto — One person. One vote. Always.</p>
            </div>""".formatted(fromName, question, link));
    }

    @Async public void sendPasswordReset(String to, String name, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        send(to, "Reset your Ditto password", """
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <h2 style="font-size:18px;color:#1a1830">Reset your Ditto password</h2>
              <p style="color:#555;line-height:1.6">Hi %s, click below to reset your password. The link expires in 1 hour.</p>
              <div style="text-align:center;margin:28px 0">
                <a href="%s" style="background:#5b4fe9;color:#fff;padding:13px 32px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">Reset password</a>
              </div>
            </div>""".formatted(name, link));
    }

    private void send(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setFrom(from); h.setTo(to); h.setSubject(subject); h.setText(html, true);
            mailSender.send(msg);
        } catch (Exception e) { log.error("Email failed to {}: {}", to, e.getMessage()); }
    }
}
