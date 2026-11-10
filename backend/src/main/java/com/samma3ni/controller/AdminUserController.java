package com.samma3ni.controller;

import com.samma3ni.model.User;
import com.samma3ni.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * GET /api/admin/users
     * Returns list of users filtered by query, role, or status + global counts
     */
    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {

        List<User> users = userRepository.findAll();

        if (q != null && !q.isBlank()) {
            String term = q.trim().toLowerCase();
            users = users.stream()
                    .filter(u -> (u.getName() != null && u.getName().toLowerCase().contains(term)) ||
                                 (u.getEmail() != null && u.getEmail().toLowerCase().contains(term)) ||
                                 (u.getPhone() != null && u.getPhone().toLowerCase().contains(term)))
                    .collect(Collectors.toList());
        }

        if (role != null && !role.isBlank() && !"ALL".equalsIgnoreCase(role)) {
            users = users.stream()
                    .filter(u -> role.equalsIgnoreCase(u.getRole()))
                    .collect(Collectors.toList());
        }

        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            users = users.stream()
                    .filter(u -> status.equalsIgnoreCase(u.getStatus()))
                    .collect(Collectors.toList());
        }

        // Mask passwords before sending
        List<Map<String, Object>> safeUsers = users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("email", u.getEmail());
            map.put("name", u.getName());
            map.put("role", u.getRole() != null ? u.getRole() : "USER");
            map.put("status", u.getStatus() != null ? u.getStatus() : "ACTIVE");
            map.put("phone", u.getPhone());
            map.put("avatarUrl", u.getAvatarUrl());
            map.put("createdAt", u.getCreatedAt());
            map.put("updatedAt", u.getUpdatedAt());
            return map;
        }).collect(Collectors.toList());

        long total = userRepository.count();
        long active = userRepository.findAll().stream().filter(u -> !"BLOCKED".equalsIgnoreCase(u.getStatus())).count();
        long blocked = userRepository.findAll().stream().filter(u -> "BLOCKED".equalsIgnoreCase(u.getStatus())).count();
        long admins = userRepository.findAll().stream().filter(u -> "ADMIN".equalsIgnoreCase(u.getRole())).count();

        Map<String, Object> response = new HashMap<>();
        response.put("users", safeUsers);
        response.put("total", total);
        response.put("active", active);
        response.put("blocked", blocked);
        response.put("admins", admins);

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/admin/users
     * Create a new user from the Admin portal
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String name = body.get("name");
        String role = body.getOrDefault("role", "USER").toUpperCase();
        String status = body.getOrDefault("status", "ACTIVE").toUpperCase();
        String phone = body.get("phone");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email et mot de passe requis"));
        }

        String cleanEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Un utilisateur avec cet email existe déjà"));
        }

        String finalName = (name != null && !name.isBlank()) ? name.trim() : cleanEmail.split("@")[0];
        String avatar = "https://ui-avatars.com/api/?name=" + URLEncoder.encode(finalName, StandardCharsets.UTF_8) + "&background=1ed760&color=000&size=128";

        User newUser = User.builder()
                .email(cleanEmail)
                .password(password)
                .name(finalName)
                .role(role)
                .status(status)
                .phone(phone != null ? phone.trim() : null)
                .avatarUrl(avatar)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        User saved = userRepository.save(newUser);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Utilisateur créé avec succès",
                "id", saved.getId(),
                "email", saved.getEmail(),
                "name", saved.getName(),
                "role", saved.getRole(),
                "status", saved.getStatus()
        ));
    }

    /**
     * PUT /api/admin/users/{id}
     * Update user details
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        if (body.containsKey("name") && body.get("name") != null && !body.get("name").isBlank()) {
            user.setName(body.get("name").trim());
            user.setAvatarUrl("https://ui-avatars.com/api/?name=" + URLEncoder.encode(user.getName(), StandardCharsets.UTF_8) + "&background=1ed760&color=000&size=128");
        }

        if (body.containsKey("email") && body.get("email") != null && !body.get("email").isBlank()) {
            String newEmail = body.get("email").trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmailIgnoreCase(newEmail)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cet email est déjà utilisé par un autre compte"));
            }
            user.setEmail(newEmail);
        }

        if (body.containsKey("password") && body.get("password") != null && !body.get("password").isBlank()) {
            user.setPassword(body.get("password"));
        }

        if (body.containsKey("role") && body.get("role") != null) {
            user.setRole(body.get("role").trim().toUpperCase());
        }

        if (body.containsKey("status") && body.get("status") != null) {
            user.setStatus(body.get("status").trim().toUpperCase());
        }

        if (body.containsKey("phone")) {
            user.setPhone(body.get("phone") != null ? body.get("phone").trim() : null);
        }

        user.setUpdatedAt(Instant.now());
        User updated = userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Utilisateur mis à jour avec succès",
                "id", updated.getId(),
                "email", updated.getEmail(),
                "name", updated.getName(),
                "role", updated.getRole(),
                "status", updated.getStatus()
        ));
    }

    /**
     * PATCH /api/admin/users/{id}/status
     * Toggle or update user status (ACTIVE / BLOCKED)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> toggleStatus(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        String newStatus;
        if (body != null && body.containsKey("status")) {
            newStatus = body.get("status").toUpperCase();
        } else {
            newStatus = "BLOCKED".equalsIgnoreCase(user.getStatus()) ? "ACTIVE" : "BLOCKED";
        }

        user.setStatus(newStatus);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Statut mis à jour: " + newStatus,
                "status", newStatus
        ));
    }

    /**
     * PATCH /api/admin/users/{id}/role
     * Change user role (USER, ADMIN, VIP)
     */
    @PatchMapping("/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String role = body.get("role");
        if (role == null || role.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rôle requis"));
        }

        User user = userOpt.get();
        user.setRole(role.trim().toUpperCase());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Rôle mis à jour: " + user.getRole(),
                "role", user.getRole()
        ));
    }

    /**
     * DELETE /api/admin/users/{id}
     * Delete user account
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé avec succès"));
    }
}
