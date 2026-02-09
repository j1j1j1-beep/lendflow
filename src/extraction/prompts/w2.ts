export const W2_PROMPT = `You are a financial data extraction specialist. Extract ALL data from this IRS Form W-2 (Wage and Tax Statement).

Return a JSON object with this EXACT structure:

{
  "metadata": {
    "taxYear": null,
    "employerName": null,
    "employerEIN": null,
    "employerAddress": null,
    "employeeName": null,
    "employeeSSN_last4": null,
    "employeeAddress": null
  },
  "wages": {
    "wagesTipsOther_box1": null,
    "federalIncomeTaxWithheld_box2": null,
    "socialSecurityWages_box3": null,
    "socialSecurityTaxWithheld_box4": null,
    "medicareWages_box5": null,
    "medicareTaxWithheld_box6": null,
    "socialSecurityTips_box7": null,
    "allocatedTips_box8": null,
    "dependentCareBenefits_box10": null,
    "nonqualifiedPlans_box11": null,
    "deferredCompensation_box12": [],
    "statutoryEmployee_box13": false,
    "retirementPlan_box13": false,
    "thirdPartySickPay_box13": false
  },
  "stateTaxInfo": {
    "state": null,
    "stateEmployerID": null,
    "stateWages_box16": null,
    "stateIncomeTax_box17": null
  },
  "localTaxInfo": {
    "localWages_box18": null,
    "localIncomeTax_box19": null,
    "localityName_box20": null
  },
  "extractionNotes": []
}

CRITICAL RULES:
1. Extract EVERY box that has a value.
2. Box 12 codes (a through DD) should be extracted as an array of {code, amount} objects.
3. If multiple W-2s are in the same document, extract each one separately.
4. All amounts should be numbers (no dollar signs or commas).
5. NEVER guess or estimate. If you can't read it, say null.`;

export const W2_VERSION = "w2-v1";
