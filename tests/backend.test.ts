/**
 * Automated Backend Logic Test Suite
 * Tests core business rules: authoritative server price calculations,
 * variant resolution, stock checks, input validation, and status transitions.
 */

import { db } from '../src/server/db.ts';

async function runTests() {
  console.log('🧪 Starting Backend Logic Test Suite...\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      failedCount++;
    }
  }

  // Reset database to ensure clean test state
  db.resetDemoData();

  // --- Test 1: Authoritative Server Price Calculation & Variants ---
  try {
    const calc = db.calculateServerOrder([
      {
        itemId: 'truffle-pappardelle',
        variantId: 'full', // Full Plate is $26.50
        quantity: 2,
      },
      {
        itemId: 'woodfired-margherita',
        variantId: 'regular', // 10" Personal is $15.50
        quantity: 1,
      },
    ]);

    const expectedSubtotal = 26.50 * 2 + 15.50; // 53.00 + 15.50 = 68.50
    const expectedTax = Math.round(68.50 * 0.05 * 100) / 100; // 3.43
    const expectedTotal = Math.round((68.50 + 3.43) * 100) / 100; // 71.93

    assert(
      calc.subtotal === expectedSubtotal && calc.totalAmount === expectedTotal,
      'Test 1: Server computes accurate pricing based on database variants and 5% tax',
      `Calculated: subtotal=${calc.subtotal}, total=${calc.totalAmount}; Expected: subtotal=${expectedSubtotal}, total=${expectedTotal}`
    );
  } catch (err: any) {
    assert(false, 'Test 1: Server price calculation', err.message);
  }

  // --- Test 2: Out of Stock Item Rejection ---
  try {
    // Temporarily mark Truffle Pappardelle out of stock
    db.toggleItemAvailability('truffle-pappardelle', false);

    let errorCaught = false;
    try {
      db.createOrder({
        orderType: 'dine_in',
        tableNumber: 3,
        items: [
          {
            itemId: 'truffle-pappardelle',
            variantId: 'half',
            quantity: 1,
          },
        ],
      });
    } catch (err: any) {
      errorCaught = true;
      assert(
        err.message.includes('out of stock'),
        'Test 2: Rejects orders containing out-of-stock items with clear error',
        `Error message: ${err.message}`
      );
    }

    if (!errorCaught) {
      assert(false, 'Test 2: Out of stock item rejection', 'Expected error was not thrown');
    }

    // Restore availability
    db.toggleItemAvailability('truffle-pappardelle', true);
  } catch (err: any) {
    assert(false, 'Test 2: Out of stock item rejection', err.message);
  }

  // --- Test 3: Input Validation for Order Types (Dine-in Table vs Takeaway Customer) ---
  try {
    // A: Dine-in missing table number
    let missingTableCaught = false;
    try {
      db.createOrder({
        orderType: 'dine_in',
        tableNumber: undefined,
        items: [{ itemId: 'woodfired-margherita', quantity: 1 }],
      });
    } catch (err: any) {
      missingTableCaught = true;
      assert(
        err.message.includes('valid table number'),
        'Test 3A: Enforces required valid table number for dine-in orders',
        err.message
      );
    }
    if (!missingTableCaught) assert(false, 'Test 3A: Enforces table number', 'No error thrown');

    // B: Takeaway missing contact info
    let missingContactCaught = false;
    try {
      db.createOrder({
        orderType: 'takeaway',
        customerName: '',
        customerPhone: '',
        items: [{ itemId: 'woodfired-margherita', quantity: 1 }],
      });
    } catch (err: any) {
      missingContactCaught = true;
      assert(
        err.message.includes('customer name') || err.message.includes('phone'),
        'Test 3B: Enforces customer name & phone for takeaway orders',
        err.message
      );
    }
    if (!missingContactCaught) assert(false, 'Test 3B: Enforces customer info', 'No error thrown');
  } catch (err: any) {
    assert(false, 'Test 3: Input validation', err.message);
  }

  // --- Test 4: Order Status Workflow Progression ---
  try {
    const order = db.createOrder({
      orderType: 'dine_in',
      tableNumber: 8,
      items: [
        {
          itemId: 'wagyu-smash-burger',
          variantId: 'single',
          quantity: 1,
        },
      ],
    });

    assert(order.status === 'received', 'Test 4A: Initial order status is "received"');

    const prepOrder = db.updateOrderStatus(order.id, 'preparing', 'Chef starting grill');
    assert(
      prepOrder.status === 'preparing' && prepOrder.statusHistory.length === 2,
      'Test 4B: Transition to "preparing" updates state and logs history'
    );

    const readyOrder = db.updateOrderStatus(order.id, 'ready', 'Plated for runner');
    assert(readyOrder.status === 'ready', 'Test 4C: Transition to "ready" succeeds');

    const servedOrder = db.updateOrderStatus(order.id, 'served', 'Delivered to Table 8');
    assert(
      servedOrder.status === 'served' && servedOrder.statusHistory.length === 4,
      'Test 4D: Transition to "served" marks final lifecycle state'
    );
  } catch (err: any) {
    assert(false, 'Test 4: Status progression workflow', err.message);
  }

  // --- Test 5: Quantity Boundary & Security Validation ---
  try {
    let invalidQtyCaught = false;
    try {
      db.calculateServerOrder([
        {
          itemId: 'truffle-pappardelle',
          quantity: -3, // Negative quantity attack
        },
      ]);
    } catch (err: any) {
      invalidQtyCaught = true;
      assert(
        err.message.includes('Invalid quantity'),
        'Test 5: Server rejects non-positive or negative quantities',
        err.message
      );
    }
    if (!invalidQtyCaught) assert(false, 'Test 5: Quantity validation', 'Did not catch negative quantity');
  } catch (err: any) {
    assert(false, 'Test 5: Quantity boundary validation', err.message);
  }

  // --- Test 6: Analytics Aggregation ---
  try {
    const analytics = db.getAnalytics();
    assert(
      typeof analytics.todayRevenue === 'number' &&
      analytics.todayRevenue > 0 &&
      analytics.todayOrdersCount > 0 &&
      Array.isArray(analytics.popularItems) &&
      analytics.statusBreakdown.received !== undefined &&
      analytics.satisfactionSummary !== undefined &&
      typeof analytics.satisfactionSummary.averageRating === 'number',
      'Test 6: Admin analytics compiles revenue, counts, and satisfaction summary accurately',
      `Revenue: $${analytics.todayRevenue}, Orders: ${analytics.todayOrdersCount}, CSAT: ${analytics.satisfactionSummary.averageRating}`
    );
  } catch (err: any) {
    assert(false, 'Test 6: Analytics compilation', err.message);
  }

  // --- Test 7: Customer Satisfaction Rating on Served Order ---
  try {
    // Create an order and move it to served
    const testOrder = db.createOrder({
      orderType: 'dine_in',
      tableNumber: 11,
      items: [{ itemId: 'truffle-pappardelle', variantId: 'half', quantity: 1 }],
    });

    db.updateOrderStatus(testOrder.id, 'preparing');
    db.updateOrderStatus(testOrder.id, 'ready');
    db.updateOrderStatus(testOrder.id, 'served');

    const rated = db.rateOrder(testOrder.id, {
      rating: 5,
      aspects: ['⚡ Fast Service', '🔥 Served Piping Hot'],
      comment: 'Delicious pasta, served fast!',
    });

    assert(
      rated.rating !== undefined &&
      rated.rating.rating === 5 &&
      rated.rating.aspects.includes('⚡ Fast Service') &&
      rated.rating.comment === 'Delicious pasta, served fast!',
      'Test 7: Successfully submits satisfaction rating for served order with aspects & comment'
    );
  } catch (err: any) {
    assert(false, 'Test 7: Customer satisfaction rating submission', err.message);
  }

  // --- Test 8: Rating Guards for Unserved Orders & Invalid Star Range ---
  try {
    // A: Attempt rating on unserved order (status = 'received')
    const unservedOrder = db.createOrder({
      orderType: 'dine_in',
      tableNumber: 12,
      items: [{ itemId: 'woodfired-margherita', quantity: 1 }],
    });

    let unservedGuardCaught = false;
    try {
      db.rateOrder(unservedOrder.id, { rating: 5 });
    } catch (err: any) {
      unservedGuardCaught = true;
      assert(
        err.message.includes('after your order has been served'),
        'Test 8A: Rejects rating submission on orders that are not yet served',
        err.message
      );
    }
    if (!unservedGuardCaught) {
      assert(false, 'Test 8A: Rejects rating on unserved order', 'No error thrown');
    }

    // B: Attempt rating with out-of-range star score (e.g. 7 stars or 0 stars)
    let invalidScoreCaught = false;
    try {
      db.updateOrderStatus(unservedOrder.id, 'preparing');
      db.updateOrderStatus(unservedOrder.id, 'ready');
      db.updateOrderStatus(unservedOrder.id, 'served');
      db.rateOrder(unservedOrder.id, { rating: 7 }); // Invalid > 5
    } catch (err: any) {
      invalidScoreCaught = true;
      assert(
        err.message.includes('between 1 and 5'),
        'Test 8B: Rejects rating submission with out-of-bounds star score (> 5 or < 1)',
        err.message
      );
    }
    if (!invalidScoreCaught) {
      assert(false, 'Test 8B: Rejects out-of-bounds star score', 'No error thrown');
    }
  } catch (err: any) {
    assert(false, 'Test 8: Rating guards validation', err.message);
  }

  // --- Test 9: Customer Past Orders History Retrieval ---
  try {
    // Sandy Jaiswal has pre-seeded orders (order-seed-101 and order-seed-100)
    const sandyOrders = db.getCustomerOrders({ email: 'sandy@example.com' });
    assert(
      Array.isArray(sandyOrders) && sandyOrders.length >= 2,
      'Test 9A: Retrieves past orders history for authenticated customer by email',
      `Found ${sandyOrders.length} orders for sandy@example.com`
    );

    const sandyById = db.getCustomerOrders({ customerId: 'cust-1' });
    assert(
      sandyById.length === sandyOrders.length,
      'Test 9B: Customer lookup by customerId matches email lookup',
      `ID count: ${sandyById.length}, Email count: ${sandyOrders.length}`
    );

    // Marcus Vance has order-seed-103
    const marcusOrders = db.getCustomerOrders({ customerId: 'cust-2' });
    assert(
      marcusOrders.length >= 1 && marcusOrders[0].customerName === 'Marcus Vance',
      'Test 9C: Retrieves past orders for second customer profile (Marcus Vance)',
      `Found ${marcusOrders.length} orders for Marcus Vance`
    );

    // Isolated guest with no orders returns empty array without throwing
    const emptyOrders = db.getCustomerOrders({ email: 'newguest@example.com' });
    assert(
      Array.isArray(emptyOrders) && emptyOrders.length === 0,
      'Test 9D: Returns clean empty array for guest with no dining history'
    );
  } catch (err: any) {
    assert(false, 'Test 9: Customer past orders retrieval', err.message);
  }

  // --- Test 10: Reordering Calculation & Stock Protection ---
  try {
    const historicalOrder = db.getCustomerOrders({ customerId: 'cust-1' })[0];
    assert(!!historicalOrder, 'Test 10A: Historical order exists for reordering test');

    // Extract items as if user clicked "Reorder"
    const reorderPayloadItems = historicalOrder.items.map((it) => ({
      itemId: it.itemId,
      variantId: it.variantId,
      quantity: it.quantity,
    }));

    const serverCalc = db.calculateServerOrder(reorderPayloadItems);
    assert(
      serverCalc.subtotal === historicalOrder.subtotal,
      'Test 10B: Server calculates identical authoritative price for reordered dishes',
      `Subtotal: ${serverCalc.subtotal}, Expected: ${historicalOrder.subtotal}`
    );

    // Place reorder for table 6
    const reorderedOrder = db.createOrder({
      orderType: 'dine_in',
      tableNumber: 6,
      customerId: 'cust-1',
      customerName: 'Sandy Jaiswal',
      customerEmail: 'sandy@example.com',
      items: reorderPayloadItems,
    });

    assert(
      reorderedOrder.status === 'received' && reorderedOrder.totalAmount === historicalOrder.totalAmount,
      'Test 10C: Successfully placed 1-click reorder with authoritative pricing and linked customerId',
      `Order #${reorderedOrder.orderNumber}, Total: $${reorderedOrder.totalAmount}`
    );

    // Verify it immediately appears in the customer's history
    const updatedHistory = db.getCustomerOrders({ customerId: 'cust-1' });
    assert(
      updatedHistory.some((o) => o.id === reorderedOrder.id),
      'Test 10D: Placed reorder immediately reflects in customer past orders history'
    );
  } catch (err: any) {
    assert(false, 'Test 10: Reordering logic', err.message);
  }

  console.log(`\n==========================================`);
  console.log(`Test Results: ${passedCount} passed, ${failedCount} failed`);
  console.log(`==========================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
