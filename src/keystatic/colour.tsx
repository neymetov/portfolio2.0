import { useEffect, useState } from 'react';
import type { BasicFormField } from '@keystatic/core';

const HEX = /^#[0-9a-f]{6}$/i;
const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

/**
 * A colour field for Keystatic: the system colour picker plus a hex box.
 * The stored value is always a valid #rrggbb string, so nothing invalid can be saved.
 */
export function colour({ label, defaultValue, description }: { label: string; defaultValue: string; description?: string }): BasicFormField<string> {
  return {
    kind: 'form',
    label,
    defaultValue: () => defaultValue,
    parse: (value) => (typeof value === 'string' && HEX.test(value) ? value : defaultValue),
    serialize: (value) => ({ value }),
    validate: (value) => value,
    reader: { parse: (value) => (typeof value === 'string' && HEX.test(value) ? value : defaultValue) },
    Input({ value, onChange }) {
      const [text, setText] = useState(value);
      useEffect(() => setText(value), [value]);
      const commit = (next: string) => {
        setText(next);
        const hex = next.startsWith('#') ? next : `#${next}`;
        if (HEX.test(hex)) onChange(hex.toLowerCase());
      };
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: FONT }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>{label}</label>
          {description && <span style={{ fontSize: 12, opacity: 0.7 }}>{description}</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={HEX.test(value) ? value : defaultValue} onChange={(event) => commit(event.target.value)} style={{ width: 44, height: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }} aria-label={`${label} picker`} />
            <input
              type="text"
              value={text}
              onChange={(event) => commit(event.target.value)}
              onBlur={() => setText(value)}
              spellCheck={false}
              maxLength={7}
              style={{ width: 110, height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid rgba(128,128,128,.5)', background: 'transparent', color: 'inherit', fontFamily: FONT, fontSize: 14 }}
              aria-label={`${label} hex`}
            />
          </div>
        </div>
      );
    },
  };
}
