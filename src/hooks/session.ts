"use client";

import useSWR from "swr";

const fetchSession = async () => {
  const res = await fetch("/api/session");
  if (!res.ok) throw new Error("Failed to fetch session");
  const data = await res.json();
  return data.session;
};

export const useSession = () => {
  const { data: session, error } = useSWR("/api/session", fetchSession);
  return { session, error };
};