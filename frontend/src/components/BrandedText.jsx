import React from "react";

export default function BrandedText({ children }) {
  const text = String(children ?? "");

  return text.split(/(DrishtiX)/gi).map((part, index) => {
    if (!/^DrishtiX$/i.test(part)) return part;
    return (
      <React.Fragment key={`${part}-${index}`}>
        {part.slice(0, -1)}
        <span className="text-orange-500">{part.slice(-1)}</span>
      </React.Fragment>
    );
  });
}
