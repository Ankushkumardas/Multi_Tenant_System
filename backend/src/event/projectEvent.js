import { eventBus } from "../service/EventBus";
import Usage from "../models/UsageSchema.js";

eventBus.on("PROJECT_CREATED", async (data) => {
  try {
    //update uasge
    await Usage.findOneAndUpdate(
      { tenantId: data.tenantId },
      { $inc: { totalProjects: 1 } },
      { upsert: true },
    );

    //updat activity
    await Activity.create({
      userId: data.userId,
      tenantId: data.tenantId,
      activity: "Project created",
      entityType: "Project",
      entityId: data.projectId,
    });

    //update audit
    await Audit.create({
      actorUserId: data.userId,
      tenantId: data.tenantId,
      action: "PROJECT_CREATED",
      metadata: {
        projectId: data.projectId,
      },
    });
  } catch (error) {
    console.log(error);
  }
});
