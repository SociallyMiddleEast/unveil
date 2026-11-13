import type { Metadata } from "next";
import Link from "next/link";
import { requireStudio } from "@/lib/auth";
import { StudioBar } from "@/components/StudioBar";
import { WeddingForm } from "../WeddingForm";
import "../studio.css";

export const metadata: Metadata = { title: "New wedding", robots: { index: false } };

export default async function NewWedding() {
  await requireStudio();
  return (
    <div className="st">
      <StudioBar tag="Studio"><Link className="btn btn-sm" href="/studio">All weddings</Link></StudioBar>
      <main className="st-main">
        <div><h1>New wedding</h1><p className="st-sub">Fill in what the couple sent you. You can change any of it later.</p></div>
        <div className="st-card"><WeddingForm /></div>
      </main>
    </div>
  );
}
