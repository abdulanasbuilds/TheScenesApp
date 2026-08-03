/**
 * SukaSpace — Financial Logic Test Suite
 *
 * This script runs unit tests for our secure payment abstraction,
 * immutable financial ledger, fee calculations, and webhook idempotency rules.
 *
 * Run with: npx tsx scripts/test-monetization.ts
 */

import crypto from "crypto";
import { PaystackProvider } from "../src/lib/payment-adapter";
import { calcPlatformFee, calcNetAmount, calcWithdrawalFee } from "../src/lib/plans";
import { maskNumber } from "../src/lib/monetization/payout-accounts";

// ─── Assertion Helpers ───────────────────────────────────────────────────────

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log("====================================================");
  console.log("      SUKASPACE FINANCIAL LEDGER TEST SUITE         ");
  console.log("====================================================\n");

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Fee Calculations
  // ───────────────────────────────────────────────────────────────────────────
  console.log("🧪 Test 1: Fee & Net Revenue Calculations");
  try {
    const grossNGN = 1000000; // ₦1,000.00
    const freePlanFeeBps = 700; // 7%
    const proPlanFeeBps = 300; // 3%

    const platformFeeFree = calcPlatformFee(grossNGN, freePlanFeeBps);
    const netAmountFree = calcNetAmount(grossNGN, freePlanFeeBps);

    assert(platformFeeFree === 70000, "7% platform fee on ₦1,000 should be ₦70.00 (70000 cents)");
    assert(netAmountFree === 930000, "Net revenue after 7% platform fee should be ₦930.00 (930000 cents)");

    const platformFeePro = calcPlatformFee(grossNGN, proPlanFeeBps);
    const netAmountPro = calcNetAmount(grossNGN, proPlanFeeBps);

    assert(platformFeePro === 30000, "3% platform fee on ₦1,000 should be ₦30.00 (30000 cents)");
    assert(netAmountPro === 970000, "Net revenue after 3% platform fee should be ₦970.00 (970000 cents)");

    // Test withdrawal fee calculations
    const withdrawalFixed = 10000; // ₦100 fixed
    const withdrawalPercentBps = 100; // 1%
    const amountToWithdraw = 5000000; // ₦50,000

    const standardPayout = calcWithdrawalFee({
      amountCents: amountToWithdraw,
      isInstant: false,
      fixedFeeCents: withdrawalFixed,
      percentFeeBps: withdrawalPercentBps,
    });

    assert(standardPayout.feeCents === 0, "Standard payout should carry exactly 0 fees");
    assert(standardPayout.netCents === amountToWithdraw, "Standard payout net matches withdrawable amount");

    const instantPayout = calcWithdrawalFee({
      amountCents: amountToWithdraw,
      isInstant: true,
      fixedFeeCents: withdrawalFixed,
      percentFeeBps: withdrawalPercentBps,
    });

    // ₦100 fixed + 1% of ₦50,000 (₦500) = ₦600 (60000 cents)
    assert(instantPayout.feeCents === 60000, "Instant payout fee should equal ₦600 (60000 cents)");
    assert(instantPayout.netCents === 4940000, "Instant payout net should equal ₦49,400 (4940000 cents)");
  } catch (err: any) {
    console.error("  💥 Error in Test 1:", err.message);
    failedTests++;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: Secure Payout Information Masking
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n🧪 Test 2: Payout Destination Credential Masking");
  try {
    const rawBankAcc = "0123456789";
    const maskedBankAcc = maskNumber(rawBankAcc);
    assert(maskedBankAcc === "••••6789", "Bank account number should mask all but the last 4 digits");

    const rawMoMoNum = "+233551234567";
    const maskedMoMoNum = maskNumber(rawMoMoNum);
    assert(maskedMoMoNum === "••••4567", "Mobile Money phone number should mask all but the last 4 digits");

    const emptyNumber = maskNumber(null);
    assert(emptyNumber === null, "Null values should return null on masking");
  } catch (err: any) {
    console.error("  💥 Error in Test 2:", err.message);
    failedTests++;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: Webhook Cryptographic Verification
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n🧪 Test 3: Webhook Cryptographic Signature Verification");
  try {
    const provider = new PaystackProvider();
    const testPayload = JSON.stringify({ event: "charge.success", data: { id: 123456 } });

    // Test with matching webhooks secret configured
    const testSecret = "shh_sukaspace_secret_key";
    process.env.PAYSTACK_WEBHOOK_SECRET = testSecret;

    // Generate accurate HMAC-SHA512 hex signature using Crypto (Node)
    const correctSignature = crypto
      .createHmac("sha512", testSecret)
      .update(testPayload)
      .digest("hex");

    const valid = await provider.verifyWebhookSignature(testPayload, correctSignature);
    assert(valid === true, "A valid HMAC signature corresponding to the body & secret must be approved");

    const invalidSignature = "f00baa_invalid_signature_hash";
    const invalid = await provider.verifyWebhookSignature(testPayload, invalidSignature);
    assert(invalid === false, "An invalid HMAC signature must be strictly rejected");
  } catch (err: any) {
    console.error("  💥 Error in Test 3:", err.message);
    failedTests++;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 4: Payment Webhook Parser
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n🧪 Test 4: Webhook Payload Parsing");
  try {
    const provider = new PaystackProvider();
    const samplePayload = JSON.stringify({
      event: "charge.success",
      data: {
        reference: "ref_test_123456",
        amount: 500000,
        currency: "NGN",
        customer: { email: "learner@sukaspace.com" }
      }
    });

    const parsed = provider.parseWebhookEvent(samplePayload);
    assert(parsed !== null, "Webhook payload must be parsed correctly");
    assert(parsed?.type === "payment.success", "Parsed event type should map to payment.success");
    assert(parsed?.reference === "ref_test_123456", "Parsed reference must match payload value");
    assert(parsed?.amountCents === 500000, "Parsed amount must map correctly");
    assert(parsed?.customerEmail === "learner@sukaspace.com", "Parsed customer email must match");
  } catch (err: any) {
    console.error("  💥 Error in Test 4:", err.message);
    failedTests++;
  }

  console.log("\n====================================================");
  console.log("                  TEST SUMMARY                      ");
  console.log("====================================================");
  console.log(`  Total Passed: ${passedTests}`);
  console.log(`  Total Failed: ${failedTests}`);
  console.log("====================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
