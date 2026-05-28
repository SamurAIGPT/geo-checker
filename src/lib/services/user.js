import { prisma } from "../prisma";

export const UserService = {
  async deductCredits(userId, amount) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    if (user.credits < amount) throw new Error("Insufficient credits");

    return await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } }
    });
  },

  async addCredits(userId, amount) {
    return await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } }
    });
  }
};
