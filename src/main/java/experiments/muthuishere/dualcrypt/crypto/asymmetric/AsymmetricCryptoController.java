package experiments.muthuishere.dualcrypt.crypto.asymmetric;




import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/asymmetric")
public class AsymmetricCryptoController {

    private final AsymmetricCryptoService service;

    public AsymmetricCryptoController(AsymmetricCryptoService service) {
        this.service = service;
    }

    // --- DTOs ---
    public record EncryptRequest(@NotBlank String plaintext, @NotBlank String publicKeyB64) {}
    public record DecryptRequest(@NotBlank String cipherB64, @NotBlank String privateKeyB64) {}
    public record TextResponse(String text) {}

    @GetMapping("/generate")
    public AsymmetricCryptoService.RsaBundle generate() {
        try {
            return service.generateRsaBundle();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
        }
    }

    @PostMapping("/encrypt")
    public TextResponse encrypt(@Valid @RequestBody EncryptRequest req) {
        try {
            String cipherB64 = service.encrypt(req.plaintext(), req.publicKeyB64());
            return new TextResponse(cipherB64);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    @PostMapping("/decrypt")
    public TextResponse decrypt(@Valid @RequestBody DecryptRequest req) {
        try {
            String plaintext = service.decrypt(req.cipherB64(), req.privateKeyB64());
            return new TextResponse(plaintext);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }
}
