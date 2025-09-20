export type Token =
  | { type: "CASE_START"; variable: string; line: number }
  | { type: "CASE_END"; line: number }
  | { type: "CASE_OTHERWISE"; statement: string | null; line: number }
  | {
      type: "CASE_CLAUSE";
      condition:
        | { type: "range"; from: string; to: string }
        | { type: "multiple"; values: string[] }
        | { type: "single"; value: string };
      statement: string;
      line: number;
    }
  | { type: "FOR_LOOP_START"; variable: string; from: string; to: string; line: number }
  | { type: "FOR_LOOP_END"; variable: string; line: number }
  | { type: "WHILE_START"; condition: string; line: number }
  | { type: "WHILE_END"; line: number }
  | { type: "REPEAT_START"; line: number }
  | { type: "REPEAT_END"; condition: string; line: number }
  | { type: "TYPE_START"; typeName: string; line: number }
  | { type: "TYPE_END"; line: number }
  | {
      type: "DECLARE_ARRAY";
      name: string;
      dimensions: Array<{ lower: number; upper: number }>;
      elementType: string;
      line: number;
    }
  | { type: "DECLARE"; name: string; datatype: string; line: number }
  | {
      type: "ASSIGN_RECORD_FIELD";
      recordName: string;
      fieldName: string;
      right: string;
      line: number;
    }
  | {
      type: "ASSIGN_ARRAY_RECORD_FIELD";
      arrayName: string;
      index: string;
      fieldName: string;
      right: string;
      line: number;
    }
  | { type: "ASSIGN_ARRAY"; arrayName: string; indices: string[]; right: string; line: number }
  | { type: "ASSIGN"; left: string; right: string; line: number }
  | { type: "PROCEDURE_START"; name: string; parameters: Parameter[]; line: number }
  | { type: "PROCEDURE_END"; line: number }
  | {
      type: "FUNCTION_START";
      name: string;
      parameters: Parameter[];
      returnType: string;
      line: number;
    }
  | { type: "FUNCTION_END"; line: number }
  | { type: "RETURN"; value: string; line: number }
  | { type: "CONSTANT"; name: string; value: string; line: number }
  | { type: "IF_START"; condition: string; line: number }
  | { type: "ELSE"; line: number }
  | { type: "ENDIF"; line: number }
  | { type: "INPUT"; variable: string; line: number }
  | { type: "OPENFILE"; fileName: string; mode: string; line: number }
  | { type: "CLOSEFILE"; fileName: string; line: number }
  | { type: "READFILE"; fileName: string; variable: string; line: number }
  | { type: "WRITEFILE"; fileName: string; data: string; line: number }
  | { type: "CALL"; functionName: string; arguments: string[]; line: number }
  | { type: "OUTPUT"; value: string; line: number };

export interface Parameter {
  name: string;
  datatype: string;
  passingMethod: "BYVAL" | "BYREF";
}

