package com.charusat.canteen;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MediaIntegrationTest
 *
 * Verifies public accessibility and contract compliance of the ImageKit media
 * configuration and upload authorization endpoints.
 *
 * @validates  Public access permitted without authentication tokens.
 * @validates  Returns configured ImageKit CDN endpoint and public key.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class MediaIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void publicMediaConfigEndpoint_returnsOkWithCdnDetails() throws Exception {
        mockMvc.perform(get("/api/public/media/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("imagekit"))
                .andExpect(jsonPath("$.urlEndpoint").value("https://ik.imagekit.io/cyseckush/"))
                .andExpect(jsonPath("$.publicKey").value("public_+grCFOmI0qDm3NTqiEhsvLFrhgc="));
    }

    @Test
    public void publicMediaAuthEndpoint_returnsOk() throws Exception {
        mockMvc.perform(get("/api/public/media/auth"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.urlEndpoint").value("https://ik.imagekit.io/cyseckush/"))
                .andExpect(jsonPath("$.publicKey").value("public_+grCFOmI0qDm3NTqiEhsvLFrhgc="));
    }
}
