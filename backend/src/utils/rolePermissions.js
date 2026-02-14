export const rolePermissions = {
  SUPER_ADMIN: ["ALL"],

  OWNER: [
    "CREATE_PROJECT",
    "UPDATE_PROJECT",
    "DELETE_PROJECT",
    "MANAGE_USERS",
    "CREATE_TASK",
    "UPDATE_TASK",
    "DELETE_TASK",
    "SEND_MESSAGE",
    "CREATE_GROUP_CHAT",
  ],

  ADMIN: [
    "CREATE_PROJECT",
    "UPDATE_PROJECT",
    "CREATE_TASK",
    "UPDATE_TASK",
    "DELETE_TASK",
    "SEND_MESSAGE",
    "CREATE_GROUP_CHAT",
  ],

  MANAGER: [
    "CREATE_PROJECT",
    "CREATE_TASK",
    "UPDATE_TASK",
    "SEND_MESSAGE",
  ],

  USER: [
    "CREATE_TASK",
    "UPDATE_TASK",
    "SEND_MESSAGE",
  ],

  VIEWER: [
    "SEND_MESSAGE",
  ],
};