export function tokenize(code: string): Token[] {
  const lines = code.trim().split("\n");
  const tokens: Token[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = i + 1;

    // Strip comments from the line
    let processedLine = raw;
    const commentIndex = raw.indexOf("//");
    if (commentIndex !== -1) {
      processedLine = raw.substring(0, commentIndex).trimEnd();
    }

    if (!processedLine || processedLine.trim() === "") {
      console.log(`Skipping empty line ${line}`);
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

function identifyToken(raw: string, line: number): Token {
  console.log("Parsing line:", line, raw);

  // CASE OF statement
  if (raw.startsWith("CASE OF")) {
    const variable = raw.replace("CASE OF", "").trim();
    if (!variable)
      throw new Error(`Invalid CASE statement on line ${line} - missing variable`);
    return { type: "CASE_START", variable, line };
  }

  // ENDCASE
  if (raw === "ENDCASE") {
    return { type: "CASE_END", line };
  }

  // OTHERWISE clause
  if (raw.startsWith("OTHERWISE")) {
    const rest = raw.replace("OTHERWISE", "").trim();
    if (rest.startsWith(":")) {
      // OTHERWISE with inline statement
      const statement = rest.substring(1).trim();
      return { type: "CASE_OTHERWISE", statement, line };
    }
    return { type: "CASE_OTHERWISE", statement: null, line };
  }

  // CASE clause (value or range) - must check BEFORE other statements
  if (raw.includes(":") && !raw.startsWith("DECLARE") && !raw.startsWith("FOR")) {
    const colonIndex = raw.indexOf(":");
    const beforeColon = raw.substring(0, colonIndex).trim();

    if (
      beforeColon.match(/^['"]/) ||
      beforeColon.match(/^\d/) ||
      beforeColon.includes(" TO ") ||
      beforeColon.includes(",")
    ) {
      const condition = beforeColon;
      const statement = raw.substring(colonIndex + 1).trim();

      if (condition.includes(" TO ")) {
        const [from, to] = condition.split(" TO ").map((s) => s.trim());
        return {
          type: "CASE_CLAUSE",
          condition: { type: "range", from, to },
          statement,
          line,
        };
      } else if (condition.includes(",")) {
        const values = condition.split(",").map((s) => s.trim());
        return {
          type: "CASE_CLAUSE",
          condition: { type: "multiple", values },
          statement,
          line,
        };
      } else {
        return {
          type: "CASE_CLAUSE",
          condition: { type: "single", value: condition },
          statement,
          line,
        };
      }
    }
  }

  // FOR loop
  if (raw.startsWith("FOR")) {
    const match = raw.match(/FOR\s+(\w+)\s*(←|<-|<--)\s*(.+)\s+TO\s+(.+)/);
    if (!match) throw new Error(`Invalid FOR loop on line ${line}`);
    const [, variable, , from, to] = match;
    return {
      type: "FOR_LOOP_START",
      variable,
      from: from.trim(),
      to: to.trim(),
      line,
    };
  }

  // WHILE loop
  if (raw.startsWith("WHILE")) {
    const condition = raw.replace("WHILE", "").trim();
    if (!condition)
      throw new Error(`Invalid WHILE statement on line ${line} - missing condition`);
    return { type: "WHILE_START", condition, line };
  }

  // ENDWHILE
  if (raw === "ENDWHILE") {
    return { type: "WHILE_END", line };
  }

  // REPEAT loop
  if (raw === "REPEAT") {
    return { type: "REPEAT_START", line };
  }

  // UNTIL (end of REPEAT loop)
  if (raw.startsWith("UNTIL")) {
    const condition = raw.replace("UNTIL", "").trim();
    if (!condition)
      throw new Error(`Invalid UNTIL statement on line ${line} - missing condition`);
    return { type: "REPEAT_END", condition, line };
  }

  // TYPE definition start
  if (raw.startsWith("TYPE")) {
    const typeName = raw.replace("TYPE", "").trim();
    if (!typeName)
      throw new Error(`Invalid TYPE declaration on line ${line}`);
    return { type: "TYPE_START", typeName, line };
  }

  // ENDTYPE
  if (raw === "ENDTYPE") {
    return { type: "TYPE_END", line };
  }

  // DECLARE with Record type (check after ARRAY but before regular DECLARE)
  if (raw.startsWith("DECLARE")) {
    if (raw.includes("ARRAY")) {
      const match = raw.match(/DECLARE\s+(\w+)\s*:\s*ARRAY\s*\[([^\]]+)\]\s*OF\s+(\w+)/);
      if (match) {
        const [, name, bounds, elementType] = match;
        const dimensions = bounds.split(",").map((dim) => {
          const [lower, upper] = dim.trim().split(":").map((b) => b.trim());
          return { lower: parseInt(lower), upper: parseInt(upper) };
        });
        return {
          type: "DECLARE_ARRAY",
          name: name.trim(),
          dimensions,
          elementType: elementType.trim(),
          line,
        };
      }
    }

    // Regular variable declaration (could be a record type)
    const parts = raw.split(":").map((s) => s.trim());
    if (parts.length === 2) {
      const name = parts[0].replace("DECLARE", "").trim();
      const datatype = parts[1].trim();
      return { type: "DECLARE", name, datatype, line };
    }

    throw new Error(`Invalid DECLARE statement on line ${line}`);
  }

  // Assignment with record field access (before regular assignment)
  if (raw.includes("←") || raw.includes("<--") || raw.includes("<-")) {
    const parts = raw.split(/←|<--|<-/);
    if (parts.length === 2) {
      const [left, right] = parts.map((s) => s.trim());

      if (left.includes(".")) {
        const [recordName, fieldName] = left.split(".").map((s) => s.trim());
        return {
          type: "ASSIGN_RECORD_FIELD",
          recordName,
          fieldName,
          right,
          line,
        };
      }

      const arrayRecordMatch = left.match(/^(\w+)\[([^\]]+)\]\.(\w+)$/);
      if (arrayRecordMatch) {
        const [, arrayName, index, fieldName] = arrayRecordMatch;
        return {
          type: "ASSIGN_ARRAY_RECORD_FIELD",
          arrayName,
          index,
          fieldName,
          right,
          line,
        };
      }

      const arrayMatch = left.match(/^(\w+)\[([^\]]+)\]$/);
      if (arrayMatch) {
        const [, arrayName, indices] = arrayMatch;
        return {
          type: "ASSIGN_ARRAY",
          arrayName: arrayName.trim(),
          indices: indices.split(",").map((i) => i.trim()),
          right: right.trim(),
          line,
        };
      }

      return { type: "ASSIGN", left, right, line };
    }
  }

  // DECLARE with ARRAY type (duplicate check if reached)
  if (raw.startsWith("DECLARE")) {
    if (raw.includes("ARRAY")) {
      const match = raw.match(/DECLARE\s+(\w+)\s*:\s*ARRAY\s*\[([^\]]+)\]\s*OF\s+(\w+)/);
      if (!match) throw new Error(`Invalid array declaration on line ${line}`);
      const [, name, bounds, elementType] = match;
      const dimensions = bounds.split(",").map((dim) => {
        const [lower, upper] = dim.trim().split(":").map((b) => b.trim());
        return { lower: parseInt(lower), upper: parseInt(upper) };
      });
      return {
        type: "DECLARE_ARRAY",
        name: name.trim(),
        dimensions,
        elementType: elementType.trim(),
        line,
      };
    }
    // If not an array, a simple declaration (as fallback)
    const [, name, , datatype] = raw.split(" ");
    return { type: "DECLARE", name, datatype, line };
  }

  // ASSIGNMENT with array indexing (duplicate check)
  if (raw.includes("←") || raw.includes("<--") || raw.includes("<-")) {
    const parts = raw.split(/←|<--|<-/);
    if (parts.length === 2) {
      const [left, right] = parts.map((s) => s.trim());
      const arrayMatch = left.match(/^(\w+)\[([^\]]+)\]$/);
      if (arrayMatch) {
        const [, arrayName, indices] = arrayMatch;
        return {
          type: "ASSIGN_ARRAY",
          arrayName: arrayName.trim(),
          indices: indices.split(",").map((i) => i.trim()),
          right: right.trim(),
          line,
        };
      }
      return { type: "ASSIGN", left, right, line };
    }
  }

  // PROCEDURE definition start
  if (raw.startsWith("PROCEDURE")) {
    const match = raw.match(/PROCEDURE\s+(\w+)\s*\(([^)]*)\)/);
    if (!match) throw new Error(`Invalid PROCEDURE declaration on line ${line}`);
    const [, name, params] = match;
    const parameters = params.trim() ? parseParameters(params, line) : [];
    return { type: "PROCEDURE_START", name, parameters, line };
  }

  // ENDPROCEDURE
  if (raw === "ENDPROCEDURE") {
    return { type: "PROCEDURE_END", line };
  }

  // FUNCTION definition start
  if (raw.startsWith("FUNCTION")) {
    const match = raw.match(/FUNCTION\s+(\w+)\s*\(([^)]*)\)\s*RETURNS\s+(\w+)/);
    if (!match) throw new Error(`Invalid FUNCTION declaration on line ${line}`);
    const [, name, params, returnType] = match;
    const parameters = params.trim() ? parseParameters(params, line) : [];
    return { type: "FUNCTION_START", name, parameters, returnType, line };
  }

  // ENDFUNCTION
  if (raw === "ENDFUNCTION") {
    return { type: "FUNCTION_END", line };
  }

  // RETURN statement
  if (raw.startsWith("RETURN")) {
    const value = raw.replace("RETURN", "").trim();
    return { type: "RETURN", value, line };
  }

  // CONSTANT
  if (raw.startsWith("CONSTANT")) {
    const match = raw.match(/CONSTANT\s+(\w+)\s*=\s*(.+)/);
    if (!match)
      throw new Error(`Invalid CONSTANT declaration on line ${line}`);
    const [, name, value] = match;
    return { type: "CONSTANT", name: name.trim(), value: value.trim(), line };
  }

  // IF statement
  if (raw.startsWith("IF") && raw.includes("THEN")) {
    const match = raw.match(/IF (.+) THEN/);
    if (!match) throw new Error(`Invalid IF statement on line ${line}`);
    return { type: "IF_START", condition: match[1].trim(), line };
  }

  // ELSE
  if (raw.trim() === "ELSE") {
    return { type: "ELSE", line };
  }

  // ENDIF
  if (raw.trim() === "ENDIF") {
    return { type: "ENDIF", line };
  }

  // INPUT
  if (raw.startsWith("INPUT")) {
    const variable = raw.replace("INPUT", "").trim();
    if (!variable)
      throw new Error(`Invalid INPUT statement on line ${line} - missing variable`);
    return { type: "INPUT", variable, line };
  }

  // OPENFILE statement
  if (raw.startsWith("OPENFILE")) {
    let match = raw.match(/OPENFILE\s+"([^"]+)"\s+FOR\s+(READ|WRITE|APPEND)/);
    if (!match) {
      const match2 = raw.match(/OPENFILE\s+(\w+)\s+FOR\s+(READ|WRITE|APPEND)/);
      if (match2) {
        const [, fileName, mode] = match2;
        return { type: "OPENFILE", fileName, mode, line };
      }
      throw new Error(`Invalid OPENFILE statement on line ${line}`);
    }
    const [, fileName, mode] = match;
    return { type: "OPENFILE", fileName: `"${fileName}"`, mode, line };
  }

  // CLOSEFILE statement
  if (raw.startsWith("CLOSEFILE")) {
    const fileName = raw.replace("CLOSEFILE", "").trim();
    if (!fileName)
      throw new Error(`Invalid CLOSEFILE statement on line ${line} - missing filename`);
    return { type: "CLOSEFILE", fileName, line };
  }

  // READFILE statement
  if (raw.startsWith("READFILE")) {
    let match = raw.match(/READFILE\s+"([^"]+)",\s*(\w+)/);
    if (!match) {
      const match2 = raw.match(/READFILE\s+(\w+),\s*(\w+)/);
      if (match2) {
        const [, fileName, variable] = match2;
        return { type: "READFILE", fileName, variable, line };
      }
      throw new Error(`Invalid READFILE statement on line ${line}`);
    }
    const [, fileName, variable] = match;
    return { type: "READFILE", fileName: `"${fileName}"`, variable, line };
  }

  // WRITEFILE statement
  if (raw.startsWith("WRITEFILE")) {
    let match = raw.match(/WRITEFILE\s+"([^"]+)",\s*(.+)/);
    if (!match) {
      const match2 = raw.match(/WRITEFILE\s+(\w+),\s*(.+)/);
      if (match2) {
        const [, fileName, data] = match2;
        return { type: "WRITEFILE", fileName, data, line };
      }
      throw new Error(`Invalid WRITEFILE statement on line ${line}`);
    }
    const [, fileName, data] = match;
    return { type: "WRITEFILE", fileName: `"${fileName}"`, data, line };
  }

  // CALL statements
  if (raw.startsWith("CALL")) {
    const match = raw.match(/CALL\s+(\w+)\s*\(([^)]*)\)/);
    if (match) {
      const [, functionName, args] = match;
      const callArguments = args.trim() ? args.split(",").map((a) => a.trim()) : [];
      return { type: "CALL", functionName, arguments: callArguments, line };
    }
    const functionName = raw.replace("CALL", "").trim();
    return { type: "CALL", functionName, arguments: [], line };
  }

  // OUTPUT
  if (raw.startsWith("OUTPUT")) {
    const value = raw.replace("OUTPUT", "").trim();
    return { type: "OUTPUT", value, line };
  }

  // NEXT (for FOR loop end)
  if (raw.startsWith("NEXT")) {
    const variable = raw.split(" ")[1];
    return { type: "FOR_LOOP_END", variable, line };
  }

  throw new Error(`Unknown statement on line ${line}: "${raw}"`);
}

function parseParameters(paramString: string, line: number): Parameter[] {
  if (!paramString.trim()) return [];

  const params: Parameter[] = [];
  const parts = paramString.split(",");

  for (const part of parts) {
    const trimmed = part.trim();
    let passingMethod: "BYVAL" | "BYREF" = "BYVAL";
    let paramDef = trimmed;

    if (trimmed.startsWith("BYREF")) {
      passingMethod = "BYREF";
      paramDef = trimmed.replace("BYREF", "").trim();
    } else if (trimmed.startsWith("BYVAL")) {
      passingMethod = "BYVAL";
      paramDef = trimmed.replace("BYVAL", "").trim();
    }

    const colonIndex = paramDef.indexOf(":");
    if (colonIndex === -1) {
      throw new Error(`Invalid parameter definition "${trimmed}" on line ${line}`);
    }

    const name = paramDef.substring(0, colonIndex).trim();
    const datatype = paramDef.substring(colonIndex + 1).trim();

    params.push({ name, datatype, passingMethod });
  }

  return params;
}