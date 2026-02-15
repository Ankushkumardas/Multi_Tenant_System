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

eventBus.on("PROJECT_UPDATED", async (data) => {
  try {
    //update activity
    await Activity.create({
      userId: data.userId,
      tenantId: data.tenantId,
      activity: "Project updated",
      entityType: "Project",
      entityId: data.projectId,
    });

    //update audit
    await Audit.create({
      actorUserId: data.userId,
      tenantId: data.tenantId,
      action: "PROJECT_UPDATED",
      metadata: {
        projectId: data.projectId,
      },
    });
  } catch (error) {
    console.log(error);
  }
});

eventBus.on("PROJECT_DELETED", async (data) => {
  try {
    //update uasge
    await Usage.findOneAndUpdate(
      { tenantId: data.tenantId },
      { $inc: { totalProjects: -1 } },
      { upsert: true },
    );

    //update activity
    await Activity.create({
      userId: data.userId,
      tenantId: data.tenantId,
      activity: "Project deleted",
      entityType: "Project",
      entityId: data.projectId,
    });

    //update audit
    await Audit.create({
      actorUserId: data.userId,
      tenantId: data.tenantId,
      action: "PROJECT_DELETED",
      metadata: {
        projectId: data.projectId,
      },
    });
  } catch (error) {
    console.log(error);
  }
});

eventBus.on("MEMBER_ADDED", async (data) => {
  try {
    //update activity
    await Activity.create({
      userId: data.userId,
      tenantId: data.tenantId,
      activity: "Member added",
      entityType: "Project",
      entityId: data.projectId,
    });

    //update audit
    await Audit.create({
      actorUserId: data.userId,
      tenantId: data.tenantId,
      action: "MEMBER_ADDED",
      metadata: {
        projectId: data.projectId,
      },
    });
  } catch (error) {
    console.log(error);
  }
});

eventBus.on("MEMBER_REMOVED", async (data) => {
  try {
    //update activity
    await Activity.create({
      userId: data.userId,
      tenantId: data.tenantId,
      activity: "Member removed",
      entityType: "Project",
      entityId: data.projectId,
    });

    //update audit
    await Audit.create({
      actorUserId: data.userId,
      tenantId: data.tenantId,
      action: "MEMBER_REMOVED",
      metadata: {
        projectId: data.projectId,
      },
    });
  } catch (error) {
    console.log(error);
  }
});

eventBus.on("MEMBER_ROLE_UPDATED", async (data) => {
  try {
    //update activity
    await Activity.create({
      userId: data.userId,
      tenantId: data.tenantId,
      activity: "Member role updated",
      entityType: "Project",
      entityId: data.projectId,
    });

    //update audit
    await Audit.create({
      actorUserId: data.userId,
      tenantId: data.tenantId,
      action: "MEMBER_ROLE_UPDATED",
      metadata: {
        projectId: data.projectId,
      },
    });
  } catch (error) {
    console.log(error);
  }
});
