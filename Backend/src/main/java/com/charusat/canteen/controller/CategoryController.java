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
                .canteenId(canteenId)
                .build();

        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
