package com.poll;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.servlet.config.annotation.*;
@SpringBootApplication @EnableAsync
public class PollApplication {
    public static void main(String[] args) { SpringApplication.run(PollApplication.class, args); }
    @Bean public WebMvcConfigurer cors(@Value("${app.cors.allowed-origins}") String origins) {
        return new WebMvcConfigurer() {
            @Override public void addCorsMappings(CorsRegistry r) {
                r.addMapping("/api/**").allowedOrigins(origins)
                 .allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS")
                 .allowCredentials(true).maxAge(3600);
            }
        };
    }
}
