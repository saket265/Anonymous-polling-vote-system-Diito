package com.poll.config;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;
@Component
public class JwtUtil {
    @Value("${app.jwt.secret}") private String secret;
    @Value("${app.jwt.expiry-hours}") private int expiryHours;
    private Key key() { return Keys.hmacShaKeyFor(secret.getBytes()); }
    public String generate(String userId, String role) {
        return Jwts.builder().setSubject(userId).claim("role",role)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis()+(long)expiryHours*3600_000))
            .signWith(key(), SignatureAlgorithm.HS256).compact();
    }
    public String getUserId(String t) { return parse(t).getBody().getSubject(); }
    public String getRole(String t)   { return (String)parse(t).getBody().get("role"); }
    public boolean isValid(String t)  { try { parse(t); return true; } catch (Exception e) { return false; } }
    private Jws<Claims> parse(String t) { return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(t); }
}
