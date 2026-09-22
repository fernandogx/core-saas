import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Chama a API NestJS
    const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        { message: data.message || 'Credenciais inválidas' },
        { status: apiRes.status },
      );
    }

    const response = NextResponse.json({ user: data.user }, { status: 200 });

    // Seta o JWT em cookie httpOnly (seguro)
    response.cookies.set('core_saas_token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24h (igual ao JWT_EXPIRES_IN)
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Erro ao conectar com a API' },
      { status: 502 },
    );
  }
}