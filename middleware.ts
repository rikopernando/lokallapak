import { auth } from '@/lib/auth';

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = req.nextUrl.pathname === '/admin/login';

  if (isAdminRoute && !isLoginPage && !req.auth) {
    const loginUrl = new URL('/admin/login', req.url);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
