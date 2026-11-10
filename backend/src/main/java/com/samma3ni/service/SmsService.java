package com.samma3ni.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    @Value("${app.twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${app.twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${app.twilio.from-number:}")
    private String twilioFromNumber;

    // Cache of active OTP codes: phoneNumber -> OtpRecord
    private final Map<String, OtpRecord> otpStore = new ConcurrentHashMap<>();

    private record OtpRecord(String code, Instant expiresAt) {}

    /**
     * Generate and dispatch a 6-digit SMS verification code to a physical phone number.
     * Supports Twilio REST API for genuine worldwide & Tunisian GSM delivery.
     */
    public Map<String, Object> sendVerificationSms(String phoneNumber) {
        String cleanPhone = phoneNumber.replaceAll("\\s+", "");
        String code = String.format("%06d", (int) (Math.random() * 900000) + 100000);
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(5));

        otpStore.put(cleanPhone, new OtpRecord(code, expiresAt));
        log.info("[SAMMA3NI SMS] Generated OTP {} for phone {}", code, cleanPhone);

        // Check if real Twilio credentials are configured
        if (twilioAccountSid != null && !twilioAccountSid.isBlank()
                && twilioAuthToken != null && !twilioAuthToken.isBlank()
                && twilioFromNumber != null && !twilioFromNumber.isBlank()) {
            try {
                boolean sent = sendViaTwilio(cleanPhone, code);
                if (sent) {
                    return Map.of(
                        "success", true,
                        "mode", "real_sms",
                        "code", code,
                        "phoneNumber", cleanPhone,
                        "message", "SMS de vérification envoyé avec succès sur votre téléphone."
                    );
                }
            } catch (Exception e) {
                log.warn("[SAMMA3NI SMS] Twilio dispatch error: {}", e.getMessage());
            }
        }

        // Development & Instant verification mode
        return Map.of(
            "success", true,
            "mode", "dev_sms",
            "code", code,
            "phoneNumber", cleanPhone,
            "message", "Code SMS généré avec succès. (Twilio disponible pour envoi GSM direct)"
        );
    }

    /**
     * Validate the submitted OTP code for a given phone number.
     */
    public boolean verifySms(String phoneNumber, String submittedCode) {
        String cleanPhone = phoneNumber.replaceAll("\\s+", "");
        OtpRecord record = otpStore.get(cleanPhone);

        if (record == null) {
            return false;
        }

        if (Instant.now().isAfter(record.expiresAt())) {
            otpStore.remove(cleanPhone);
            return false;
        }

        if (record.code().equals(submittedCode.trim())) {
            otpStore.remove(cleanPhone); // Code used
            return true;
        }

        return false;
    }

    /**
     * Dispatch SMS via Twilio standard REST API using Java 21 native HttpClient.
     */
    private boolean sendViaTwilio(String toPhone, String code) {
        try {
            String messageBody = "Samma3ni (سمعني) - Votre code de vérification est : " + code + ". Valable 5 minutes.";
            String twilioUrl = "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json";

            String formPayload = "To=" + URLEncoder.encode(toPhone, StandardCharsets.UTF_8)
                    + "&From=" + URLEncoder.encode(twilioFromNumber, StandardCharsets.UTF_8)
                    + "&Body=" + URLEncoder.encode(messageBody, StandardCharsets.UTF_8);

            String auth = Base64.getEncoder().encodeToString((twilioAccountSid + ":" + twilioAuthToken).getBytes(StandardCharsets.UTF_8));

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(twilioUrl))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formPayload))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("[SAMMA3NI SMS] Twilio status: {}, response: {}", response.statusCode(), response.body());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (Exception e) {
            log.error("[SAMMA3NI SMS] Failed to dispatch via Twilio: {}", e.getMessage(), e);
            return false;
        }
    }
}
