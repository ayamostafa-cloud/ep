# Payroll Configuration System - Workflow Documentation

## Overview
The Payroll Configuration System manages 6 types of payroll configurations, each following a **Draft → Approval** workflow. All configurations require payroll manager approval before being published/activated.

---

## Configuration Status Flow

```
DRAFT → (Edit Allowed) → APPROVED → (Edit Blocked)
  ↓
REJECTED → (Can be edited back to DRAFT)
```

### Status Rules:
- **DRAFT**: Initial status when created. Editing is allowed.
- **APPROVED**: Configuration is active and published. Editing is blocked.
- **REJECTED**: Configuration was rejected. Can be edited to return to DRAFT.

---

## Architecture Components

### 1. **Controller Layer** (`payroll-configuration.controller.ts`)
   - Handles HTTP requests/responses
   - Validates query parameters (status filters)
   - Routes requests to appropriate service methods

### 2. **Service Layer** (`payroll-configuration.service.ts`)
   - Contains business logic
   - Enforces status-based rules
   - Interacts with MongoDB models
   - Handles data sanitization

### 3. **Model Layer** (Schema files)
   - Defines data structure
   - Enforces validation rules
   - Default status: `DRAFT`

---

## Workflow for Each Configuration Type

### Configuration Types:
1. **Payroll Policies** (`payrollPolicies`)
2. **Pay Grades** (`payGrade`)
3. **Pay Types** (`payType`)
4. **Allowances** (`allowance`)
5. **Signing Bonuses** (`signingBonus`)
6. **Termination/Resignation Benefits** (`terminationAndResignationBenefits`)

---

## 1. CREATE Workflow

### Endpoint Pattern:
```
POST /payroll-configuration/{resource}
```

### Flow:
```
1. Controller receives POST request with payload
   ↓
2. Service method called (e.g., createPayrollPolicy)
   ↓
3. Get MongoDB model for collection
   ↓
4. Create new document with:
   - User-provided payload
   - status: DRAFT (automatically set)
   ↓
5. Save to database
   ↓
6. Return created document
```

### Example: Creating a Payroll Policy
```
POST /payroll-configuration/payroll-policies
Body: {
  policyName: "Overtime Policy",
  policyType: "ALLOWANCE",
  description: "...",
  effectiveDate: "2025-01-01",
  ruleDefinition: {...},
  applicability: "All Employees"
}

→ Service creates document with status: "draft"
→ Returns document with _id and timestamps
```

### Business Rules:
- ✅ Status is **always** set to `DRAFT` on creation
- ✅ All required fields must be provided (enforced by schema)
- ✅ Unique constraints are validated (e.g., unique policy names)

---

## 2. VIEW Workflow

### Endpoints Pattern:
```
GET /payroll-configuration/{resource}           # List all
GET /payroll-configuration/{resource}/:configId # Get one
```

### Flow for List:
```
1. Controller receives GET request (optional ?status=draft)
   ↓
2. Normalize status filter (validate enum value)
   ↓
3. Service method called (e.g., listPayrollPolicies)
   ↓
4. Build filter object:
   - If status provided: { status: "draft" }
   - If no status: {} (returns all)
   ↓
5. Query database with filter
   ↓
6. Sort by createdAt (newest first)
   ↓
7. Return array of documents
```

### Flow for Get One:
```
1. Controller receives GET request with configId
   ↓
2. Service method called (e.g., getPayrollPolicy)
   ↓
3. Find document by ID
   ↓
4. If not found → NotFoundException
   ↓
5. Return document
```

### Example: Listing Draft Policies
```
GET /payroll-configuration/payroll-policies?status=draft

→ Returns all policies with status: "draft"
→ Sorted by creation date (newest first)
```

---

## 3. EDIT Workflow

### Endpoint Pattern:
```
PATCH /payroll-configuration/{resource}/:configId
```

### Flow:
```
1. Controller receives PATCH request with payload
   ↓
2. Service method called (e.g., updatePayrollPolicy)
   ↓
3. Validate payload is not empty
   ↓
4. Sanitize payload (remove non-editable fields):
   - Remove: status, approvedBy, approvedAt, _id, createdAt, updatedAt
   ↓
5. Call editConfiguration() method
   ↓
6. Get MongoDB model for collection
   ↓
7. Find existing document by ID
   ↓
8. Check if document exists → NotFoundException if not
   ↓
9. ⚠️ CRITICAL CHECK: Verify status === DRAFT
   - If NOT DRAFT → BadRequestException
   - If DRAFT → Continue
   ↓
10. Update document with sanitized payload
   ↓
11. Return updated document
```

