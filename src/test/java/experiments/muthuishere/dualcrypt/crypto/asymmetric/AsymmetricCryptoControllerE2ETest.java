package experiments.muthuishere.dualcrypt.crypto.asymmetric;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;


import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.util.Assert;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AsymmetricCryptoControllerE2ETest {

    @LocalServerPort
    int port;

    @Autowired
    org.springframework.boot.test.web.client.TestRestTemplate rest;

    private String url(String path) {
        return UriComponentsBuilder.fromHttpUrl("http://localhost:" + port)
                .path(path).toUriString();
    }

    private void printJson(Object obj) {
        try {
            System.out.println(new com.fasterxml.jackson.databind.ObjectMapper()
                    .writerWithDefaultPrettyPrinter()
                    .writeValueAsString(obj));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Test
    @DisplayName("Generate -> Encrypt -> Decrypt happy path")
    void roundTripEncryptDecrypt() {
        // 1) Generate keys
        ResponseEntity<Map> genRes = rest.getForEntity(url("/api/asymmetric/generate"), Map.class);
        assertThat(genRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        String pub = (String) genRes.getBody().get("publicKeyB64");
        String prv = (String) genRes.getBody().get("privateKeyB64");

        // sanity: base64 decodes
        Base64.getDecoder().decode(pub);
        Base64.getDecoder().decode(prv);

        // 2) Encrypt
        Map<String, Object> encReq = Map.of(
                "plaintext", "namaste-from-e2e",
                "publicKeyB64", pub
        );
        ResponseEntity<Map> encRes = postJson("/api/asymmetric/encrypt", encReq);
        assertThat(encRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        String cipherB64 = (String) encRes.getBody().get("text");
        Base64.getDecoder().decode(cipherB64);

        // 3) Decrypt
        Map<String, Object> decReq = Map.of(
                "cipherB64", cipherB64,
                "privateKeyB64", prv
        );
        ResponseEntity<Map> decRes = postJson("/api/asymmetric/decrypt", decReq);
        assertThat(decRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(decRes.getBody().get("text")).isEqualTo("namaste-from-e2e");
    }

    @Test
    @DisplayName("Validation kicks in: missing plaintext -> 400")
    void encryptMissingPlaintextReturns400() {
        Map<String, Object> badReq = new HashMap<>();
        badReq.put("publicKeyB64", "abc"); // bogus, but we won't get that far

        ResponseEntity<String> res = rest.postForEntity(url("/api/asymmetric/encrypt"),
                jsonEntity(badReq), String.class);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        printJson(res.getBody());


    }

    @Test
    @DisplayName("Decrypt with wrong private key -> 400 (crypto error)")
    void decryptWithWrongKeyReturns400() {
        // Generate two bundles
        String pub1, prv2;

        {
            ResponseEntity<Map> g1 = rest.getForEntity(url("/api/asymmetric/generate"), Map.class);
            pub1 = (String) g1.getBody().get("publicKeyB64");
        }
        {
            ResponseEntity<Map> g2 = rest.getForEntity(url("/api/asymmetric/generate"), Map.class);
            prv2 = (String) g2.getBody().get("privateKeyB64");
        }

        // Encrypt with pub1
        ResponseEntity<Map> enc = postJson("/api/asymmetric/encrypt", Map.of(
                "plaintext", "cross-key-should-fail",
                "publicKeyB64", pub1
        ));
        String cipher = (String) enc.getBody().get("text");

        // Try decrypt with wrong private key (from bundle 2) -> BAD_REQUEST
        ResponseEntity<String> dec = rest.postForEntity(url("/api/asymmetric/decrypt"),
                jsonEntity(Map.of("cipherB64", cipher, "privateKeyB64", prv2)),
                String.class);

        assertThat(dec.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    // ---------- helpers ----------
    private ResponseEntity<Map> postJson(String path, Map<String, Object> body) {
        return rest.postForEntity(url(path), jsonEntity(body), Map.class);
    }

    private HttpEntity<Map<String, Object>> jsonEntity(Map<String, Object> body) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, h);
    }
}
