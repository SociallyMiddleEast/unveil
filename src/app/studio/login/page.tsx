import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isStudio } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import "../studio.css";

export const metadata: Metadata = { title: "Studio sign in", robots: { index: false } };

export default async function LoginPage() {
  if (await isStudio()) redirect("/studio");
  return <div className="st"><LoginForm /></div>;
}
