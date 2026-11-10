package com.samma3ni.controller;

import com.samma3ni.model.User;
import com.samma3ni.repository.UserRepository;
import com.samma3ni.service.EmailService;
import com.samma3ni.service.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class AuthController {

    private final JwtService jwtService;
    private final com.samma3ni.service.SmsService smsService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    public AuthController(JwtService jwtService, com.samma3ni.service.SmsService smsService, EmailService emailService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.smsService = smsService;
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    @PostMapping("/send-sms")
    public ResponseEntity<?> sendSms(@RequestBody Map<String, String> body) {
        String phone = body.get("phoneNumber");
        if (phone == null || phone.trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Numéro de téléphone invalide"));
        }
        Map<String, Object> result = smsService.sendVerificationSms(phone);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/verify-sms")
    public ResponseEntity<?> verifySms(@RequestBody Map<String, String> body) {
        String phone = body.get("phoneNumber");
        String code = body.get("code");
        if (phone == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Champs manquants"));
        }
        boolean valid = smsService.verifySms(phone, code);
        if (valid) {
            return ResponseEntity.ok(Map.of("valid", true, "phoneNumber", phone));
        } else {
            return ResponseEntity.status(400).body(Map.of("valid", false, "error", "Code de confirmation incorrect ou expiré"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String emailOrUsername = body.getOrDefault("email", body.get("username"));
        String password = body.get("password");

        if (emailOrUsername == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email et mot de passe requis"));
        }

        // 1. Check Admin
        if (adminUsername.equalsIgnoreCase(emailOrUsername) && adminPassword.equals(password)) {
            String token = jwtService.generateToken(adminUsername, "ADMIN");
            return ResponseEntity.ok(Map.of(
                "token", token,
                "role", "ADMIN",
                "username", adminUsername,
                "name", "Administrateur",
                "email", "admin@samma3ni.tn"
            ));
        }

        // 2. Check Standard User in MongoDB
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(emailOrUsername.trim());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if ("BLOCKED".equalsIgnoreCase(user.getStatus())) {
                return ResponseEntity.status(403).body(Map.of("error", "Votre compte a été suspendu par un administrateur."));
            }
            if (password.equals(user.getPassword())) {
                String token = jwtService.generateToken(user.getEmail(), user.getRole() != null ? user.getRole() : "USER");
                return ResponseEntity.ok(Map.of(
                    "token", token,
                    "role", user.getRole() != null ? user.getRole() : "USER",
                    "name", user.getName() != null ? user.getName() : user.getEmail(),
                    "email", user.getEmail(),
                    "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
                ));
            }
        }

        return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String name = body.get("name");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Veuillez renseigner un email et un mot de passe valides"));
        }

        String cleanEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cet email est déjà associé à un compte Samma3ni"));
        }

        String finalName = (name != null && !name.isBlank()) ? name.trim() : cleanEmail.split("@")[0];
        String avatar = "https://ui-avatars.com/api/?name=" + java.net.URLEncoder.encode(finalName, java.nio.charset.StandardCharsets.UTF_8) + "&background=1ed760&color=000&size=128";

        User newUser = User.builder()
            .email(cleanEmail)
            .password(password)
            .name(finalName)
            .role("USER")
            .avatarUrl(avatar)
            .build();

        userRepository.save(newUser);

        String token = jwtService.generateToken(cleanEmail, "USER");

        // Try sending welcome email in background
        try {
            emailService.sendGoogleWelcomeEmail(cleanEmail, finalName);
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of(
            "token", token,
            "role", "USER",
            "name", finalName,
            "email", cleanEmail,
            "avatarUrl", avatar
        ));
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validate(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (jwtService.isTokenValid(token)) {
                return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "username", jwtService.extractUsername(token),
                    "role", jwtService.extractRole(token)
                ));
            }
        } catch (Exception ignored) {}
        return ResponseEntity.status(401).body(Map.of("valid", false));
    }

    /**
     * POST /api/auth/send-welcome-email
     * Sends a real Gmail confirmation email after Google OAuth login.
     * Body: { "email": "user@gmail.com", "name": "John Doe" }
     */
    @PostMapping("/send-welcome-email")
    public ResponseEntity<?> sendWelcomeEmail(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String name  = body.get("name");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email requis"));
        }
        if (name == null || name.isBlank()) {
            name = "utilisateur";
        }

        boolean sent = emailService.sendGoogleWelcomeEmail(email, name);
        if (sent) {
            return ResponseEntity.ok(Map.of("sent", true, "message", "Email de bienvenue envoyé à " + email));
        } else {
            // Mail disabled or failed - return ok so front-end doesn't block auth
            return ResponseEntity.ok(Map.of("sent", false, "message", "Mail désactivé ou erreur - active SMTP dans application.properties"));
        }
    }
}
