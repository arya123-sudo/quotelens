// Synthetic purchasing scenario SCN-2026-001 — 100% fictional.
// No real businesses, people, or money.
export const SCENARIOS = [
  {
    id: "SCN-2026-001",
    title: "50 ceiling fans for a Jaipur electrical shop",
    business: {
      name: "Sharma Electricals",
      location: "Jaipur, Rajasthan",
      need: "50 ceiling fans (1200mm)",
      quantity: 50,
      unit: "units",
    },
    quotes: [
      {
        id: "QT1",
        supplier: "Gupta Traders",
        channel: "whatsapp-image",
        receivedAt: "2026-10-01T10:05:00+05:30",
        rawText:
          "GUPTA TRADERS - Wholesale Electricals\n" +
          "Johari Bazaar, Jaipur | Ph: 90000 11223\n" +
          "QUOTATION\n" +
          "Ceiling Fan 1200mm (High Speed) - Rs 1,900/- Rs 1,850/- per pc\n" +
          "GST 18% extra\n" +
          "Delivery: 7 days (transport Rs 500)\n" +
          "Warranty: 1 saal [illegible] terms\n" +
          "Valid 7 days | Min order: 10 pcs",
        extracted: {
          unitPrice: 1850, gst: "extra", gstRate: 0.18,
          deliveryDays: 7, deliveryCharge: 500,
          warrantyMonths: 12, advancePct: 0, minOrder: 10,
          validDays: 7, perUnit: "pc", perUnitQty: 1, notes: "Transport charged separately",
        },
        unreadable: [
          "warranty terms partially illegible in photo",
          "headline price has a handwritten correction (1900 struck through → 1850); used 1850, flagged for human check",
        ],
      },
      {
        id: "QT2",
        supplier: "Shree Balaji Enterprises",
        channel: "pdf",
        receivedAt: "2026-10-01T11:40:00+05:30",
        rawText:
          "SHREE BALAJI ENTERPRISES\n" +
          "Quotation No. SBE/2610 | Date: 01-10-2026\n" +
          "Item: Ceiling Fan 1200mm Deluxe - Qty 50\n" +
          "Rate: Rs 1,790/- per pc (inclusive of GST)\n" +
          "Delivery: 3 working days, free delivery\n" +
          "Warranty: 6 months\n" +
          "Payment: 50% advance with order\n" +
          "MOQ: 25 pcs\n" +
          "Validity: 5 days",
        extracted: {
          unitPrice: 1790, gst: "included", gstRate: 0.18,
          deliveryDays: 3, deliveryCharge: 0,
          warrantyMonths: 6, advancePct: 50, minOrder: 25,
          validDays: 5, perUnit: "pc", perUnitQty: 1, notes: "50% advance with order",
        },
        unreadable: [],
      },
      {
        id: "QT3",
        supplier: "Khan Suppliers",
        channel: "whatsapp-text",
        receivedAt: "2026-10-01T14:22:00+05:30",
        rawText:
          "Khan Suppliers here bhai. Best rate for 1200mm fan: Rs 1820 per pc + GST 18%.\n" +
          "Free delivery in 5 days. 2 year warranty full.\n" +
          "Minimum order 100 pcs. 25% advance.\n" +
          "Rate valid till Sunday.",
        extracted: {
          unitPrice: 1820, gst: "extra", gstRate: 0.18,
          deliveryDays: 5, deliveryCharge: 0,
          warrantyMonths: 24, advancePct: 25, minOrder: 100,
          validDays: 4, perUnit: "pc", perUnitQty: 1, notes: "Minimum order 100 pcs",
        },
        unreadable: [],
      },
    ],
  },
];

// Exact (unrounded) per-unit cost. Rounding happens once, at display/total time.
function exactUnitCost(q, qty) {
  const e = q.extracted;
  const perBase = e.unitPrice / (e.perUnitQty || 1);
  const withGst = e.gst === "extra" ? perBase * (1 + e.gstRate) : perBase;
  return withGst + e.deliveryCharge / qty;
}

// True per-unit cost: price + GST (if extra) + delivery amortized over quantity.
export function trueUnitCost(q, qty) {
  return Math.round(exactUnitCost(q, qty));
}

export function orderTotal(q, qty) {
  return Math.round(exactUnitCost(q, qty) * qty);
}
