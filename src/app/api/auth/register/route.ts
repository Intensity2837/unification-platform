import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password, name, school } = await request.json();

    if (!email || !password || !name || !school) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: '이미 존재하는 이메일입니다.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        school,
        role: 'TEACHER',
        isApproved: false, // 관리자 승인 대기
      },
    });

    return NextResponse.json({
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.',
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: '회원가입 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
