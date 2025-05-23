// // // middleware.ts
// // import { NextResponse } from 'next/server';
// // import type { NextRequest } from 'next/server';
// // import { getToken } from 'next-auth/jwt';

// // const PROTECTED_ROUTES = ['/recording', '/presentation', '/resume'];

// // export async function middleware(request: NextRequest) {
// //   const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
// //   const { pathname } = request.nextUrl;

// //   const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

// //   if (isProtected && !token) {
// //     const signInUrl = new URL('/login', request.url);  // fixed route
// //     signInUrl.searchParams.set('callbackUrl', request.url);
// //     return NextResponse.redirect(signInUrl);
// //   }

// //   return NextResponse.next();
// // }

// // export const config = {
// //   matcher: ['/recording/:path*', '/presentation/:path*', '/resume/:path*'],
// // };


// // middleware.ts
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { getToken } from 'next-auth/jwt';

// const PROTECTED_ROUTES = ['/recording', '/presentation', '/resume'];

// export async function middleware(request: NextRequest) {
//   const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
//   const { pathname } = request.nextUrl;

//   const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

//   if (isProtected && !token) {
//     const signInUrl = new URL('/login', request.url);
//     signInUrl.searchParams.set('callbackUrl', request.url);

//     const response = NextResponse.redirect(signInUrl);
//     response.headers.set('x-middleware-status', 'unauthenticated'); // Optional debug header
//     return response;
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ['/((?!login).*)'], // Exclude /login from being protected
// };
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PROTECTED_PATHS = ['/recording', '/presentation', '/resume'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (isProtected && !token) {
    const signInUrl = new URL('/login', request.url);
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// export const config = {
//   matcher: ['/((?!_next|favicon.ico|login|auth|api|static).*)'],
// };
export const config = {
  matcher: ['/recording/:path*', '/presentation/:path*', '/resume/:path*'],
};

