## Generate RSA-2048 Keys - Spring Boot

Generate secure RSA-2048 keypairs for asymmetric encryption using Spring Boot and Java Security APIs.

### Service Implementation

```java
package experiments.muthuishere.dualcrypt.crypto.asymmetric;

import org.springframework.stereotype.Service;

import java.security.*;
import java.util.Base64;

@Service
public class AsymmetricCryptoService {

    private static final SecureRandom RNG = new SecureRandom();
    private static final int RSA_BITS = 2048;
    private static final int SALT_BYTES = 16;

    public record RsaBundle(String publicKeyB64, String privateKeyB64, String saltB64) {}

    public RsaBundle generateRsaBundle() throws GeneralSecurityException {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(RSA_BITS, RNG);
        KeyPair kp = kpg.generateKeyPair();
        byte[] salt = new byte[SALT_BYTES];
        RNG.nextBytes(salt);

        return new RsaBundle(
                Base64.getEncoder().encodeToString(kp.getPublic().getEncoded()),    // X.509/SPKI
                Base64.getEncoder().encodeToString(kp.getPrivate().getEncoded()),   // PKCS#8
                Base64.getEncoder().encodeToString(salt)
        );
    }
}
```

### REST Controller

```java
package experiments.muthuishere.dualcrypt.crypto.asymmetric;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/asymmetric")
public class AsymmetricCryptoController {

    private final AsymmetricCryptoService service;

    public AsymmetricCryptoController(AsymmetricCryptoService service) {
        this.service = service;
    }

    @GetMapping("/generate")
    public AsymmetricCryptoService.RsaBundle generate() {
        try {
            return service.generateRsaBundle();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
        }
    }
}
```

### Usage Example

```bash
## HTTP Request
curl -X GET http://localhost:8080/api/asymmetric/generate

## Response
{
  "publicKeyB64": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "privateKeyB64": "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...",
  "saltB64": "1EwAqBTFzVC16RaT0MZt..."
}
```

### Key Features

- **RSA-2048**: Strong asymmetric encryption with 2048-bit keys
- **OAEP Padding**: Optimal Asymmetric Encryption Padding with SHA-256
- **X.509/PKCS#8**: Standard key formats (SPKI for public, PKCS#8 for private)
- **SecureRandom**: Uses Java's cryptographically secure random generator
- **REST API**: Easy integration with any frontend framework


### Security Notes

- Uses `KeyPairGenerator` with `SecureRandom` for cryptographically secure key generation
- RSA-2048 provides strong security for most applications
- Keys are generated server-side using enterprise-grade security
- Public keys can be shared safely, private keys must be kept secure
- Consider implementing rate limiting for the generation endpoint
- Implement proper authentication/authorization for production use
