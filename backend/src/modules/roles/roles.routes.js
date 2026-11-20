const express = require("express");
const rolesController = require("./roles.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validateRequest = require("../../middleware/validate.middleware");
const { createRoleSchema, updateRoleSchema } = require("./roles.validation");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validateRequest(createRoleSchema),
  rolesController.create.bind(rolesController)
);
router.get("/", rolesController.getAll.bind(rolesController));
router.get("/:id", rolesController.getById.bind(rolesController));
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validateRequest(updateRoleSchema),
  rolesController.update.bind(rolesController)
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  rolesController.delete.bind(rolesController)
);

module.exports = router;
