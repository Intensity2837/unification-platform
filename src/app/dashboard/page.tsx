import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  if (session.role === 'ADMIN') {
    const pendingTeachers = await prisma.user.findMany({
      where: { role: 'TEACHER', isApproved: false },
      select: { id: true, email: true, name: true, school: true, createdAt: true },
    });
    
    const allClasses = await prisma.class.findMany({
      include: {
        teacher: { select: { name: true, school: true } },
        _count: { select: { studentSessions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return <AdminDashboard pendingTeachers={pendingTeachers} allClasses={allClasses} />;
  }

  if (session.role === 'TEACHER') {
    const classes = await prisma.class.findMany({
      where: { teacherId: session.userId },
      include: {
        _count: {
          select: { studentSessions: true },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    return <TeacherDashboard classes={classes} />;
  }

  return <div>잘못된 접근입니다.</div>;
}
