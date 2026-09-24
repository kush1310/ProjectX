package com.charusat.canteen;

import com.charusat.canteen.service.ImageKitFolderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ImageKitFolderServiceTest
 *
 * Verifies slug sanitization, dynamic vendor path construction,
 * and folder verification reporting logic.
 *
 * @validates  Dynamic vendor folder paths conform to ImageKit naming constraints.
 * @validates  Special characters and spaces in canteen names are sanitized into hyphens.
 */
@SpringBootTest
public class ImageKitFolderServiceTest {

    @Autowired
    private ImageKitFolderService imageKitFolderService;

    @Test
    public void ensureVendorFolder_sanitizesSlugAndConstructsPath() {
        String path = imageKitFolderService.ensureVendorFolder("menu-items", "Campus Bites");
        assertEquals("charusatneeds/menu-items/campus-bites", path);

        String canteenPath = imageKitFolderService.ensureVendorFolder("canteens", "Sweet & Spot Special!");
        assertEquals("charusatneeds/canteens/sweet-spot-special", canteenPath);

        String offersPath = imageKitFolderService.ensureVendorFolder("offers", "patel_puff_canteen");
        assertEquals("charusatneeds/offers/patel_puff_canteen", offersPath);
    }

    @Test
    public void verifyFolderHierarchy_returnsValidStructure() {
        Map<String, Object> report = imageKitFolderService.verifyFolderHierarchy();
        assertNotNull(report);
        assertEquals("imagekit", report.get("provider"));
        assertTrue(report.containsKey("cdnEndpoint"));
    }
}
