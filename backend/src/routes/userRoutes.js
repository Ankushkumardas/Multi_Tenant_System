import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkTenant } from "../middleware/tenantMiddleware.js";
import {
  getProfile,
  updateProfileData,
  getActiveSessions,
  changePasword,
  updateTenantSlug,
} from "../controller/authController.js";
import { rateLimiter } from "../middleware/ratelimiter.js";

// mergeParams are used to access params from teh parent route params in the child routes
// for example if we have a route /api/:slug/user and we want to access the slug in the child routes we use mergeParams: true
// Parent Route:
//    /projects/:projectId

// Child Router:
//    /tasks

// Final URL:
//    /projects/123/tasks
// Without mergeParams → child can't see 123
// With mergeParams → child can see 123
const router = express.Router({ mergeParams: true });

router.get("/profile", authenticate, checkTenant, getProfile);

router.put("/update-profile", authenticate, checkTenant, updateProfileData);

router.get("/sessions", authenticate, checkTenant, getActiveSessions);

router.post(
  "/change-password",
  authenticate,
  checkTenant,
  rateLimiter({
    keyPrefix: "change-password",
    limit: 3,
    windowsize: 60,
    identifier: "userId",
  }),
  changePasword,
);

router.put("/workspace", authenticate, checkTenant, updateTenantSlug);

export default router;
