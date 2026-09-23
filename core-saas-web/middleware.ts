import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('core_saas_token')?.value;
  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith('/login');
  const isApiAuth = pathname.startsWith('/api/auth');

  if (isApiAuth) return NextResponse.next();

  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)\$).*)',
  ],
};
