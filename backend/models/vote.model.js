import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    optionIds: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
    },
  },
  { timestamps: true }
);

// One student = one vote per poll
voteSchema.index({ pollId: 1, studentId: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;
