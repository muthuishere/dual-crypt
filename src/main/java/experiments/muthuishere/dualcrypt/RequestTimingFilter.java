package experiments.muthuishere.dualcrypt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RequestTimingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestTimingFilter.class);
    
    private static final ThreadLocal<Long> REQUEST_START_TIME = new ThreadLocal<>();
    
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, 
                                  @NonNull FilterChain filterChain) throws ServletException, IOException {
        
        long startTime = System.nanoTime();
        REQUEST_START_TIME.set(startTime);
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = (System.nanoTime() - startTime) / 1_000_000; // Convert to milliseconds
            log.info("Request {} {} completed in {} ms", request.getMethod(), request.getRequestURI(), duration);
            REQUEST_START_TIME.remove(); // Clean up ThreadLocal
        }
    }
    
    public static Long getRequestStartTime() {
        return REQUEST_START_TIME.get();
    }
    
    public static long getCurrentRequestDurationMs() {
        Long startTime = REQUEST_START_TIME.get();
        if (startTime != null) {
            return (System.nanoTime() - startTime) / 1_000_000;
        }
        return 0; // No timing available
    }
}
