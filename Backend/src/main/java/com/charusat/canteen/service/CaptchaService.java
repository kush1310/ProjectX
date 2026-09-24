package com.charusat.canteen.service;

import org.springframework.stereotype.Service;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class CaptchaService {

    private final Map<String, CaptchaEntry> captchaStore = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor();

    public CaptchaService() {
        // Cleanup expired captchas every 10 minutes
        cleanupExecutor.scheduleAtFixedRate(this::cleanupExpired, 10, 10, TimeUnit.MINUTES);
    }

    public record CaptchaResponse(String id, String imageBase64) {}

    private record CaptchaEntry(String code, long expiryTime) {}

    public CaptchaResponse generateCaptcha() {
        String code = generateRandomCode(6);
        String id = UUID.randomUUID().toString();
        
        // Store with 5 minute expiry
        captchaStore.put(id, new CaptchaEntry(code, System.currentTimeMillis() + 300000));
        
        String imageBase64;
        try {
            imageBase64 = generateCaptchaImage(code);
        } catch (Throwable t) {
            imageBase64 = generateSvgCaptchaImage(code);
        }
        return new CaptchaResponse(id, imageBase64);
    }

    public boolean validateCaptcha(String id, String answer) {
        if (id == null || answer == null) return false;
        
        CaptchaEntry entry = captchaStore.get(id);
        if (entry == null) return false;
        
        // Remove after use (one-time use)
        captchaStore.remove(id);
        
        if (System.currentTimeMillis() > entry.expiryTime) {
            return false;
        }
        
        return entry.code.equalsIgnoreCase(answer.trim());
    }

    private void cleanupExpired() {
        long now = System.currentTimeMillis();
        captchaStore.entrySet().removeIf(entry -> now > entry.getValue().expiryTime);
    }

    private String generateRandomCode(int length) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude I, O, 1, 0
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            int index = (int) (Math.random() * chars.length());
            sb.append(chars.charAt(index));
        }
        return sb.toString();
    }

    private String generateCaptchaImage(String code) {
        int width = 160;
        int height = 50;
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        // Rendering hints
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Background
        g.setColor(new Color(245, 245, 245));
        g.fillRect(0, 0, width, height);

        // Noise
        g.setColor(new Color(200, 200, 200));
        for (int i = 0; i < 20; i++) {
            int x1 = (int) (Math.random() * width);
            int y1 = (int) (Math.random() * height);
            int x2 = (int) (Math.random() * width);
            int y2 = (int) (Math.random() * height);
            g.drawLine(x1, y1, x2, y2);
        }

        // Text
        g.setFont(new Font("Arial", Font.BOLD, 32));
        for (int i = 0; i < code.length(); i++) {
            g.setColor(new Color((int)(Math.random() * 100), (int)(Math.random() * 100), (int)(Math.random() * 100)));
            int x = 20 + i * 20;
            int y = 35 + (int) (Math.random() * 10 - 5);
            g.drawString(String.valueOf(code.charAt(i)), x, y);
        }

        g.dispose();

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate captcha image", e);
        }
    }

    private String generateSvgCaptchaImage(String code) {
        int width = 160;
        int height = 50;
        StringBuilder sb = new StringBuilder();
        sb.append("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"50\" viewBox=\"0 0 160 50\">");
        sb.append("<rect width=\"100%\" height=\"100%\" fill=\"#f5f5f5\" rx=\"10\" stroke=\"#e5e7eb\" stroke-width=\"1.5\"/>");

        // Noise lines
        for (int i = 0; i < 15; i++) {
            int x1 = (int) (Math.random() * width);
            int y1 = (int) (Math.random() * height);
            int x2 = (int) (Math.random() * width);
            int y2 = (int) (Math.random() * height);
            sb.append("<line x1=\"").append(x1).append("\" y1=\"").append(y1)
              .append("\" x2=\"").append(x2).append("\" y2=\"").append(y2)
              .append("\" stroke=\"#d1d5db\" stroke-width=\"1\" opacity=\"0.6\"/>");
        }

        // Characters with rotation and colors
        String[] colors = {"#1e293b", "#0f172a", "#334155", "#b91c1c", "#1d4ed8", "#047857"};
        for (int i = 0; i < code.length(); i++) {
            char c = code.charAt(i);
            int x = 16 + i * 22;
            int y = 34 + (int) (Math.random() * 6 - 3);
            int rotate = (int) (Math.random() * 16 - 8);
            String color = colors[(int) (Math.random() * colors.length)];
            sb.append("<text x=\"").append(x).append("\" y=\"").append(y)
              .append("\" font-family=\"Courier New, monospace, sans-serif\" font-size=\"24\" font-weight=\"bold\" fill=\"")
              .append(color).append("\" transform=\"rotate(").append(rotate).append(" ").append(x).append(" ").append(y)
              .append(")\">").append(c).append("</text>");
        }
        sb.append("</svg>");
        return "data:image/svg+xml;base64," + Base64.getEncoder().encodeToString(sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}
