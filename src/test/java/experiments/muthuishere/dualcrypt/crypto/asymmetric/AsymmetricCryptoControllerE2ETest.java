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

    @Test
    @DisplayName("Generate -> Sign -> Verify happy path (JWT)")
    void roundTripSignVerify() {
        // 1) Generate keys
        ResponseEntity<Map> genRes = rest.getForEntity(url("/api/asymmetric/generate"), Map.class);
        assertThat(genRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        String pub = (String) genRes.getBody().get("publicKeyB64");
        String prv = (String) genRes.getBody().get("privateKeyB64");

        // 2) Sign data - should return JWT token
        String dataToSign = "JWT-style signature test";
        Map<String, Object> signReq = Map.of(
                "data", dataToSign,
                "privateKeyB64", prv
        );
        ResponseEntity<Map> signRes = postJson("/api/asymmetric/sign", signReq);
        assertThat(signRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        String jwtToken = (String) signRes.getBody().get("text");
        
        // Ensure we got a JWT token (should have 3 parts separated by dots)
        String[] jwtParts = jwtToken.split("\\.");
        assertThat(jwtParts).hasSize(3);

        // 3) Verify JWT token
        Map<String, Object> verifyReq = Map.of(
                "jwtToken", jwtToken,
                "publicKeyB64", pub
        );
        ResponseEntity<Map> verifyRes = postJson("/api/asymmetric/verify", verifyReq);
        assertThat(verifyRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(verifyRes.getBody().get("data")).isEqualTo(dataToSign);
    }

    @Test
    @DisplayName("Verify with wrong public key -> 400 (JWT verification fails)")
    void verifyWithWrongKeyReturns400() {
        // Generate two bundles
        String prv1, pub2;

        {
            ResponseEntity<Map> g1 = rest.getForEntity(url("/api/asymmetric/generate"), Map.class);
            prv1 = (String) g1.getBody().get("privateKeyB64");
        }
        {
            ResponseEntity<Map> g2 = rest.getForEntity(url("/api/asymmetric/generate"), Map.class);
            pub2 = (String) g2.getBody().get("publicKeyB64");
        }

        // Sign with prv1 to create JWT
        String data = "test-cross-key-verification";
        ResponseEntity<Map> signRes = postJson("/api/asymmetric/sign", Map.of(
                "data", data,
                "privateKeyB64", prv1
        ));
        String jwtToken = (String) signRes.getBody().get("text");

        // Try verify with wrong public key (from bundle 2) -> should return 400 (verification failure)
        ResponseEntity<String> verifyRes = rest.postForEntity(url("/api/asymmetric/verify"),
                jsonEntity(Map.of("jwtToken", jwtToken, "publicKeyB64", pub2)),
                String.class);

        assertThat(verifyRes.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Verify with tampered JWT -> 400 (JWT verification fails)")
    void verifyWithTamperedJwtReturns400() {
        // Generate keys
        ResponseEntity<Map> genRes = rest.getForEntity(url("/api/asymmetric/generate"), Map.class);
        String pub = (String) genRes.getBody().get("publicKeyB64");
        String prv = (String) genRes.getBody().get("privateKeyB64");

        // Sign original data to get JWT
        String originalData = "original-message";
        ResponseEntity<Map> signRes = postJson("/api/asymmetric/sign", Map.of(
                "data", originalData,
                "privateKeyB64", prv
        ));
        String jwtToken = (String) signRes.getBody().get("text");

        // Tamper with the JWT signature part more effectively
        String[] parts = jwtToken.split("\\.");
        String tamperedSignature = parts[2].substring(0, parts[2].length() - 10) + "TAMPERED00";
        String tamperedJwt = parts[0] + "." + parts[1] + "." + tamperedSignature;

        System.out.println("Original JWT: " + jwtToken);
        System.out.println("Tampered JWT: " + tamperedJwt);

        // Try verify with tampered JWT -> should return 400 (verification failure)
        ResponseEntity<String> verifyRes = rest.postForEntity(url("/api/asymmetric/verify"),
                jsonEntity(Map.of("jwtToken", tamperedJwt, "publicKeyB64", pub)),
                String.class);

        System.out.println("Response status: " + verifyRes.getStatusCode());
        System.out.println("Response body: " + verifyRes.getBody());

        assertThat(verifyRes.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Sign with missing data -> 400")
    void signMissingDataReturns400() {
        Map<String, Object> badReq = new HashMap<>();
        badReq.put("privateKeyB64", "abc"); // bogus, but we won't get that far

        ResponseEntity<String> res = rest.postForEntity(url("/api/asymmetric/sign"),
                jsonEntity(badReq), String.class);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Verify with missing JWT token -> 400")
    void verifyMissingJwtTokenReturns400() {
        Map<String, Object> badReq = Map.of(
                "publicKeyB64", "abc" // missing jwtToken
        );

        ResponseEntity<String> res = rest.postForEntity(url("/api/asymmetric/verify"),
                jsonEntity(badReq), String.class);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Sign and verify JSON claims")
    void signVerifyJsonClaims() {
        // Generate keys
        ResponseEntity<Map> genRes = rest.getForEntity(url("/api/asymmetric/generate"), Map.class);
        String pub = (String) genRes.getBody().get("publicKeyB64");
        String prv = (String) genRes.getBody().get("privateKeyB64");

        // Sign JSON claims
        String jsonClaims = "{\"user\":\"john\",\"role\":\"admin\",\"permissions\":[\"read\",\"write\"]}";
        ResponseEntity<Map> signRes = postJson("/api/asymmetric/sign", Map.of(
                "data", jsonClaims,
                "privateKeyB64", prv
        ));
        assertThat(signRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        String jwtToken = (String) signRes.getBody().get("text");

        // Verify we got a proper JWT
        String[] jwtParts = jwtToken.split("\\.");
        assertThat(jwtParts).hasSize(3);

        // Verify JWT and get back the claims
        ResponseEntity<Map> verifyRes = postJson("/api/asymmetric/verify", Map.of(
                "jwtToken", jwtToken,
                "publicKeyB64", pub
        ));
        assertThat(verifyRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        // Should get back the JSON claims (minus standard JWT claims like iat, exp)
        String returnedData = (String) verifyRes.getBody().get("data");
        assertThat(returnedData).contains("\"user\":\"john\"");
        assertThat(returnedData).contains("\"role\":\"admin\"");
        assertThat(returnedData).contains("\"permissions\":[\"read\",\"write\"]");
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
