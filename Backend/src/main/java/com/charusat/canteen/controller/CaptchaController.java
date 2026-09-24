package com.charusat.canteen.controller;

import com.charusat.canteen.service.CaptchaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/captcha")
@RequiredArgsConstructor
public class CaptchaController {

    private final CaptchaService captchaService;

    @GetMapping
    public ResponseEntity<?> getCaptcha() {
        CaptchaService.CaptchaResponse captcha = captchaService.generateCaptcha();
        String img = captcha.imageBase64();
        if (!img.startsWith("data:")) {
            img = "data:image/png;base64," + img;
        }
        return ResponseEntity.ok(Map.of(
            "captchaId", captcha.id(),
            "id", captcha.id(),
            "image", img
        ));
    }
}
