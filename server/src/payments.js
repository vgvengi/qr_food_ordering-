const crypto = require('crypto');
const Razorpay = require('razorpay');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Without real keys we run in "mock" mode so the app still works end to end locally.
const mock = !keyId || !keySecret || keyId.includes('xxxx');
const client = mock ? null : new Razorpay({ key_id: keyId, key_secret: keySecret });

async function createPaymentOrder({ amountPaise, receipt }) {
  if (mock) return { id: `mock_order_${receipt}_${Date.now()}`, amount: amountPaise, currency: 'INR' };
  return client.orders.create({ amount: amountPaise, currency: 'INR', receipt });
}

// Razorpay signs "<order_id>|<payment_id>" with the key secret (HMAC-SHA256).
function verifySignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  if (mock) return signature === 'mock_signature';
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { mock, keyId: mock ? null : keyId, createPaymentOrder, verifySignature };
