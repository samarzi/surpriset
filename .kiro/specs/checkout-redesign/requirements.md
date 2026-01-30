# Requirements Document: Checkout Redesign

## Introduction

Редизайн процесса оформления заказа с упрощенной логикой: все товары добавляются в корзину, обязательный выбор упаковки и дополнительных услуг.

## Glossary

- **Cart**: Корзина покупок
- **Product**: Товар (отдельный товар или готовый набор)
- **Bundle**: Готовый набор товаров
- **Packaging**: Упаковка для заказа
- **Additional_Service**: Дополнительная услуга (открытки, подарочная упаковка и т.д.)
- **Service_Category**: Категория дополнительных услуг
- **Minimum_Order**: Минимальная сумма заказа (2000₽)
- **Checkout_Flow**: Процесс оформления заказа

## Requirements

### Requirement 1: Simplified Cart Logic

**User Story:** As a user, I want to add any products or bundles directly to cart, so that I can build my order without complex bundle creation.

#### Acceptance Criteria

1. WHEN a user clicks "Add to Cart" on any product or bundle, THE System SHALL add it to the cart immediately
2. THE System SHALL remove the "Create Bundle" functionality completely
3. WHEN viewing the cart, THE System SHALL display all added products and bundles with quantities
4. WHEN a user changes quantity in cart, THE System SHALL update the total price immediately
5. THE System SHALL allow removing items from cart

### Requirement 2: Minimum Order Amount

**User Story:** As a business owner, I want to enforce a minimum order amount of 2000₽, so that orders are economically viable.

#### Acceptance Criteria

1. THE System SHALL set minimum order amount to 2000₽
2. WHEN cart total is less than 2000₽, THE System SHALL disable the checkout button
3. WHEN cart total is less than 2000₽, THE System SHALL display a message showing how much more is needed
4. WHEN cart total reaches 2000₽ or more, THE System SHALL enable the checkout button
5. THE System SHALL calculate total based on product prices only (before packaging and services)

### Requirement 3: Packaging Management (Admin)

**User Story:** As an admin, I want to manage packaging options, so that customers can choose appropriate packaging for their orders.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a "Packaging" management section
2. WHEN creating packaging, THE Admin SHALL provide name, price, dimensions, and photo
3. THE System SHALL store packaging with fields: id, name, price, dimensions (width, height, depth), image_url, is_active
4. THE Admin SHALL be able to create, edit, delete, and activate/deactivate packaging options
5. THE System SHALL display only active packaging options to customers

### Requirement 4: Additional Services Management (Admin)

**User Story:** As an admin, I want to manage additional services with categories, so that customers can add extras like cards or gift wrapping.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide an "Additional Services" management section
2. WHEN creating a service, THE Admin SHALL first select or create a Service_Category (e.g., "Cards", "Gift Wrapping")
3. WHEN creating a service, THE Admin SHALL provide name, optional description, price, and photo
4. THE System SHALL store services with fields: id, category_id, name, description, price, image_url, is_active
5. THE Admin SHALL be able to create, edit, delete, and activate/deactivate services
6. THE System SHALL group services by category when displaying to customers

### Requirement 5: Packaging Selection (Checkout)

**User Story:** As a user, I want to select packaging for my order, so that my items are properly protected and presented.

#### Acceptance Criteria

1. WHEN a user clicks checkout, THE System SHALL open a packaging selection modal
2. THE System SHALL display all active packaging options with photos, names, dimensions, and prices
3. THE System SHALL require the user to select exactly one packaging option
4. WHEN no packaging is selected, THE System SHALL prevent proceeding to next step
5. WHEN packaging is selected, THE System SHALL add its price to the order total
6. THE System SHALL allow changing packaging selection before order confirmation

### Requirement 6: Additional Services Selection (Checkout)

**User Story:** As a user, I want to add optional services to my order, so that I can customize my purchase.

#### Acceptance Criteria

1. WHEN packaging is selected, THE System SHALL display additional services section
2. THE System SHALL group services by Service_Category
3. THE System SHALL display each service with photo, name, description, and price
4. THE System SHALL allow selecting multiple services from different categories
5. WHEN a service is selected, THE System SHALL add its price to the order total
6. THE System SHALL allow deselecting services before order confirmation

### Requirement 7: Assembly Service (Default)

**User Story:** As a business owner, I want assembly service included by default, so that labor costs are covered.

#### Acceptance Criteria

1. THE System SHALL include "Assembly Service" in every order by default
2. THE System SHALL define assembly service price in system settings
3. THE System SHALL display assembly service in the order summary
4. THE System SHALL NOT allow removing assembly service from order
5. THE System SHALL add assembly service price to order total

### Requirement 8: Order Summary

**User Story:** As a user, I want to see a complete order summary, so that I know exactly what I'm paying for.

#### Acceptance Criteria

1. THE System SHALL display order summary with all line items
2. THE System SHALL show products/bundles with quantities and prices
3. THE System SHALL show selected packaging with price
4. THE System SHALL show assembly service with price
5. THE System SHALL show selected additional services with prices
6. THE System SHALL show subtotal, and total amount
7. THE System SHALL update summary in real-time when selections change

### Requirement 9: Remove Bundle Creation

**User Story:** As a developer, I want to remove bundle creation functionality, so that the app has simplified logic.

#### Acceptance Criteria

1. THE System SHALL remove "Create Bundle" button from product pages
2. THE System SHALL remove bundle creation modal/page
3. THE System SHALL remove bundle builder logic from codebase
4. THE System SHALL keep bundle display functionality (for pre-made bundles)
5. THE System SHALL maintain backward compatibility with existing bundle products

### Requirement 10: Database Schema

**User Story:** As a developer, I want proper database schema for packaging and services, so that data is stored correctly.

#### Acceptance Criteria

1. THE System SHALL create a `packaging` table with columns: id, name, price, width, height, depth, image_url, is_active, created_at, updated_at
2. THE System SHALL create a `service_categories` table with columns: id, name, created_at, updated_at
3. THE System SHALL create an `additional_services` table with columns: id, category_id, name, description, price, image_url, is_active, created_at, updated_at
4. THE System SHALL create foreign key from additional_services.category_id to service_categories.id
5. THE System SHALL add packaging_id, assembly_service_price to orders table
6. THE System SHALL create `order_services` junction table with columns: id, order_id, service_id, price, created_at

