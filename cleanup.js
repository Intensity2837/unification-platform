const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  const sessions = await prisma.studentSession.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  const seen = new Set();
  for (const session of sessions) {
    const key = `${session.classId}-${session.studentNumber}`;
    if (seen.has(key)) {
      console.log('Deleting duplicate session:', session.id);
      // Delete all messages first
      await prisma.message.deleteMany({ where: { sessionId: session.id } });
      await prisma.studentSession.delete({ where: { id: session.id } });
    } else {
      seen.add(key);
    }
  }
}
clean().then(() => console.log('Done')).catch(console.error);
