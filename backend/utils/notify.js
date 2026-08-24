import {
  notifyHostelStudents,
  notifyHostelStaff,
  notifyPollEligible,
  notifyUser,
  notifyUsers,
} from "../services/notification.service.js";

// Backward-compatible helpers. New code should import from
// services/notification.service.js directly.
export const notifyAllStudents = async ({ title, message, type = "mess", data = {} }) => {
  return notifyHostelStudents({ hostelId: null, title, message, type, data });
};

export { notifyHostelStudents, notifyHostelStaff, notifyPollEligible, notifyUser, notifyUsers };
