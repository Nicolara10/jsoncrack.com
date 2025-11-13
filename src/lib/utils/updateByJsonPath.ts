
export function updateJsonAtPath(
    root: unknown,
    jsonPath: string,
    newValue: unknown
  ): unknown {
    if (!jsonPath) return root;
  
    const segments = parseJsonPath(jsonPath);
    if (!segments.length) return root;
  
    // Cheap deep clone so we don't mutate Zustand store data in place
    const clone =
      typeof structuredClone === "function"
        ? structuredClone(root)
        : JSON.parse(JSON.stringify(root));
  
    let current: any = clone;
  
    for (let i = 0; i < segments.length - 1; i++) {
      const key = segments[i];
  
      if (current == null || typeof current !== "object") {
        // Path is invalid, bail out but keep whatever we cloned
        return clone;
      }
  
      if (!(key in current)) {
        // Create missing branch so we can still set the leaf
        const nextKey = segments[i + 1];
        current[key] = typeof nextKey === "number" ? [] : {};
      }
  
      current = current[key];
    }
  
    const lastKey = segments[segments.length - 1];
  
    if (current != null && typeof current === "object") {
      (current as any)[lastKey as any] = newValue;
    }
  
    return clone;
  }
  
  /**
   * Very small parser for JSONPath strings of the form:
   *   $["fruits"][0]["name"]
   *   ${["fruits"][0]["name"]}
   *   $.fruits[0].name
   */
  function parseJsonPath(jsonPath: string): Array<string | number> {
    const result: Array<string | number> = [];
  
    let s = jsonPath.trim();
  
    // Strip leading ${ and trailing } if present
    if (s.startsWith("${") && s.endsWith("}")) {
      s = s.slice(2, -1);
    }
  
    // Strip leading $
    if (s.startsWith("$")) {
      s = s.slice(1);
    }
  
    const re = /\["([^"]+)"\]|\[(\d+)\]|\.([A-Za-z0-9_$]+)/g;
    let match: RegExpExecArray | null;
  
    while ((match = re.exec(s))) {
      if (match[1] != null) {
        // ["key"]
        result.push(match[1]);
      } else if (match[2] != null) {
        // [0]
        result.push(Number(match[2]));
      } else if (match[3] != null) {
        // .key
        result.push(match[3]);
      }
    }
  
    return result;
  }
  