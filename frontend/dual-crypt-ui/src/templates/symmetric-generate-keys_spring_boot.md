## Generate AES-256 Keys - Spring Boot

Generate secure random keys for AES-256-GCM encryption using Spring Boot and Java Security APIs.

### Service Implementation

```java
package experiments.muthuishere.dualcrypt.crypto.symmeetric;

import org.springframework.stereotype.Service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;

@Service
public class SymmetricCryptoService {

    private static final SecureRandom RNG = new SecureRandom();
    private static final Base64.Encoder B64E = Base64.getEncoder();

    public record SymmetricBundle(String secretB64, String saltB64) {}

    /** Generate a random 32B secret + 16B salt */
    public SymmetricBundle generateSymmetricBundle() {
        byte[] secret = randomBytes(32);
        byte[] salt   = randomBytes(16);
        return new SymmetricBundle(B64E.encodeToString(secret), B64E.encodeToString(salt));
    }

    private static byte[] randomBytes(int n) { byte[] b = new byte[n]; RNG.nextBytes(b); return b; }
}
```

### REST Controller

```java
package experiments.muthuishere.dualcrypt.crypto.symmeetric;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/symmetric")
public class SymmetricCryptoController {

    private final SymmetricCryptoService service;

    public SymmetricCryptoController(SymmetricCryptoService service) {
        this.service = service;
    }

    @GetMapping("/generate")
    public SymmetricCryptoService.SymmetricBundle generate() {
        try {
            return service.generateSymmetricBundle();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
        }
    }
}
```

### Usage Example

```bash
## HTTP Request
curl -X GET http://localhost:8080/api/symmetric/generate

## Response
{
  "secretB64": "GcHrUKLfctsYthcVPLnr...",
  "saltB64": "1EwAqBTFzVC16RaT0MZt..."
}
```

### Key Features

- **SecureRandom**: Uses Java's cryptographically secure random generator
- **256-bit Secret Key**: Provides strong encryption strength
- **128-bit Salt**: Ensures unique key derivation for each session
- **Base64 Encoding**: Safe for JSON transport and storage
- **REST API**: Easy integration with any frontend framework


### Security Notes

- Uses `SecureRandom` for cryptographically secure random generation
- Keys are generated server-side using enterprise-grade security
- Consider implementing rate limiting for the generation endpoint
- Store keys securely and never log them in production
- Implement proper authentication/authorization for production use
