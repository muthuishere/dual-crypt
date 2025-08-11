package experiments.muthuishere.dualcrypt;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {


    @GetMapping("/api/health")
    public ResponseEntity<Void> health() {
        if (1 == 1) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }
}