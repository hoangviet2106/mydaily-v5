const router = require("express").Router();

const auth = require("../middleware/auth");
const paymentController = require("../controllers/payment.controller");

router.post("/vietqr/create", auth, paymentController.createVietqrIntent);
router.post("/vietqr/i-paid", auth, paymentController.markVietqrPaid);

module.exports = router;
