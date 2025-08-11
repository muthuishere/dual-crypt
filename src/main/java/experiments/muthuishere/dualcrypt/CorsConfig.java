package experiments.muthuishere.dualcrypt;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);

        // Use a pattern to match dynamically at runtime
        config.setAllowedOriginPatterns(
                List.of(
                        "http://localhost:*",  // any localhost port
                        "https://*.muthuishere.com",
                        "https://muthuishere.com"

                )
        );

        config.setAllowedMethods(Arrays.asList("GET", "POST", "HEAD","PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
