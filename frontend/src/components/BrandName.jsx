import React from "react";

export default function BrandName({ className = "" }) {
  return (
    <span className={className} aria-label="DrishtiX">
      DRISHTI<span className="text-orange-500">X</span>
    </span>
  );
}
