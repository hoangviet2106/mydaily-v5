const prisma = require("../prisma");

/**
 * GET /admin/users?search=&page=&limit=
 * - search: tìm theo email hoặc name
 * - page mặc định 1
 * - limit mặc định 20, max 100
 */
exports.listUsers = async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limitRaw = parseInt(req.query.limit || "20", 10);
    const limit = Math.min(Math.max(limitRaw, 1), 100);
    const skip = (page - 1) * limit;

    const where = {
      deleted_at: null,
      ...(search
        ? {
          OR: [
            { email: { contains: search } },
            { name: { contains: search } },
          ],
        }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          avatar_url: true,
          account_type: true,
          role: true,
          is_banned: true,
          banned_at: true,
          created_at: true,
        },
      }),
    ]);

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /admin/users/:id/ban
 * body: { is_banned: boolean }
 */
exports.setBan = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const is_banned = req.body?.is_banned;
    if (typeof is_banned !== "boolean") {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "is_banned must be boolean",
      });
    }


    // Không cho tự ban chính mình (tuỳ bạn)
    if (targetId === req.user.sub) {
      return res.status(400).json({ error: "BAD_REQUEST", message: "Cannot ban yourself" });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: {
        is_banned,
        banned_at: is_banned ? new Date() : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_banned: true,
        banned_at: true,
      },
    });

    return res.json({ user: updated });
  } catch (err) {
    // Prisma: record not found
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "NOT_FOUND", message: "User not found" });
    }
    next(err);
  }
};

/**
 * PATCH /admin/users/:id/role
 * body: { role: "USER" | "ADMIN" }
 */
exports.setRole = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const role = String(req.body?.role || "").toUpperCase();

    if (!["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "role must be USER or ADMIN" });
    }

    // Không cho tự hạ quyền chính mình (tránh lock admin)
    if (targetId === req.user.sub && role !== "ADMIN") {
      return res.status(400).json({ error: "BAD_REQUEST", message: "Cannot remove your own admin role" });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_banned: true,
        banned_at: true,
      },
    });

    return res.json({ user: updated });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "NOT_FOUND", message: "User not found" });
    }
    next(err);
  }
};

exports.setPlan = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const account_type = String(req.body?.account_type || "").toUpperCase();

    if (!["FREE", "PREMIUM"].includes(account_type)) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "account_type must be FREE or PREMIUM",
      });
    }

    const premiumDays = Number(process.env.PREMIUM_DAYS || 30);
    const now = new Date();

    const result = await prisma.$transaction(async (db) => {
      // 1️⃣ Update user
      const user = await db.user.update({
        where: { id: targetId },
        data: { account_type },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          account_type: true,
        },
      });

      // 2️⃣ Sync subscription
      if (account_type === "PREMIUM") {
        const existing = await db.subscription.findUnique({
          where: { user_id: targetId },
        });

        const base =
          existing?.current_period_end && existing.current_period_end > now
            ? existing.current_period_end
            : now;

        const newEnd = addDays(base, premiumDays);

        await db.subscription.upsert({
          where: { user_id: targetId },
          update: {
            provider: "VIETQR",
            activation_source: "ADMIN",
            status: "ACTIVE",
            current_period_end: newEnd,
          },
          create: {
            user_id: targetId,
            provider: "VIETQR",
            activation_source: "ADMIN",
            status: "ACTIVE",
            current_period_end: newEnd,
          },
        });
      } else {
        // downgrade
        await db.subscription.updateMany({
          where: { user_id: targetId },
          data: { status: "CANCELED" },
        });
      }

      return user;
    });

    return res.json({ user: result });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "NOT_FOUND", message: "User not found" });
    }
    next(err);
  }
};

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * GET /admin/payments?status=PENDING&page=&limit=&search=
 * - status mặc định PENDING
 * - search: tìm theo email/name/reference_code
 */
exports.listPendingVietqrPayments = async (req, res, next) => {
  try {
    const status = String(req.query.status || "PENDING").toUpperCase();
    const search = String(req.query.search || "").trim();

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limitRaw = parseInt(req.query.limit || "20", 10);
    const limit = Math.min(Math.max(limitRaw, 1), 100);
    const skip = (page - 1) * limit;

    if (!["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"].includes(status)) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "status must be PENDING | SUCCEEDED | FAILED | REFUNDED",
      });
    }

    const where = {
      provider: "ADMIN",
      status,
      ...(search
        ? {
          OR: [
            { reference_code: { contains: search } },
            { user: { email: { contains: search } } },
            { user: { name: { contains: search } } },
          ],
        }
        : {}),
    };

    const [total, txs] = await Promise.all([
      prisma.paymentTransaction.count({ where }),
      prisma.paymentTransaction.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          reference_code: true,
          amount: true,
          currency: true,
          status: true,
          bank_code: true,
          note: true,
          created_at: true,
          updated_at: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              account_type: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      payments: txs,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /admin/payments/:id/approve
 * - duyệt giao dịch VietQR (PENDING -> SUCCEEDED)
 * - kích hoạt/ gia hạn subscription + set user PREMIUM
 */
exports.approveVietqrPayment = async (req, res, next) => {
  try {
    const txId = req.params.id;
    const premiumDays = Number(process.env.PREMIUM_DAYS || 30);

    const tx = await prisma.paymentTransaction.findUnique({
      where: { id: txId },
    });

    if (!tx)
      return res.status(404).json({ error: "NOT_FOUND", message: "Transaction not found" });

    if (tx.provider !== "VIETQR") {
      return res.status(400).json({ error: "BAD_REQUEST", message: "Not a VIETQR transaction" });
    }

    if (tx.status === "SUCCEEDED")
      return res.json({ ok: true, message: "Already approved" });

    if (tx.status !== "PENDING") {
      return res.status(400).json({
        error: "BAD_REQUEST",
        message: `Only PENDING can be approved (current=${tx.status})`,
      });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (db) => {
      const user = await db.user.findUnique({
        where: { id: tx.user_id },
        include: { subscription: true },
      });

      if (!user) throw new Error("User not found");

      const base =
        user.subscription?.current_period_end &&
          user.subscription.current_period_end > now
          ? user.subscription.current_period_end
          : now;

      const newEnd = addDays(base, premiumDays);

      const sub = await db.subscription.upsert({
        where: { user_id: user.id },
        update: {
          provider: "VIETQR",
          activation_source: "PAYMENT",
          status: "ACTIVE",
          current_period_end: newEnd,
        },
        create: {
          user_id: user.id,
          provider: "VIETQR",
          activation_source: "PAYMENT",
          status: "ACTIVE",
          current_period_end: newEnd,
        },
      });

      const updatedTx = await db.paymentTransaction.update({
        where: { id: tx.id },
        data: {
          status: "SUCCEEDED",
          subscription_id: sub.id,
          note: "Approved by admin",
        },
      });

      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: { account_type: "PREMIUM" },
      });

      return { subscription: sub, tx: updatedTx, user: updatedUser };
    });

    return res.json({ ok: true, ...result });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "NOT_FOUND", message: "Record not found" });
    }
    next(err);
  }
};