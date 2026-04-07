import bcrypt from "bcryptjs";

const run = async () => {
  const hash = await bcrypt.hash("daksh321", 10);
  console.log(hash);
};

run();