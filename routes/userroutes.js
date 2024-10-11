const express = require("express");
const router = express.Router();
const {
  loginUser,
  signupUser,
  verifyuser,
  getOneUser,
  patch2,
  getAllUsers,
  invest,
  changepassword,
  verifypass,
  forgetpasswprd,
} = require("../controllers/user");
const { isAdmin } = require("../middleware/auth");
router.post("/login", loginUser);
router.post("/change", changepassword);

router.post("/signup", signupUser);
router.post("/forgot", forgetpasswprd);
router.get("/:id/verify/:token", verifyuser);
router.get("/:id/reset/:token", verifypass);

router.get("/oneuser/:id", getOneUser);
router.get("/one/:id", getOneUser);
router.get("/invest/:id", invest);
router.get("/oneuser1/:id", getOneUser);
router.get("/oneuser3/:id", getOneUser);
router.get("/oneuser4/:id", getOneUser);
router.get("/oneuser5/:id", getOneUser);
router.get("/oneuser6/:id", getOneUser);
router.get("/oneuser7/:id", getOneUser);
router.get("/oneuser8/:id", getOneUser);
router.get("/oneuser9/:id", getOneUser);
router.get("/all", getAllUsers);
router.get("/getalluer2", getAllUsers);
router.get("/getalluer", getAllUsers);

router.patch("/updateuser/:id", isAdmin, patch2);
router.patch("/update/:id", patch2);

// router.get('/adminUsers', isAdmin, getAdmins);

module.exports = router;
