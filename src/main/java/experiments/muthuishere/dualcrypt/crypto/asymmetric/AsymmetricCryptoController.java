package experiments.muthuishere.dualcrypt.crypto.asymmetric;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/asymmetric")
@Tag(name = "Asymmetric Cryptography", description = "RSA encryption, decryption, signing, and verification operations")
public class AsymmetricCryptoController {

    private final AsymmetricCryptoService service;

    public AsymmetricCryptoController(AsymmetricCryptoService service) {
        this.service = service;
    }

    // --- DTOs ---
    @Schema(description = "Request to encrypt plaintext data")
    public record EncryptRequest(
        @NotBlank @Schema(description = "The plaintext data to encrypt", example = "Hello World") 
        String plaintext, 
        @NotBlank @Schema(description = "Base64-encoded RSA public key", example = "MIIBIjANBgkqhkiG9w0BAQEF...") 
        String publicKeyB64
    ) {}
    
    @Schema(description = "Request to decrypt ciphertext data")
    public record DecryptRequest(
        @NotBlank @Schema(description = "Base64-encoded encrypted data", example = "ABC123DEF456...") 
        String cipherB64, 
        @NotBlank @Schema(description = "Base64-encoded RSA private key", example = "MIIEvgIBADANBgkqhkiG9w0BAQEF...") 
        String privateKeyB64
    ) {}
    
    @Schema(description = "Request to sign data and create JWT token")
    public record SignRequest(
        @NotBlank @Schema(description = "The data to sign - can be simple text or JSON claims", 
                         example = "Hello World", 
                         examples = {"Hello World", "{\"user\":\"john\",\"role\":\"admin\"}"}) 
        String data, 
        @NotBlank @Schema(description = "Base64-encoded RSA private key", example = "MIIEvgIBADANBgkqhkiG9w0BAQEF...") 
        String privateKeyB64
    ) {}
    
    @Schema(description = "Request to verify a JWT token")
    public record VerifyRequest(
        @NotBlank @Schema(description = "JWT token to verify", example = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiSGVsbG8gV29ybGQifQ.signature") 
        String jwtToken, 
        @NotBlank @Schema(description = "Base64-encoded RSA public key", example = "MIIBIjANBgkqhkiG9w0BAQEF...") 
        String publicKeyB64
    ) {}
    
    @Schema(description = "Response containing text data")
    public record TextResponse(
        @Schema(description = "The resulting text (encrypted data, decrypted data, JWT token, or verified data)", example = "ABC123DEF456...")
        String text
    ) {}
    
    @Schema(description = "Response for JWT verification")
    public record VerifyResponse(
        @Schema(description = "The original data from the verified JWT token", example = "Hello World")
        String data
    ) {}

    @GetMapping("/generate")
    @Operation(summary = "Generate RSA Key Pair", 
               description = "Generates a new RSA-2048 key pair with public key, private key, and salt")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully generated RSA key pair",
                    content = @Content(schema = @Schema(implementation = AsymmetricCryptoService.RsaBundle.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error during key generation")
    })
    public AsymmetricCryptoService.RsaBundle generate() {
        try {
            return service.generateRsaBundle();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
        }
    }

    @PostMapping("/encrypt")
    @Operation(summary = "Encrypt Data", 
               description = "Encrypts plaintext using RSA-OAEP with SHA-256 and the provided public key")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully encrypted data",
                    content = @Content(schema = @Schema(implementation = TextResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request or encryption failed")
    })
    public TextResponse encrypt(@Valid @RequestBody EncryptRequest req) {
        try {
            String cipherB64 = service.encrypt(req.plaintext(), req.publicKeyB64());
            return new TextResponse(cipherB64);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    @PostMapping("/decrypt")
    @Operation(summary = "Decrypt Data", 
               description = "Decrypts ciphertext using RSA-OAEP with SHA-256 and the provided private key")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully decrypted data",
                    content = @Content(schema = @Schema(implementation = TextResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request or decryption failed")
    })
    public TextResponse decrypt(@Valid @RequestBody DecryptRequest req) {
        try {
            String plaintext = service.decrypt(req.cipherB64(), req.privateKeyB64());
            return new TextResponse(plaintext);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    @PostMapping("/sign")
    @Operation(summary = "Sign Data and Create JWT", 
               description = "Creates a JWT token with digital signature. Input can be simple text or JSON claims. Returns a JWT token with format: header.payload.signature")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully created JWT token",
                    content = @Content(schema = @Schema(implementation = TextResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request or signing failed")
    })
    public TextResponse sign(@Valid @RequestBody SignRequest req) {
        try {
            String jwtToken = service.sign(req.data(), req.privateKeyB64());
            return new TextResponse(jwtToken);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify JWT Token", 
               description = "Verifies a JWT token signature and returns the original data. Checks signature validity and token expiration.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully verified JWT and extracted data",
                    content = @Content(schema = @Schema(implementation = VerifyResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid JWT token, signature verification failed, or token expired")
    })
    public VerifyResponse verify(@Valid @RequestBody VerifyRequest req) {
        try {
            String originalData = service.verify(req.jwtToken(), req.publicKeyB64());
            return new VerifyResponse(originalData);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }
}
