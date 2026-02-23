const prisma = require("../prisma");

exports.getMySubscription = async (req, res, next) => {
    try {
        const userId = req.user?.sub || req.user?.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                account_type: true,
                subscription: {
                    select: {
                        status: true,
                        provider: true,
                        current_period_end: true,
                        updated_at: true,
                        created_at: true,
                    },
                },
            },
        });

        const txs = await prisma.paymentTransaction.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
            take: 20,
            select: {
                id: true,
                provider: true,
                reference_code: true,
                amount: true,
                currency: true,
                status: true,
                created_at: true,
                note: true,
            },
        });

        return res.json({ ok: true, user, subscription: user?.subscription || null, transactions: txs });
    } catch (err) {
        next(err);
    }
};
