package experiments.muthuishere.dualcrypt.crypto.symmeetric;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Base64;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SymmetricCryptoControllerE2ETest {

    @LocalServerPort
    int port;

    @Autowired
    org.springframework.boot.test.web.client.TestRestTemplate rest;

    private final ObjectMapper om = new ObjectMapper();

    private String url(String path) {
        return UriComponentsBuilder.fromHttpUrl("http://localhost:" + port)
                .path(path).toUriString();
    }

    // -------------------- HAPPY PATH --------------------

    @Test
    @DisplayName("Generate -> Encrypt -> Decrypt (AES-GCM, packed dataB64) happy path")
    void roundTripEncryptDecrypt() {
        // 1) Generate secret + salt
        ResponseEntity<Map> gen = rest.getForEntity(url("/api/symmetric/generate"), Map.class);
        assertThat(gen.getStatusCode()).isEqualTo(HttpStatus.OK);

        String secret = (String) gen.getBody().get("secretB64");
        String salt   = (String) gen.getBody().get("saltB64");

        Base64.getDecoder().decode(secret);
        Base64.getDecoder().decode(salt);

        // 2) Encrypt -> dataB64 (packed IV || ciphertext)
        Map<String, Object> encReq = Map.of(
                "plaintext", "vanakkam-aes-gcm",
                "secretB64", secret,
                "saltB64",   salt
        );
        ResponseEntity<Map> enc = postJson("/api/symmetric/encrypt", encReq);
        assertThat(enc.getStatusCode()).isEqualTo(HttpStatus.OK);

        String dataB64 = (String) enc.getBody().get("dataB64");
        Base64.getDecoder().decode(dataB64); // sanity

        // 3) Decrypt with packed dataB64
        Map<String, Object> decReq = Map.of(
                "dataB64",   dataB64,
                "secretB64", secret,
                "saltB64",   salt
        );
        ResponseEntity<Map> dec = postJson("/api/symmetric/decrypt", decReq);
        assertThat(dec.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(dec.getBody().get("text")).isEqualTo("vanakkam-aes-gcm");
    }

    // -------------------- VALIDATION --------------------

    @Test
    @DisplayName("Validation: missing plaintext -> 400")
    void encryptMissingPlaintextReturns400() {
        Map<String, Object> badReq = Map.of(
                "secretB64", Base64.getEncoder().encodeToString(new byte[32]),
                "saltB64",   Base64.getEncoder().encodeToString(new byte[16])
        );

        ResponseEntity<String> res = rest.postForEntity(
                url("/api/symmetric/encrypt"),
                jsonEntity(badReq),
                String.class
        );

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        System.out.println("Encrypt validation error: " + res.getBody());
    }

    // -------------------- CRYPTO SAFETY --------------------

    @Test
    @DisplayName("Tamper: flip one byte in packed data -> 400 (GCM auth fails)")
    void tamperDataReturns400() {
        // Generate bundle
        ResponseEntity<Map> gen = rest.getForEntity(url("/api/symmetric/generate"), Map.class);
        String secret = (String) gen.getBody().get("secretB64");
        String salt   = (String) gen.getBody().get("saltB64");

        // Encrypt
        ResponseEntity<Map> enc = postJson("/api/symmetric/encrypt", Map.of(
                "plaintext", "auth-me-pls",
                "secretB64", secret,
                "saltB64",   salt
        ));
        String dataB64 = (String) enc.getBody().get("dataB64");

        // Tamper: flip one bit in the packed bytes
        byte[] packed = Base64.getDecoder().decode(dataB64);
        packed[0] ^= 0x01; // corrupt either IV or first byte of ciphertext
        String tampered = Base64.getEncoder().encodeToString(packed);

        // Decrypt should fail with BAD_REQUEST
        ResponseEntity<String> dec = rest.postForEntity(
                url("/api/symmetric/decrypt"),
                jsonEntity(Map.of(
                        "dataB64",   tampered,
                        "secretB64", secret,
                        "saltB64",   salt
                )),
                String.class
        );
        assertThat(dec.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        System.out.println("Tamper error: " + dec.getBody());
    }

    @Test
    @DisplayName("Wrong salt: derive different key -> 400 (GCM auth fails)")
    void wrongSaltReturns400() {
        // Generate real bundle
        ResponseEntity<Map> gen = rest.getForEntity(url("/api/symmetric/generate"), Map.class);
        String secret = (String) gen.getBody().get("secretB64");
        String salt   = (String) gen.getBody().get("saltB64");

        // Encrypt with correct salt
        ResponseEntity<Map> enc = postJson("/api/symmetric/encrypt", Map.of(
                "plaintext", "salt-sensitive",
                "secretB64", secret,
                "saltB64",   salt
        ));
        String dataB64 = (String) enc.getBody().get("dataB64");

        // Make a different salt
        String otherSalt = Base64.getEncoder().encodeToString(new byte[16]); // 16 zero bytes

        // Decrypt with wrong salt -> BAD_REQUEST
        ResponseEntity<String> dec = rest.postForEntity(
                url("/api/symmetric/decrypt"),
                jsonEntity(Map.of(
                        "dataB64",   dataB64,
                        "secretB64", secret,
                        "saltB64",   otherSalt
                )),
                String.class
        );
        assertThat(dec.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    // -------------------- helpers --------------------
    private ResponseEntity<Map> postJson(String path, Map<String, Object> body) {
        return rest.postForEntity(url(path), jsonEntity(body), Map.class);
    }

    private HttpEntity<Map<String, Object>> jsonEntity(Map<String, Object> body) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, h);
    }

    @SuppressWarnings("unused")
    private void printJson(Object o) {
        try { System.out.println(om.writerWithDefaultPrettyPrinter().writeValueAsString(o)); }
        catch (Exception e) { e.printStackTrace(); }
    }
}
