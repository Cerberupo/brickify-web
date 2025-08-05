# Brickify User Flow

This document describes the complete user flow for the Brickify service, from group creation to order delivery.

## Group Creation and Order Process

### 1. Group Creation
- User creates a new group
- Initial status: `needsMoreUsers`
- Message: "Needs X more users to place order"
- A minimum of 25 users is required to place an order

### 2. Adding Users
- Users are added to the group
- If there are less than 25 users, status remains: `needsMoreUsers`
- Once 25 users are added, the system checks if all users have completed profiles

### 3. Completing User Profiles
- If some users have incomplete profiles (e.g., missing required images)
- Status: `needsCompletedUsers`
- Message: "X users need to complete their profile"
- All 25 users must have complete profiles to proceed

### 4. Ready for Payment
- Once all 25 users have complete profiles
- Status: `readyForPayment`
- Message: "Ready for payment"
- The group creator needs to make the payment to proceed

### 5. Order Processing
- After payment is received
- Status: `inProcess`
- Message: "Order in process - Selecting pieces"
- Brickify team selects appropriate Lego pieces for each person based on their photos

### 6. Customer Approval
- Once all pieces are selected
- Status: `waitingForApproval`
- Message: "Waiting for your approval"
- An email is sent to the group creator to review and approve the selected pieces

### 7. Order Placement
- After customer approval
- Status: `orderPlaced`
- Message: "Order placed with Lego"
- Brickify places the order with Lego
- If some pieces are out of stock, Brickify selects alternative pieces

### 8. Order Placement Issues
- When Lego doesn't send all the requested pieces correctly
- Status: `orderIncomplete`
- Message: "Order placed with Lego - Some pieces missing or incorrect"
- Brickify identifies missing or incorrect pieces and works to resolve the issue
- This status allows the frontend to display additional information about the issue

### 9. Order Review
- When the order arrives from Lego
- Status: `inReview`
- Message: "Order received - Checking pieces"
- Brickify checks that all requested pieces have been received
- If pieces are missing, Brickify contacts Lego for replacements

### 10. Assembly
- Once all pieces are available
- Status: `inAssembly`
- Message: "Assembling your Lego figures"
- Brickify assembles the Lego figures for each person and packages them

### 11. Ready for Shipment
- When assembly is complete
- Status: `readyForShipment`
- Message: "Ready for shipment"
- The order is packaged and ready to be shipped

### 12. Shipped
- When the order has been shipped
- Status: `shipped`
- Message: "Order shipped"
- The Lego figures are on their way to the customer

## Legacy Statuses

For backward compatibility, the following legacy statuses are still supported:

- `pending`: Generic pending status
- `inProgress`: Generic in-progress status
- `completed`: Generic completed status

These statuses may be used in older parts of the system but are being phased out in favor of the more specific statuses described above.
