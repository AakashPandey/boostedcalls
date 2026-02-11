"use client";
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";

export function LogoutButton() {
  return (
    <Button
      onClick={() => signOut({ redirectTo: "/" })}
      variant="ghost"
      className="text-sm cursor-pointer"
    >
      Log out
    </Button>
  );
}
