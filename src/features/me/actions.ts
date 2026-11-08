"use server";

import { unstable_rethrow } from "next/navigation";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/http";
import type { UpdateMeRequest } from "@/lib/api/types";

export type ProfileFormState = { ok: boolean; message: string; field?: string } | null;

/** PATCH /v1/me. jarlore-be validates every value (the time zone must be an IANA name). */
export async function updateProfile(_prev: ProfileFormState, form: FormData): Promise<ProfileFormState> {
  const name = String(form.get("displayName") ?? "").trim();
  const unitSystem = form.get("unitSystem");
  const tempUnit = form.get("tempUnit");
  const timezone = String(form.get("timezone") ?? "").trim();
  const patch: UpdateMeRequest = {
    displayName: name === "" ? null : name,
    ...(unitSystem === "metric" || unitSystem === "us" ? { unitSystem } : {}),
    ...(tempUnit === "C" || tempUnit === "F" ? { tempUnit } : {}),
    ...(timezone ? { timezone } : {}),
  };
  try {
    await api.updateMe(patch);
    return { ok: true, message: "Saved. Dates and times now follow these settings." };
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof ApiError) {
      const err = e.problem.errors?.[0];
      return { ok: false, message: err?.message ?? e.message, field: err?.field };
    }
    return { ok: false, message: "Couldn't reach Jarlore. Check your connection and try again." };
  }
}
