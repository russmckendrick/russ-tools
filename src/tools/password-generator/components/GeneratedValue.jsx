import React from 'react';

export default function GeneratedValue({ entry }) {
  if (entry.kind !== 'passphrase') {
    return <p className="font-mono text-data-lg break-all select-all">{entry.value}</p>;
  }

  return (
    <p className="font-mono text-data-lg select-all [overflow-wrap:anywhere]" data-passphrase>
      {entry.parts.map((word, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <>
              {entry.separator}
              <wbr />
            </>
          )}
          <span className="whitespace-nowrap">{word}</span>
        </React.Fragment>
      ))}
    </p>
  );
}
