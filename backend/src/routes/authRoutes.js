import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

router.get("/me", authenticate, checkTenant, (req, res) => {
    res.json({
        user: req.user,
        tenant: req.tenant,
    });
})
// router.post("")
export default router;