### Example: Editing a Draft Policy
```
PATCH /payroll-configuration/payroll-policies/123
Body: {
  payload: {
    policyName: "Updated Policy Name",
    description: "New description"
  }
}

→ Checks if status is "draft"
→ If approved/rejected → Error: "Configuration can only be edited when status is draft"
→ If draft → Updates allowed fields
→ Returns updated document
```

### Business Rules:
- ✅ **Only DRAFT configurations can be edited**
- ✅ Status, approval fields, and timestamps cannot be modified via edit
- ✅ Empty payloads are rejected
- ✅ Non-existent configurations return 404

---

## 4. Generic editConfiguration() Method

This is the core method used by all update operations (except insurance brackets):

```typescript
async editConfiguration(collection, configId, payload) {
  1. Special case: insuranceBrackets → delegate to specific method
  2. Get model for collection
  3. Validate payload not empty
  4. Find existing document
  5. Check if exists → NotFoundException
  6. ⚠️ Check status === DRAFT → BadRequestException if not
  7. Sanitize payload (remove protected fields)
  8. Update document
  9. Return updated document
}
```

---

## 5. Helper Methods

### sanitizePayload()
Removes protected fields that cannot be edited directly:
- `status`
- `approvedBy`
- `approvedAt`
- `_id`
- `createdAt`
- `updatedAt`

### getModel(collection)
- Validates collection name is supported
- Checks database connection
- Returns MongoDB model for the collection

### normalizeStatusFilter()
- Validates status query parameter
- Converts to lowercase
- Checks against ConfigStatus enum
- Returns validated status or undefined

---

## Status-Based Access Control Matrix

| Operation | DRAFT | APPROVED | REJECTED |
|-----------|-------|----------|----------|
| **Create** | ✅ Always | - | - |
| **View** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Edit** | ✅ Allowed | ❌ Blocked | ❌ Blocked* |
| **Delete** | ✅ Allowed | ❌ Blocked | ✅ Allowed |

*Note: Rejected items can be edited if changed back to DRAFT first (via approval workflow)

---

## Error Handling

### Common Exceptions:

1. **BadRequestException**
   - Empty payload on update
   - Trying to edit non-DRAFT configuration
   - Invalid status filter value
   - Missing required fields

2. **NotFoundException**
   - Configuration ID not found
   - Document doesn't exist

3. **ForbiddenException**
   - Trying to delete approved configuration

4. **InternalServerErrorException**
   - Database connection unavailable

---

## Data Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ↓
┌──────────────────────┐
│   Controller         │
│  - Route handling    │
│  - Query validation │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│   Service            │
│  - Business logic    │
│  - Status checks     │
│  - Data sanitization │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│   MongoDB Model      │
│  - Schema validation │
│  - Data persistence  │
└──────────────────────┘
```

---

## Example Complete Workflow: Creating and Editing a Pay Grade

### Step 1: Create Pay Grade
```
POST /payroll-configuration/pay-grades
{
  grade: "Senior Developer",
  baseSalary: 15000,
  grossSalary: 20000
}

Response:
{
  _id: "507f1f77bcf86cd799439011",
  grade: "Senior Developer",
  baseSalary: 15000,
  grossSalary: 20000,
  status: "draft",  ← Automatically set
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z"
}
```

### Step 2: View Pay Grade
```
GET /payroll-configuration/pay-grades/507f1f77bcf86cd799439011

Response: (same as above)
```

### Step 3: Edit Pay Grade (while DRAFT)
```
PATCH /payroll-configuration/pay-grades/507f1f77bcf86cd799439011
{
  payload: {
    baseSalary: 16000,
    grossSalary: 21000
  }
}

Response:
{
  _id: "507f1f77bcf86cd799439011",
  grade: "Senior Developer",
  baseSalary: 16000,  ← Updated
  grossSalary: 21000, ← Updated
  status: "draft",     ← Still draft
  updatedAt: "2025-01-15T11:00:00Z"  ← Updated
}
```

### Step 4: Try to Edit After Approval (would fail)
```
PATCH /payroll-configuration/pay-grades/507f1f77bcf86cd799439011
{
  payload: { baseSalary: 17000 }
}

Error Response:
{
  statusCode: 400,
  message: "Configuration can only be edited when status is draft"
}
```

---

## Key Design Principles

1. **Status-Based Editing**: Only DRAFT configurations can be modified
2. **Automatic Status Assignment**: All new configurations start as DRAFT
3. **Data Protection**: Protected fields cannot be modified via edit operations
4. **Consistent API**: All 6 configuration types follow the same pattern
5. **Validation**: Input validation at both controller and service layers
6. **Error Clarity**: Specific error messages for different failure scenarios

---

## Future Enhancements (Not Yet Implemented)

- Approval workflow endpoints (approve/reject)
- Audit trail for status changes
- Bulk operations
- Configuration versioning
- Rollback capabilities

