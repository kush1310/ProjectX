package com.charusat.canteen;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void unauthenticatedAccessToProtectedEndpoint_returns401() throws Exception {
        mockMvc.perform(get("/api/orders/my-orders"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "student@charusat.edu.in", roles = {"USER"})
    public void userRoleAccessingAdminEndpoint_returns403OrDenied() throws Exception {
        // Access vendor application approve endpoint which requires ADMIN
        mockMvc.perform(post("/api/vendor-applications/1/approve"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void malformedAuthPayload_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"invalid-email\", \"password\": \"short\"}"))
                .andExpect(status().isBadRequest());
    }
}
