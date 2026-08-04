import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Tambahkan secret secara eksplisit dengan memanggil process.env
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  // Jika user mencoba mengakses dashboard tanpa token (belum login)
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// Konfigurasi path mana saja yang dilindungi middleware ini
export const config = {
  matcher: ["/dashboard/:path*"],
};