import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MonitorClient from './MonitorClient';

export default async function ClassMonitorPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const session = await getSession();
  if (!session || session.role !== 'TEACHER') {
    redirect('/');
  }

  const classData = await prisma.class.findFirst({
    where: { id: resolvedParams.id, teacherId: session.userId },
  });

  if (!classData) {
    return <div style={{ padding: '2rem' }}>해당 수업을 찾을 수 없거나 접근 권한이 없습니다.</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
        {classData.name} - 실시간 모니터링
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        수업 코드: <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{classData.code}</span>
      </p>

      <MonitorClient classId={classData.id} />
    </div>
  );
}
