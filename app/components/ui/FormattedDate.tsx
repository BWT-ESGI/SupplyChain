"use client";

import { useEffect, useState } from "react";

type FormattedDateProps = {
  timestamp: number;
  mode?: "date" | "time" | "full";
};

export function FormattedDate({ timestamp, mode = "date" }: FormattedDateProps) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    const date = new Date(timestamp * 1000);
    if (mode === "time") {
      setFormatted(date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    } else if (mode === "full") {
      setFormatted(date.toLocaleString("fr-FR"));
    } else {
      setFormatted(date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }));
    }
  }, [timestamp, mode]);

  if (!formatted) return <span className="bg-stone-100 rounded h-4 w-12 inline-block" />;

  return <span>{formatted}</span>;
}
