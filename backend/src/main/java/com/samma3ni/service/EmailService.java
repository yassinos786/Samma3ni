package com.samma3ni.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends a real Gmail confirmation email after successful Google OAuth login.
     * Called from AuthController POST /api/auth/send-welcome-email
     */
    public boolean sendGoogleWelcomeEmail(String toEmail, String userName) {
        if (!mailEnabled) {
            log.info("[SAMMA3NI EMAIL] Mail disabled - would have sent welcome email to {} ({})", toEmail, userName);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Samma3ni | سَمَّعْنِي");
            helper.setTo(toEmail);
            helper.setSubject("Connexion Google confirmee - Samma3ni");

            String htmlBody = buildWelcomeHtml(userName, toEmail);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("[SAMMA3NI EMAIL] Welcome email sent successfully to {}", toEmail);
            return true;

        } catch (MessagingException e) {
            log.error("[SAMMA3NI EMAIL] Failed to send welcome email to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("[SAMMA3NI EMAIL] Unexpected error sending email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private String buildWelcomeHtml(String name, String email) {
        return """
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>مرحباً بك في سَمَّعْنِي</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #09090b; }
              </style>
            </head>
            <body>
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#09090b; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.4);">
                      
                      <!-- Header Gradient -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #000 0%%, #1a1a2e 50%%, #000 100%%); padding: 40px 32px; text-align:center;">
                          <table width="60" height="60" cellpadding="0" cellspacing="0" style="margin: 0 auto; background:#000; border-radius:50%; border:3px solid #1ed760;">
                            <tr><td align="center" style="color:#1ed760; font-size:28px; line-height:60px;">♪</td></tr>
                          </table>
                          <h1 style="color:#ffffff; font-size:32px; font-weight:900; margin-top:16px; letter-spacing:-0.5px;">samma3ni</h1>
                          <p style="color:#1ed760; font-size:14px; margin-top:4px; letter-spacing:2px;">سَمَّعْنِي</p>
                        </td>
                      </tr>
                      
                      <!-- Body -->
                      <tr>
                        <td style="padding: 36px 32px;">
                          
                          <!-- Success Badge -->
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center">
                                <div style="display:inline-block; background:#dcfce7; border:1.5px solid #86efac; border-radius:9999px; padding:8px 20px; color:#15803d; font-size:13px; font-weight:700;">
                                  Connexion Google réussie
                                </div>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="color:#18181b; font-size:24px; font-weight:800; text-align:center; margin: 24px 0 8px;">
                            Bienvenue, %s !
                          </p>
                          <p style="color:#71717a; font-size:14px; text-align:center; margin-bottom:28px;">
                            Ton compte Google <strong style="color:#2563eb;">%s</strong> est maintenant lié à Samma3ni.
                          </p>
                          
                          <!-- Feature Cards -->
                          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border-radius:16px; padding:20px; border:1px solid #e4e4e7;">
                            <tr>
                              <td style="padding:8px 0; color:#18181b; font-size:14px;">
                                • <strong>Écoute illimitée</strong> - Plus aucune limite de chansons
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:8px 0; color:#18181b; font-size:14px;">
                                • <strong>Tes favoris</strong> - Sauvegarde tes morceaux préférés
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:8px 0; color:#18181b; font-size:14px;">
                                • <strong>Playlists</strong> - Crée et gère tes playlists musicales
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:8px 0; color:#18181b; font-size:14px;">
                                • <strong>Sync multi-appareils</strong> - Retrouve ta musique partout
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Arabic message -->
                          <p style="color:#18181b; font-size:18px; font-weight:700; text-align:center; margin: 28px 0 8px; direction:rtl;">
                            أهلاً وسهلاً بك في سَمَّعْنِي يا %s
                          </p>
                          <p style="color:#71717a; font-size:13px; text-align:center; direction:rtl; margin-bottom:28px;">
                            الآن يمكنك الاستماع إلى موسيقاك المفضلة بلا حدود
                          </p>
                          
                          <!-- CTA Button -->
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center">
                                <a href="http://localhost:4200" style="display:inline-block; background:#000; color:#fff; text-decoration:none; padding:14px 36px; border-radius:9999px; font-size:15px; font-weight:800; letter-spacing:0.5px;">
                                  Ouvrir Samma3ni
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background:#f4f4f5; padding:20px 32px; text-align:center; border-top:1px solid #e4e4e7;">
                          <p style="color:#71717a; font-size:12px; line-height:1.6;">
                            Tu reçois cet email car tu t'es connecté(e) à <strong>Samma3ni</strong> via Google.<br>
                            Si ce n'est pas toi, ignore ce message. | سَمَّعْنِي &copy; 2025
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(name, email, name);
    }
}
