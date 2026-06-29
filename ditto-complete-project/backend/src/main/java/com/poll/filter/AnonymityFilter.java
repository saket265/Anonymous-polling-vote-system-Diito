package com.poll.filter;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.UUID;
@Component
public class AnonymityFilter extends OncePerRequestFilter {
    public static final String TOKEN_ATTR = "anonToken";
    private static final String COOKIE_NAME = "poll_token";
    @Value("${app.cookie.max-age-days:30}") private int maxAgeDays;
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String token = readCookie(req);
        if (token == null || token.isBlank()) {
            token = UUID.randomUUID().toString();
            Cookie c = new Cookie(COOKIE_NAME, token);
            c.setHttpOnly(true); c.setPath("/"); c.setMaxAge(maxAgeDays * 86400);
            res.addCookie(c);
        }
        req.setAttribute(TOKEN_ATTR, token);
        chain.doFilter(req, res);
    }
    private String readCookie(HttpServletRequest req) {
        if (req.getCookies() == null) return null;
        for (Cookie c : req.getCookies()) if (COOKIE_NAME.equals(c.getName())) return c.getValue();
        return null;
    }
}
