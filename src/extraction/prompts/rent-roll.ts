// Rent Roll Extraction Prompt
// This is the PRIMARY extraction method for Rent Rolls. Textract extracts raw
// text and tables, then Claude structures the data. Rent rolls come in many
// formats — property management software exports, landlord spreadsheets, or
// hand-typed documents — so AI-driven structuring does the heavy lifting here.

export const RENT_ROLL_PROMPT = `You are a financial data extraction specialist. Extract ALL financial data from this Rent Roll.

Return a JSON object with this EXACT structure. Use null for any field you cannot find or read. Use numbers only (no dollar signs, commas, or text). Negative numbers should use a minus sign (e.g., -5000).

{
  "metadata": {
    "propertyName": null,
    "propertyAddress": null,
    "propertyType": null,
    "ownerName": null,
    "managementCompany": null,
    "asOfDate": null,
    "preparedBy": null,
    "totalUnits": null,
    "totalSquareFeet": null,
    "yearBuilt": null
  },
  "units": [
    {
      "unitNumber": null,
      "unitType": null,
      "squareFeet": null,
      "bedrooms": null,
      "bathrooms": null,
      "tenantName": null,
      "leaseStartDate": null,
      "leaseEndDate": null,
      "leaseTermMonths": null,
      "monthlyRent": null,
      "marketRent": null,
      "rentPerSquareFoot": null,
      "securityDeposit": null,
      "lastRentIncrease": null,
      "status": null,
      "moveInDate": null,
      "rentStatus": null,
      "pastDueAmount": null,
      "pastDueDays": null,
      "otherMonthlyCharges": null,
      "otherChargesDescription": null,
      "concessions": null,
      "concessionsDescription": null,
      "notes": null
    }
  ],
  "summary": {
    "totalUnits": null,
    "occupiedUnits": null,
    "vacantUnits": null,
    "occupancyRate": null,
    "totalMonthlyRent_scheduled": null,
    "totalMonthlyRent_actual": null,
    "totalAnnualRent_scheduled": null,
    "totalAnnualRent_actual": null,
    "averageRentPerUnit": null,
    "averageRentPerSquareFoot": null,
    "totalMarketRent": null,
    "lossToLease": null,
    "totalSecurityDeposits": null,
    "totalPastDue": null,
    "delinquencyRate": null,
    "totalOtherIncome": null
  },
  "unitMix": [
    {
      "unitType": null,
      "count": null,
      "averageRent": null,
      "averageSquareFeet": null,
      "occupiedCount": null,
      "vacantCount": null
    }
  ],
  "delinquencySummary": {
    "current": {
      "unitCount": null,
      "totalAmount": null
    },
    "thirtyDays": {
      "unitCount": null,
      "totalAmount": null
    },
    "sixtyDays": {
      "unitCount": null,
      "totalAmount": null
    },
    "ninetyPlusDays": {
      "unitCount": null,
      "totalAmount": null
    }
  },
  "leaseExpirationSchedule": [
    {
      "period": null,
      "unitCount": null,
      "monthlyRent": null,
      "percentOfTotal": null
    }
  ],
  "otherIncome": {
    "laundry": null,
    "parking": null,
    "storage": null,
    "petFees": null,
    "lateCharges": null,
    "applicationFees": null,
    "otherFees": null,
    "totalOtherIncome": null,
    "otherIncomeBreakdown": [
      {
        "category": null,
        "monthlyAmount": null,
        "annualAmount": null
      }
    ]
  },
  "extractionNotes": []
}

FIELD DETAILS:
- "propertyType": one of "multifamily", "office", "retail", "industrial", "mixed_use", "single_family_portfolio", or null
- "unitType": descriptive label like "1BR/1BA", "2BR/2BA", "Studio", "Commercial Suite", "Retail", etc.
- "status": one of "occupied", "vacant", "down_unit" (under renovation), "model", "employee", or null
- "rentStatus": one of "current", "past_due", "eviction", "vacant", "pre_leased", or null
- "occupancyRate": as a decimal (e.g., 0.95 for 95%)
- "lossToLease": totalMarketRent - totalMonthlyRent_scheduled (positive number means tenants pay below market)
- "delinquencyRate": totalPastDue / totalMonthlyRent_scheduled (as a decimal)
- All dates must be in ISO format: YYYY-MM-DD
- "concessions": monthly dollar amount of any rent concessions (free month prorated, etc.)

CRITICAL RULES:
1. Extract EVERY unit on the rent roll. Do not skip any, even vacant ones.
2. Vacant units should have status "vacant", rentStatus "vacant", tenantName null, and monthlyRent set to the asking rent or market rent if shown.
3. Verify: occupiedUnits + vacantUnits should equal totalUnits. Note discrepancies.
4. Verify: sum of all unit monthlyRent values for occupied units should equal totalMonthlyRent_actual. Note discrepancies.
5. NEVER guess or estimate. If you can't read it, say null.
6. If a number is illegible, set it to null and add a note in extractionNotes.
7. Security deposits are critical for lender analysis — capture every one.
8. Past due amounts are a key indicator of property health — capture every one with days past due.
9. If lease dates are missing, note this in extractionNotes — month-to-month tenants represent higher risk.
10. Calculate unit mix yourself: group units by type and compute averages.
11. Calculate the lease expiration schedule: group by month/quarter showing upcoming expirations.
12. If the rent roll includes other income (laundry, parking, storage, pet fees), extract into the otherIncome section.
13. For mixed-use properties: include both residential and commercial units, noting the unit type for each.
14. Market rent vs. actual rent comparison (loss to lease) is critical — capture market rents when available.
15. If multiple buildings or addresses are on the same rent roll, note the building/address for each unit in the notes field.`;

export const RENT_ROLL_VERSION = "rent-roll-v1";
