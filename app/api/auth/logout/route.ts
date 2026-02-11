import { signOut } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await signOut({ redirect: false });
  } catch (error) {
    // Ignore errors during signout
  }
  
  return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}
