const express = require("express");
const router = express.Router();
const {
  deposit,
  withdraw,
  invest,
  approvedeposit,
  localtransfer,
  declinedepo,
  support,
  approvewithdraw,
  declinewith,
  reinvest,
} = require("../controllers/transact");
const { isAdmin } = require("../middleware/auth");
router.patch("/deposit/:id", deposit);
router.patch("/withdraw/:id", withdraw);
router.patch("/invest/:id", invest);
router.patch("/reinvest/:id", reinvest);
router.patch("/localtransfer/:id", localtransfer);
router.patch("/support", support);

// router.get('/adminUsers', isAdmin, getAdmins);
router.patch("/approvedepo/:id", isAdmin, approvedeposit);
router.patch("/declinedepo/:id", isAdmin, declinedepo);
router.patch("/approvedwith/:id", isAdmin, approvewithdraw);
router.patch("/declinedwith/:id", isAdmin, declinewith);

module.exports = router;
