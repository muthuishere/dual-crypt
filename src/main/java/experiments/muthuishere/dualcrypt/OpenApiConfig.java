package experiments.muthuishere.dualcrypt;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("DualCrypt API")
                        .description("A comprehensive cryptographic service providing both symmetric and asymmetric encryption, decryption, signing, and verification capabilities")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("DualCrypt Team")
                                .email("support@dualcrypt.com")
                                .url("https://github.com/muthuishere/dual-crypt"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Development server"),
                        new Server().url("https://api.dualcrypt.com").description("Production server")
                ));
    }
}
