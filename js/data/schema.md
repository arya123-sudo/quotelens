# Quote scenario JSON schema

Every purchasing scenario in `quotes.js` follows this contract. Astra generates new
scenarios against it; Muse validates before merge.

```jsonc
{
  "id": "SCN-2026-002",
  "title": "Short scenario title",
  "business": {
    "name": "Small business name (fictional)",
    "location": "City, State",
    "need": "Human need, e.g. '200 kg basmati rice, monthly'",
    "quantity": 200,
    "unit": "kg"
  },
  "quotes": [
    {
      "id": "QT1",
      "supplier": "Fictional supplier name",
      "channel": "whatsapp-image | pdf | whatsapp-text",   // exactly one of each per scenario
      "receivedAt": "ISO datetime",
      "rawText": "Multi-line OCR'd quote text. Exactly one quote per scenario contains one [illegible] span.",
      "extracted": {
        "unitPrice": 0,                 // headline price (may cover perUnitQty base units)
        "perUnit": "pc",                // base unit the price is quoted in
        "perUnitQty": 12,               // headline price covers this many base units (1 = same unit)
        "gst": "included | extra | unknown",
        "gstRate": 0.05,                // e.g. 0.05 / 0.12 / 0.18
        "deliveryDays": 0,
        "deliveryCharge": 0,            // Rs, 0 = free
        "warrantyMonths": 12,           // or null when N/A
        "advancePct": 0,                // 0-100
        "minOrder": 0,                  // in `unit`s; 0 = none
        "validDays": 0,
        "notes": "string"
      },
      "unreadable": ["..."]             // empty array when fully parsed
    }
  ]
}
```

## Rules

1. **All data synthetic.** Fake names, demo phone numbers (`90000 xxxxx`), fictional rates.
2. Exactly **3 quotes**, one per channel, per scenario.
3. Design a **trade-off triangle**: the cheapest headline price must hide a real cost
   (GST extra, delivery fee, short warranty), and at least one quote must carry a **trap**
   (min order above need, very short validity, very high advance).
4. True unit cost must be computable as:
   `unitPrice + (gst=='extra' ? unitPrice*gstRate : 0) + deliveryCharge/quantity`
   and the three true costs must be **clearly different** (no ties).
5. `rawText` must be consistent with `extracted` — every extracted number appears in the text.
