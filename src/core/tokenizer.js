export function tokenize(code) {
  const lines = code.trim().split('\n');
  const tokens = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = i + 1;

    // Strip comments
    let processedLine = raw;
    const commentIndex = raw.indexOf('//');
    if (commentIndex !== -1) {
      processedLine = raw.substring(0, commentIndex).trimEnd();
    }

    if (!processedLine || processedLine.trim() === '') {
      continue;
    }

    try {
      const token = identifyToken(processedLine.trim(), line);
      tokens.push(token);
    } catch (err) {
      console.error(`Error on line ${line}:`, processedLine);
      throw err;
    }
  }

  return tokens;
}

function identifyToken(raw, line) {
  // ✅ FOR LOOP START
  if (raw.startsWith("FOR")) {
    const match = raw.match(/FOR\s+(\w+)\s*(←|<-|<--)\s*(.+)\s+TO\s+(.+)/);
    if (!match) throw new Error(`Invalid FOR loop on line ${line}`);
    const [, variable, , from, to] = match;
    return { type: "FOR_LOOP_START", variable, from: from.trim(), to: to.trim(), line };
  }

  // ✅ FOR LOOP END
  if (raw.startsWith("NEXT")) {
    const match = raw.match(/NEXT\s+(\w+)/);
    if (!match) throw new Error(`Invalid NEXT statement on line ${line}`);
    const [, variable] = match;
    return { type: "FOR_LOOP_END", variable, line };
  }

  // ✅ WHILE LOOP
  if (raw.startsWith("WHILE")) {
    const condition = raw.replace("WHILE", "").trim();
    return { type: "WHILE_START", condition, line };
  }

  if (raw === "ENDWHILE") return { type: "WHILE_END", line };

  // ✅ REPEAT/UNTIL
  if (raw === "REPEAT") return { type: "REPEAT_START", line };
  if (raw.startsWith("UNTIL")) {
    const condition = raw.replace("UNTIL", "").trim();
    return { type: "REPEAT_END", condition, line };
  }

  // ✅ DECLARE ARRAY
  if (raw.startsWith("DECLARE") && raw.includes("ARRAY")) {
    const match = raw.match(/DECLARE\s+(\w+)\s*:\s*ARRAY\s*\[([^\]]+)\]\s*OF\s+(\w+)/);
    if (!match) throw new Error(`Invalid array declaration on line ${line}`);
    const [, name, bounds, elementType] = match;
    const dimensions = bounds.split(",").map(dim => {
      const [lower, upper] = dim.trim().split(":").map(b => b.trim());
      return { lower: parseInt(lower), upper: parseInt(upper) };
    });
    return { type: "DECLARE_ARRAY", name, dimensions, elementType, line };
  }

  // ✅ DECLARE VARIABLE
  if (raw.startsWith("DECLARE")) {
    const match = raw.match(/DECLARE\s+(\w+)\s*:\s*(\w+)/);
    if (!match) throw new Error(`Invalid DECLARE statement on line ${line}`);
    const [, name, datatype] = match;
    return { type: "DECLARE", name, datatype, line };
  }

  // ✅ ASSIGNMENT
  if (raw.includes("←") || raw.includes("<--") || raw.includes("<-")) {
    const parts = raw.split(/←|<--|<-/);
    if (parts.length === 2) {
      const [left, right] = parts.map(s => s.trim());
      return { type: "ASSIGN", left, right, line };
    }
  }

  // ✅ OUTPUT
  if (raw.startsWith("OUTPUT")) {
    const value = raw.replace("OUTPUT", "").trim();
    return { type: "OUTPUT", value, line };
  }

  // ✅ INPUT
  if (raw.startsWith("INPUT")) {
    const variable = raw.replace("INPUT", "").trim();
    return { type: "INPUT", variable, line };
  }

  // ✅ FUNCTION
  if (raw.startsWith("FUNCTION")) {
    const match = raw.match(/FUNCTION\s+(\w+)\s*\(([^)]*)\)\s*RETURNS\s+(\w+)/);
    if (!match) throw new Error(`Invalid FUNCTION declaration on line ${line}`);
    const [, name, params, returnType] = match;
    return { type: "FUNCTION_START", name, params, returnType, line };
  }
  if (raw === "ENDFUNCTION") return { type: "FUNCTION_END", line };

  // ✅ PROCEDURE
  if (raw.startsWith("PROCEDURE")) {
    const match = raw.match(/PROCEDURE\s+(\w+)\s*\(([^)]*)\)/);
    if (!match) throw new Error(`Invalid PROCEDURE declaration on line ${line}`);
    const [, name, params] = match;
    return { type: "PROCEDURE_START", name, params, line };
  }
  if (raw === "ENDPROCEDURE") return { type: "PROCEDURE_END", line };

  // ✅ RETURN
  if (raw.startsWith("RETURN")) {
    const value = raw.replace("RETURN", "").trim();
    return { type: "RETURN", value, line };
  }

  // ❌ If no rule matched
  throw new Error(`Unknown statement on line ${line}: "${raw}"`);
}



function parseParameters(paramString, line) {
  if (!paramString.trim()) return [];
  
  const params = [];
  const parts = paramString.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    
    let passingMethod = 'BYVAL'; // default
    let paramDef = trimmed;
    
    if (trimmed.startsWith('BYREF')) {
      passingMethod = 'BYREF';
      paramDef = trimmed.replace('BYREF', '').trim();
    } else if (trimmed.startsWith('BYVAL')) {
      passingMethod = 'BYVAL';
      paramDef = trimmed.replace('BYVAL', '').trim();
    }
    
    const colonIndex = paramDef.indexOf(':');
    if (colonIndex === -1) {
      throw new Error(`Invalid parameter definition "${trimmed}" on line ${line}`);
    }
    
    const name = paramDef.substring(0, colonIndex).trim();
    const datatype = paramDef.substring(colonIndex + 1).trim();
    
    params.push({ name, datatype, passingMethod });
  }
  
  return params;
}

/** ==================================================
 * 🔹 collectSymbols for syntax highlighting
 * ================================================== */
export function collectSymbols(tokens) {
  const declared = new Set();
  const funcs = new Set();
  const procs = new Set();

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    // Variable declarations
    if (t.type === 'DECLARE' || t.type === 'DECLARE_ARRAY') {
      if (t.name) declared.add(t.name);
    }

    // Function definitions
    if (t.type === 'FUNCTION_START') {
      if (t.name) funcs.add(t.name);
    }

    // Procedure definitions
    if (t.type === 'PROCEDURE_START') {
      if (t.name) procs.add(t.name);
    }
  }

  return { declared, funcs, procs };
}
