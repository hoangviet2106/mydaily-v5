const prisma = require("../prisma");
const { genRefCode } = require("../utils/payref");

exports.createVietqrIntent = async (req, res, next) => {
  try {
    console.log("VIETQR ENV:", {
      code: process.env.VIETQR_BANK_CODE,
      no: process.env.VIETQR_ACCOUNT_NO,
      name: process.env.VIETQR_ACCOUNT_NAME,
    });

    const userId = req.user?.sub || req.user?.id; // tuỳ payload JWT của bạn
    const amount = Number(req.body?.amount || process.env.PREMIUM_PRICE_VND || 49000);

    // gen reference_code unique (retry vài lần nếu trùng)
    let referenceCode = "";
    for (let i = 0; i < 5; i++) {
      referenceCode = genRefCode(userId);
      const exists = await prisma.paymentTransaction.findUnique({
        where: { reference_code: referenceCode },
      });
      if (!exists) break;
    }

    const bank_code = process.env.VIETQR_BANK_CODE || null;
    const account_no = process.env.VIETQR_ACCOUNT_NO || null;
    const account_name = process.env.VIETQR_ACCOUNT_NAME || null;

    const tx = await prisma.paymentTransaction.create({
      data: {
        user_id: userId,
        provider: "VIETQR",
        reference_code: referenceCode,
        amount,
        currency: "VND",
        status: "PENDING",
        reconcile_method: "MANUAL",
        bank_code: bank_code,
        note: "User created VietQR intent",
        raw_payload: {
          vietqr: {
            bank_code,
            account_no,
            account_name,
          },
        },
      },
    });

    // ✅ TRẢ ĐÚNG FORMAT CHO FE: bank nằm riêng
    return res.json({
      ok: true,
      tx: {
        id: tx.id,
        amount: tx.amount,
        currency: tx.currency,
        reference_code: tx.reference_code,
        status: tx.status,
      },
      bank: {
        bank_code,
        account_no,
        account_name,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.markVietqrPaid = async (req, res, next) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const { reference_code, note } = req.body || {};

    if (!reference_code) {
      return res.status(400).json({ ok: false, message: "reference_code is required" });
    }

    const tx = await prisma.paymentTransaction.findFirst({
      where: { user_id: userId, reference_code, provider: "VIETQR" },
    });

    if (!tx) {
      return res.status(404).json({ ok: false, message: "Transaction not found" });
    }

    await prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: {
        note: note ? String(note).slice(0, 255) : "User clicked I paid",
        // status vẫn PENDING vì admin sẽ duyệt
      },
    });

    return res.json({ ok: true, message: "Marked. Waiting for approval." });
  } catch (err) {
    next(err);
  }
};
