import User from "../models/UserSchema.js";
import { hashpassword } from "../service/tokenService.js";
import Tenant from "../models/TenantSchema.js";
import Plan from "../models/PlanSchema.js";
import TenantSubscription from "../models/TenantSubscriptionSchema.js";

export const registerOwner = async (req, res) => {
    try {
        const { name, email, password, companyName } = req.body;
        if (!name || !email || !password || !companyName) {
            return res.status(400).json({ message: "All fields are required" })
        }
        const user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({ message: "User already exists" })
        }
        const hashedPassword = await hashpassword(password)
        //1st create teh owner user of teh company
        const newUser = new User({ name, email, password: hashedPassword })
        await newUser.save()
//2nd create teh comapny of teh owner
        const tenant = new Tenant({ name: companyName, ownerId: newUser._id });
        await tenant.save();
//3rd create teh free plan subscription for teh company
        const freePlan = await Plan.findOne({ name: "FREE" });
        if (!freePlan) throw new Error("Free plan not configured");

        const subscription = new TenantSubscription({
            tenantId: tenant._id,
            planId: freePlan._id,
            status: "ACTIVE",
            billingCycle: "MONTHLY",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        await subscription.save();
//4th update teh owner user with teh tenantId and role
        newUser.tenantId = tenant._id;
        newUser.role = "OWNER";
        await newUser.save();

        res.status(201).json({
            message: "Tenant and owner created successfully",
            user: newUser,
            tenant,
        });

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}