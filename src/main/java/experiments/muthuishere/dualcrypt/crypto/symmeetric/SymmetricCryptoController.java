package experiments.muthuishere.dualcrypt.crypto.symmeetric;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/symmetric")
public class SymmetricCryptoController {

    private final SymmetricCryptoService service;

    public SymmetricCryptoController(SymmetricCryptoService service) {
        this.service = service;
    }

    // --- DTOs (packed) ---
    public record EncryptRequest(@NotBlank String plaintext,
                                 @NotBlank String secretB64,
                                 @NotBlank String saltB64) {}
    public record EncryptResponse(String dataB64) {}

    public record DecryptRequest(@NotBlank String dataB64,
                                 @NotBlank String secretB64,
                                 @NotBlank String saltB64) {}
    public record TextResponse(String text) {}

    @GetMapping("/generate")
    public SymmetricCryptoService.SymmetricBundle generate() {
        try {
            return service.generateSymmetricBundle();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
        }
    }

    @PostMapping("/encrypt")
    public EncryptResponse encrypt(@Valid @RequestBody EncryptRequest req) {
        try {
            String dataB64 = service.encrypt(req.plaintext(), req.secretB64(), req.saltB64());
            return new EncryptResponse(dataB64);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    @PostMapping("/decrypt")
    public TextResponse decrypt(@Valid @RequestBody DecryptRequest req) {
        try {
            String plaintext = service.decrypt(req.dataB64(), req.secretB64(), req.saltB64());
            return new TextResponse(plaintext);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }
}
