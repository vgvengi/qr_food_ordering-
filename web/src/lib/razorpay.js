// Loads Razorpay Checkout on demand and resolves with the payment response.
function loadScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load Razorpay"));
    document.body.appendChild(s);
  });
}

export async function payWithRazorpay({ keyId, razorpayOrderId, amountPaise, description }) {
  await loadScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: keyId,
      order_id: razorpayOrderId,
      amount: amountPaise,
      currency: "INR",
      name: "TableTap",
      description,
      theme: { color: "#ea580c" },
      handler: (r) =>
        resolve({
          razorpayOrderId: r.razorpay_order_id,
          razorpayPaymentId: r.razorpay_payment_id,
          signature: r.razorpay_signature,
        }),
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    rzp.on("payment.failed", (e) => reject(new Error(e.error?.description || "Payment failed")));
    rzp.open();
  });
}
