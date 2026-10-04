\# Verification - expected true-cost values



All demo data is synthetic. The math is deterministic:



&#x20;   exactUnitCost = (unitPrice / perUnitQty) \[+ GST if extra] + deliveryCharge / qty

&#x20;   displayed unit cost = Math.round(exactUnitCost)

&#x20;   order total = Math.round(exactUnitCost \* qty)



Rounding happens once, at display/total time - nowhere else.



Functions live in `js/data/quotes.js` (`exactUnitCost`, `trueUnitCost`, `orderTotal`) and are rendered by `js/ui/tour.js`. No LLM is involved in any number.



Checked 2026-10-04: code-read of `quotes.js` + `tour.js`, plus the live demo at https://quotelens-xi.vercel.app/#/demo (4-agent pipeline -> true-cost table).



SCN-2026-001 and SCN-2026-002 values were seen on screen; SCN-2026-003 values are computed with the same functions.



\## SCN-2026-001 - 50 ceiling fans (Sharma Electricals, Jaipur)



| Quote | Supplier | Headline | GST | True/unit | Order total |

|---|---|---|---|---|---|

| QT1 | Gupta Traders | Rs 1,850 | +Rs 333 | Rs 2,193 | Rs 1,09,650 |

| QT2 | Shree Balaji Enterprises | Rs 1,790 | incl. | Rs 1,790 | Rs 89,500 |

| QT3 | Khan Suppliers | Rs 1,820 | +Rs 328 | Rs 2,148 | Rs 1,07,380 |



Winner: QT2 (seen on the live purchase-summary screen). Saving vs cheapest headline: Rs 403/unit = Rs 20,150 across the 50-fan order. QT3 is also caught by the min-order trap at approval (MOQ 100 > 50). QT1's photo quote carries 2 flagged uncertainties; the summary button stays locked ("Confirm 2 flag(s) to unlock approval") until both are confirmed by checkbox.



\## SCN-2026-002 - 200 kg basmati rice (seen live)



| Quote | Supplier | Headline | GST | True/unit | Order total |

|---|---|---|---|---|---|

| QT1 | Kesar Grain Depot | Rs 94 | +Rs 5 | Rs 102 | Rs 20,340 |

| QT2 | Harvest Lane Foods | Rs 2,250 per 25 kg | incl. | Rs 91 | Rs 18,200 |

| QT3 | Riverbend Rice Traders | Rs 920 per 10 kg | +Rs 5 | Rs 97 | Rs 19,320 |



Pack-size trap: the Rs 2,250 headline is the cheapest per kg once normalized.



\## SCN-2026-003 - 20 phone display assemblies (BenchCraft Mobile Repairs, Ahmedabad)



| Quote | Supplier | Headline | GST | True/unit | Order total |

|---|---|---|---|---|---|

| QT1 | Pixel Parts Wholesale | Rs 720 | +Rs 130 | Rs 870 | Rs 17,392 |

| QT2 | ClearView Components | Rs 820 | incl. | Rs 820 | Rs 16,400 |

| QT3 | Circuit Stock Hub | Rs 760 | incl. | - | ineligible |



QT1 is a degraded photo quote with 1 illegible flag (warranty seal condition); approval locks until it is confirmed. QT3 has the lowest headline (Rs 760) but MOQ 40 > need 20, so it is excluded at the approval gate ("min-order trap"). Cheapest feasible: QT2.

