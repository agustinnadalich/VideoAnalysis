// Utilidades para detectar campos y aplicar mappings en preview
export function detectFieldsFromEvents(events: any[]) {
  const fieldMap: Record<string, Set<string>> = {};

  events.forEach((ev) => {
    // Top-level keys
    Object.keys(ev || {}).forEach((k) => {
      const v = ev[k];
      const path = k;
      if (!fieldMap[path]) fieldMap[path] = new Set();
      try { fieldMap[path].add(String(v)); } catch (e) { /* ignore */ }
    });

    // extra_data keys
    if (ev.extra_data && typeof ev.extra_data === 'object') {
      Object.keys(ev.extra_data).forEach((k) => {
        const v = ev.extra_data[k];
        const path = `extra_data.${k}`;
        if (!fieldMap[path]) fieldMap[path] = new Set();
        try { fieldMap[path].add(String(v)); } catch (e) {}
      });

      // descriptors inside extra_data
      const descriptors = ev.extra_data.descriptors;
      if (descriptors && typeof descriptors === 'object') {
        Object.keys(descriptors).forEach((k) => {
          const v = descriptors[k];
          const path = `extra_data.descriptors.${k}`;
          if (!fieldMap[path]) fieldMap[path] = new Set();
          try { fieldMap[path].add(String(v)); } catch (e) {}
        });
      }
    }
  });

  const fields = Object.keys(fieldMap).map((path) => {
    const examples = Array.from(fieldMap[path]).slice(0, 5).filter((v) => v !== 'undefined' && v !== 'null');
    const uniqueCount = fieldMap[path].size;
    // guess type by inspecting one example
    const sample = examples[0] || '';
    let type = 'string';
    if (!isNaN(Number(sample))) type = 'number';
    return { path, examples, uniqueCount, type };
  }).sort((a, b) => b.uniqueCount - a.uniqueCount);

  return fields;
}

function mmssToSeconds(val: string) {
  if (!val || typeof val !== 'string') return null;
  const parts = val.split(':').map(p => p.trim());
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseFloat(parts[1]) || 0;
    return m * 60 + s;
  }
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

export function applyMappingToEvents(events: any[], mapping: any[]) {
  // mapping: [{ source: 'extra_data.AVANCE', target: 'ADVANCE', transformer: 'to_upper' }, ...]
  return events.map((ev) => {
    const out = JSON.parse(JSON.stringify(ev)); // shallow clone

    if (!out.extra_data) out.extra_data = {};
    if (!out.extra_data.descriptors) out.extra_data.descriptors = {};

    mapping.forEach((m: any) => {
      const src = m.source;
      const tgt = m.target;
      let raw: any = null;

      // read source
      if (src.startsWith('extra_data.descriptors.')) {
        const key = src.replace('extra_data.descriptors.', '');
        raw = out.extra_data?.descriptors?.[key];
      } else if (src.startsWith('extra_data.')) {
        const key = src.replace('extra_data.', '');
        raw = out.extra_data?.[key];
      } else {
        raw = out[src];
      }

      // apply transformer
      let value = raw;
      if (m.transformer === 'to_upper' && typeof value === 'string') value = value.toUpperCase();
      if (m.transformer === 'split_and_dedupe' && typeof value === 'string') {
        const parts = value.split(',').map((p: string) => p.trim()).filter(Boolean);
        value = Array.from(new Set(parts));
      }
      if (m.transformer === 'mmss_to_seconds' && typeof value === 'string') {
        const seconds = mmssToSeconds(value);
        if (seconds !== null) value = seconds;
      }

      // write to target
      if (tgt.startsWith('extra_data.descriptors.')) {
        const key = tgt.replace('extra_data.descriptors.', '');
        out.extra_data.descriptors[key] = value;
      } else if (tgt.startsWith('extra_data.')) {
        const key = tgt.replace('extra_data.', '');
        out.extra_data[key] = value;
      } else {
        out[tgt] = value;
      }
    });

    return out;
  });
}
