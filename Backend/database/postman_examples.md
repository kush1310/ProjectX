# Postman API Test Examples

> Base URL: `http://localhost:8000`
> All authenticated endpoints require header: `Authorization: Bearer <JWT_TOKEN>`

---

## 1. Place Order (Spec Format)

**POST** `/api/orders/place`

```json
{
  "customerId": 1,
  "restaurantId": 1,
  "items": [
    { "foodItemId": 1, "quantity": 2 },
    { "foodItemId": 3, "quantity": 1 }
  ],
  "paymentMethod": "upi"
}
```

**Expected Response (200):**
```json
{
  "orderId": 101,
  "status": "PENDING",
  "success": true,
  "order": {
    "id": 101,
    "orderNumber": "ORD-A1B2C3D4",
    "status": "PENDING",
    "totalAmount": 310.00,
    "items": [...]
  }
}
```

---

## 2. Place Order (Original Format)

**POST** `/api/orders`

```json
{
  "canteenId": 1,
  "menuItemIds": [1, 3],
  "quantities": [2, 1],
  "paymentMethod": "cash",
  "instructions": "Extra spicy please",
  "couponCode": "SAVE20"
}
```

> Note: `customerId` is auto-resolved from JWT token.

---

## 3. Get Orders for Restaurant/Canteen

**GET** `/api/orders/restaurant/1`
— or equivalently —
**GET** `/api/orders/canteen/1`

**Expected Response (200):**
```json
[
  {
    "id": 101,
    "orderNumber": "ORD-A1B2C3D4",
    "status": "PENDING",
    "totalAmount": 310.00,
    "customer": { "id": 1, "fullName": "Akshar Patel", ... },
    "items": [...]
  }
]
```

---

## 4. Update Order Status

**PUT** `/api/orders/101/status`

```json
{
  "status": "PREPARING"
}
```

**Status Flow:** `PENDING` → `CONFIRMED` / `ACCEPTED` → `PREPARING` → `READY` / `OUT_FOR_DELIVERY` → `COMPLETED` / `DELIVERED`
**Cancel:** Set status to `CANCELLED` with optional `rejectionReason`.

---

## 5. Get Customer Orders

**GET** `/api/orders/customer/1`

---

## 6. Get My Orders (JWT-authenticated)

**GET** `/api/orders/my-orders`
> Automatically returns orders based on user role (customer/vendor/admin).

---

## 7. Get Active Orders for Canteen

**GET** `/api/orders/canteen/1/active`

---

## 8. Cancel Order

**POST** `/api/orders/101/cancel`

---

## WebSocket Connection

**Endpoint:** `ws://localhost:8000/ws` (STOMP over WebSocket, no SockJS needed)

### Subscribe Topics:
| Topic | Purpose |
|-------|---------|
| `/topic/orders` | Global new order feed (for vendor dashboard) |
| `/topic/order-updates` | Global status update feed |
| `/topic/restaurant/{canteenId}` | Per-restaurant new orders + status changes |
| `/topic/customer/{customerId}` | Per-customer status updates |

### Sample NEW_ORDER Event:
```json
{
  "enc": "<AES-256-GCM encrypted payload>"
}
```
Decrypted payload:
```json
{
  "type": "NEW_ORDER",
  "orderId": 101,
  "orderNumber": "ORD-A1B2C3D4",
  "customerName": "Akshar Patel",
  "customerPhone": "9876543210",
  "status": "PENDING",
  "totalAmount": 310.00,
  "items": [
    { "name": "Masala Dosa", "quantity": 2, "unitPrice": 80, "totalPrice": 160 },
    { "name": "Veg Biryani", "quantity": 1, "unitPrice": 150, "totalPrice": 150 }
  ],
  "customer": { "id": 1, "fullName": "Akshar Patel", "mobile": "9876543210" },
  "canteen": { "id": 1, "name": "DEPSTAR Canteen", "location": "DEPSTAR Building" }
}
```

### Sample ORDER_STATUS_UPDATE Event:
```json
{
  "type": "ORDER_STATUS_UPDATE",
  "orderId": 101,
  "status": "PREPARING",
  "restaurantContact": "DEPSTAR Canteen",
  "canteen": { "id": 1, "name": "DEPSTAR Canteen" }
}
```
