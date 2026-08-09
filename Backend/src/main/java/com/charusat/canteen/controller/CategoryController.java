package com.charusat.canteen.controller;

import com.charusat.canteen.model.Canteen;
import com.charusat.canteen.model.Category;
import com.charusat.canteen.repository.CanteenRepository;
import com.charusat.canteen.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final CanteenRepository canteenRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    @GetMapping("/canteen/{canteenId}")
    public ResponseEntity<List<Category>> getCategories(@PathVariable Long canteenId) {
        return ResponseEntity.ok(categoryRepository.findByCanteenId(canteenId));
    }

    @PostMapping("/canteen/{canteenId}")
    public ResponseEntity<?> createCategory(@PathVariable Long canteenId, @RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Category name is required"));
        }

        if (categoryRepository.existsByNameAndCanteenId(name, canteenId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Category already exists"));
        }

        Canteen canteen = canteenRepository.findById(canteenId)
                .orElseThrow(() -> new RuntimeException("Canteen not found"));

        Category category = Category.builder()
                .name(name)
                .canteen(canteen)
                .isAvailable(true)
                .build();

        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @PatchMapping("/{id}/stock-status")
    public ResponseEntity<?> updateStockStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Boolean inStock = body.getOrDefault("inStock", body.getOrDefault("isAvailable", true));
        Category category = categoryRepository.findById(id).orElse(null);
        if (category == null) {
            return ResponseEntity.notFound().build();
        }
        categoryRepository.updateAvailability(id, inStock);
        category.setIsAvailable(inStock);

        // Also update items under this category if canteenId and name present
        if (category.getCanteenId() != null && category.getName() != null) {
            try {
                jdbc.update("UPDATE menu_items SET is_available = ? WHERE canteen_id = ? AND category = ?",
                        inStock, category.getCanteenId(), category.getName());
            } catch (Exception e) {
                // Ignore if menu_items update encounters an issue
            }
        }

        return ResponseEntity.ok(Map.of("success", true, "inStock", inStock, "category", category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
