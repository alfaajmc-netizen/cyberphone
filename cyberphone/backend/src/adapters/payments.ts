/**
 * Payment adapters (stubs/mocks)
 * Integrate real providers by implementing these functions for Unitel Money, eKwanza and Cryptomus.
 *
 * Each adapter returns a paymentIntent-like object for the frontend to redirect to or to complete the payment.
 * For MVP we immediately return success.
 */

export async function createUnitelPaymentIntent({ amount, metadata }: { amount: number; metadata?: any }) {
  // TODO: implement Unitel Money SDK / API calls
  return { provider: "unitel", status: "mocked", amount, metadata, paymentUrl: null };
}

export async function createEKwanzaPaymentIntent({ amount, metadata }: { amount: number; metadata?: any }) {
  // TODO: implement eKwanza API integration
  return { provider: "ekwanza", status: "mocked", amount, metadata, paymentUrl: null };
}

export async function createCryptomusPaymentIntent({ amount, metadata }: { amount: number; metadata?: any }) {
  // TODO: create payment via Cryptomus and return checkout URL
  return { provider: "cryptomus", status: "mocked", amount, metadata, paymentUrl: null };
}