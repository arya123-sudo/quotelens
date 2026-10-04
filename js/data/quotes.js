// Synthetic purchasing scenarios SCN-2026-001 … SCN-2026-003 — 100% fictional.
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
  {
    id: "SCN-2026-002",
    title: "200 kg basmati rice for a Lucknow restaurant",
    business: {
      name: "Saffron Courtyard Kitchen",
      location: "Lucknow, Uttar Pradesh",
      need: "200 kg aged 1121 steam basmati rice (sealed packs)",
      quantity: 200,
      unit: "kg",
    },
    quotes: [
      {
        id: "QT1",
        supplier: "Kesar Grain Depot",
        channel: "whatsapp-image",
        receivedAt: "2026-10-02T09:10:00+05:30",
        rawText:
          "KESAR GRAIN DEPOT - Restaurant Supplies\n" +
          "QUOTATION\n" +
          "1121 steam basmati rice, aged 1 year, sealed packs\n" +
          "Rate: Rs 94 per kg + GST 5%\n" +
          "Delivery: 2 days (transport Rs 600)\n" +
          "Warranty: not applicable to food\n" +
          "Sealed-pack return window: [illegible]\n" +
          "Payment: 25% advance | Minimum order: 50 kg\n" +
          "Valid 7 days",
        extracted: {
          unitPrice: 94, gst: "extra", gstRate: 0.05,
          deliveryDays: 2, deliveryCharge: 600,
          warrantyMonths: null, advancePct: 25, minOrder: 50,
          validDays: 7, perUnit: "kg", perUnitQty: 1,
          notes: "Same rice grade as the other quotes; transport charged separately; return window requires confirmation",
        },
        unreadable: [
          "sealed-pack return window is illegible; confirm the supplier's return policy before approving",
        ],
      },
      {
        id: "QT2",
        supplier: "Harvest Lane Foods",
        channel: "pdf",
        receivedAt: "2026-10-02T10:30:00+05:30",
        rawText:
          "HARVEST LANE FOODS\n" +
          "Quotation No. HLF/261002 | Date: 02-10-2026\n" +
          "Item: 1121 steam basmati rice, aged 1 year, sealed 25 kg bags\n" +
          "Requested quantity: 200 kg (8 bags)\n" +
          "Rate: Rs 2,250 per 25 kg bag (inclusive of GST 5%)\n" +
          "Delivery: 3 days, transport Rs 200 per order\n" +
          "Warranty: not applicable to food\n" +
          "Payment: 50% advance with order\n" +
          "MOQ: 100 kg (4 bags) | Validity: 5 days",
        extracted: {
          unitPrice: 2250, gst: "included", gstRate: 0.05,
          deliveryDays: 3, deliveryCharge: 200,
          warrantyMonths: null, advancePct: 50, minOrder: 100,
          validDays: 5, perUnit: "kg", perUnitQty: 25,
          notes: "Rs 2,250 is the price of a 25 kg bag, not one kg; eight bags cover the requested 200 kg",
        },
        unreadable: [],
      },
      {
        id: "QT3",
        supplier: "Riverbend Rice Traders",
        channel: "whatsapp-text",
        receivedAt: "2026-10-02T12:05:00+05:30",
        rawText:
          "Riverbend Rice Traders: 1121 steam basmati, aged 1 year, sealed 10 kg packs.\n" +
          "Rs 920 per 10 kg pack + GST 5%.\n" +
          "Free delivery in 1 day. Warranty not applicable to food.\n" +
          "Minimum order 400 kg (40 packs). 75% advance.\n" +
          "Rate valid for 2 days.",
        extracted: {
          unitPrice: 920, gst: "extra", gstRate: 0.05,
          deliveryDays: 1, deliveryCharge: 0,
          warrantyMonths: null, advancePct: 75, minOrder: 400,
          validDays: 2, perUnit: "kg", perUnitQty: 10,
          notes: "Ten kg per pack; minimum order is twice the restaurant's need; high advance and short validity",
        },
        unreadable: [],
      },
    ],
  },
  {
    id: "SCN-2026-003",
    title: "20 replacement displays for an Ahmedabad repair shop",
    business: {
      name: "BenchCraft Mobile Repairs",
      location: "Ahmedabad, Gujarat",
      need: "20 R10 phone LCD + touch assemblies (aftermarket grade A)",
      quantity: 20,
      unit: "units",
    },
    quotes: [
      {
        id: "QT1",
        supplier: "Pixel Parts Wholesale",
        channel: "whatsapp-image",
        receivedAt: "2026-10-03T09:20:00+05:30",
        rawText:
          "PIXEL PARTS WHOLESALE\n" +
          "QUOTATION\n" +
          "R10 phone LCD + touch assembly - aftermarket grade A\n" +
          "Rate: Rs 720 per piece + GST 18%\n" +
          "Delivery: 3 days (transport Rs 400 per order)\n" +
          "Warranty: 1 month; flex-cable seal condition [illegible]\n" +
          "Payment: 0% advance, cash on delivery\n" +
          "Minimum order: 10 pieces | Valid 7 days",
        extracted: {
          unitPrice: 720, gst: "extra", gstRate: 0.18,
          deliveryDays: 3, deliveryCharge: 400,
          warrantyMonths: 1, advancePct: 0, minOrder: 10,
          validDays: 7, perUnit: "pc", perUnitQty: 1,
          notes: "Same model and grade as the other quotes; transport extra; warranty seal condition requires confirmation",
        },
        unreadable: [
          "flex-cable seal condition is illegible; confirm whether testing or installation voids the one-month warranty",
        ],
      },
      {
        id: "QT2",
        supplier: "ClearView Components",
        channel: "pdf",
        receivedAt: "2026-10-03T11:00:00+05:30",
        rawText:
          "CLEARVIEW COMPONENTS\n" +
          "Quotation No. CVC/261003 | Date: 03-10-2026\n" +
          "Item: R10 phone LCD + touch assembly, aftermarket grade A\n" +
          "Quantity: 20 pieces\n" +
          "Rate: Rs 820 per piece (inclusive of GST 18%)\n" +
          "Delivery: 2 days, free delivery\n" +
          "Warranty: 3 months for manufacturing defects\n" +
          "Payment: 50% advance with order\n" +
          "MOQ: 5 pieces | Validity: 5 days",
        extracted: {
          unitPrice: 820, gst: "included", gstRate: 0.18,
          deliveryDays: 2, deliveryCharge: 0,
          warrantyMonths: 3, advancePct: 50, minOrder: 5,
          validDays: 5, perUnit: "pc", perUnitQty: 1,
          notes: "Manufacturing-defect warranty; same R10 compatibility and aftermarket grade A; 50% advance",
        },
        unreadable: [],
      },
      {
        id: "QT3",
        supplier: "Circuit Stock Hub",
        channel: "whatsapp-text",
        receivedAt: "2026-10-03T13:15:00+05:30",
        rawText:
          "Circuit Stock Hub: R10 phone LCD + touch assemblies, aftermarket grade A.\n" +
          "Rs 760 per piece, GST 18% included.\n" +
          "Free delivery in 4 days. 6 months warranty for manufacturing defects.\n" +
          "Minimum order 40 pieces. 75% advance.\n" +
          "Rate valid for 2 days.",
        extracted: {
          unitPrice: 760, gst: "included", gstRate: 0.18,
          deliveryDays: 4, deliveryCharge: 0,
          warrantyMonths: 6, advancePct: 75, minOrder: 40,
          validDays: 2, perUnit: "pc", perUnitQty: 1,
          notes: "Lowest true unit price but minimum order is twice the shop's need; 75% advance and two-day validity",
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
