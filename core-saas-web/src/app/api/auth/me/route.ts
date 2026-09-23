import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('core_saas_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }
  try {
    const apiRes = await fetch(${'$'}{process.env.NEXT_PUBLIC_API_URL}/auth/me, {
      headers: { Authorization: Bearer {token} },
      cache: 'no-store',
    });
    if (!apiRes.ok) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }
    const user = await apiRes.json();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ message: 'Erro na API' }, { status: 502 });
  }
}
