import re

path = r'D:\CharusatNeeds_SGP_today\CharusatNeeds_SGP\Backend\src\main\java\com\charusat\canteen\controller\CouponController.java'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = '''    @PostMapping("/create")
    public ResponseEntity<CouponResponse> createCoupon(@Valid @RequestBody CreateCouponRequest request) {
        log.info("Creating coupon: {} (type: {})", request.getCouponCode(), request.getCouponType());
        CouponResponse response = couponService.createCoupon(request);
        return ResponseEntity.ok(response);
    }'''

new = '''    @PostMapping("/create")
    public ResponseEntity<?> createCoupon(@Valid @RequestBody CreateCouponRequest request) {
        log.info("Creating coupon: {} (type: {})", request.getCouponCode(), request.getCouponType());
        try {
            CouponResponse response = couponService.createCoupon(request);
            return ResponseEntity.ok(response);
        } catch (com.charusat.canteen.exception.BadRequestException e) {
            log.warn("Coupon creation rejected: {}", e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Coupon creation failed for code \'{}\': {}", request.getCouponCode(), e.getMessage(), e);
            String msg = e.getMessage() != null ? e.getMessage() : "Internal server error creating coupon";
            return ResponseEntity.status(500).body(java.util.Map.of("success", false, "message", msg));
        }
    }'''

# Normalize line endings for matching
content_normalized = content.replace('\r\n', '\n').replace('\r', '\n')
old_normalized = old.replace('\r\n', '\n').replace('\r', '\n')
new_normalized = new.replace('\r\n', '\n').replace('\r', '\n')

if old_normalized in content_normalized:
    result = content_normalized.replace(old_normalized, new_normalized)
    # Write back with original line endings
    with open(path, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(result)
    print("SUCCESS: CouponController.java patched.")
else:
    print("ERROR: Old string not found. Printing first 200 chars around 'createCoupon':")
    idx = content_normalized.find('createCoupon')
    print(repr(content_normalized[max(0,idx-100):idx+300]))
