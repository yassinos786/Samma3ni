package com.samma3ni.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/songs", "/api/songs/**").permitAll()
                .requestMatchers(HttpMethod.HEAD, "/api/songs", "/api/songs/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/songs/*/play").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/artists", "/api/artists/**").permitAll()
                .requestMatchers(HttpMethod.HEAD, "/api/artists", "/api/artists/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/albums", "/api/albums/**").permitAll()
                .requestMatchers(HttpMethod.HEAD, "/api/albums", "/api/albums/**").permitAll()
                // Admin only
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/songs/upload").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/songs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/songs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/artists", "/api/artists/**", "/api/albums", "/api/albums/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/artists", "/api/artists/**", "/api/albums", "/api/albums/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/artists", "/api/artists/**", "/api/albums", "/api/albums/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
