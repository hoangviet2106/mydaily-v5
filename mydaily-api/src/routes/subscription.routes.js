const router = require("express").Router();
const auth = require("../middleware/auth");
const subscriptionController = require("../controllers/subscription.controller");

router.get("/me", auth, subscriptionController.getMySubscription);

module.exports = router;
