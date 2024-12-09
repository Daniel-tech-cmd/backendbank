const express = require("express");
const router = express.Router();
const {
  deposit,
  withdraw,
  invest,
  approvedeposit,
  localtransfer,
  declinedepo,
  getLoan,
  support,
  createCode,
  approvewithdraw,
  approveLoan,
  changePin,
  compareCode,
  forgotPin,
  internationalTransfer,
  validateResetToken,
  declinewith,
  reinvest,
} = require("../controllers/transact");
const { isAdmin } = require("../middleware/auth");
router.get("/forgotpin/:id", forgotPin);
router.get("/verify-reset-link/:id/:token", validateResetToken);

router.patch("/deposit/:id", deposit);
router.patch("/withdraw/:id", withdraw);
router.patch("/invest/:id", invest);
router.patch("/reinvest/:id", reinvest);
router.post("/code/:id", compareCode);
router.post("/create/code/:id", createCode);
router.patch("/localtransfer/:id", localtransfer);
router.post("/internationaltransfer/:id", internationalTransfer);
router.patch("/support", support);
router.patch("/loan/:id", getLoan);
router.patch("/changepin/:id", changePin);

// router.get('/adminUsers', isAdmin, getAdmins);
router.patch("/approvedepo/:id", isAdmin, approvedeposit);
router.patch("/declinedepo/:id", isAdmin, declinedepo);
router.patch("/approvedwith/:id", isAdmin, approvewithdraw);
router.patch("/declinedwith/:id", isAdmin, declinewith);
router.patch("/approveloan/:id", isAdmin, approveLoan);

module.exports = router;
