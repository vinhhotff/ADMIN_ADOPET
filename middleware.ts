import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'adopet-admin-session';
const PUBLIC_PATHS = ['/login', '/favicon.ico'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => {
    if (path === '/favicon.ico') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  });

  const hasSession = req.cookies.get(SESSION_COOKIE)?.value === 'active';

  if (!hasSession && !isPublic) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
