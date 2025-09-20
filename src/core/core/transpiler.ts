interface BuiltinFunctionDef {
  params: string[][];
  returns: string;
}

interface FileEntry {
  mode: string | null;
  content: string[];
  position: number;
  modified: boolean;
}

interface ArrayInfo {
  dimensions: { lower: number; upper: number }[];
  elementType: string;
  isRecordType: boolean;
}

export function transpile(ast: any): string {
  // Track declared variables and whether they've been initialized
  const declaredVars: Set<string> = new Set();
  const initializedVars: Set<string> = new Set();
  const varTypes: Map<string, string> = new Map(); // Track variable datatypes
  const constants: Set<string> = new Set(); // Track constant names
  const arrays: Map<string, ArrayInfo> = new Map(); // Track array info
  const recordTypes: Map<string, any> = new Map(); // Track user-defined record types
  
  // Valid datatypes according to specification
  const VALID_DATATYPES: string[] = ['INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN', 'DATE'];

  const BUILTIN_FUNCTIONS: { [key: string]: BuiltinFunctionDef } = {
    // String functions
    'LEFT': { params: [['STRING'], ['INTEGER']], returns: 'STRING' },
    'RIGHT': { params: [['STRING'], ['INTEGER']], returns: 'STRING' },
    'MID': { params: [['STRING'], ['INTEGER'], ['INTEGER']], returns: 'STRING' },
    'LENGTH': { params: [['STRING', 'CHAR']], returns: 'INTEGER' },
    'TO_UPPER': { params: [['STRING', 'CHAR']], returns: 'STRING' },
    'TO_LOWER': { params: [['STRING', 'CHAR']], returns: 'STRING' },
    'NUM_TO_STR': { params: [['INTEGER', 'REAL']], returns: 'STRING' },
    'STR_TO_NUM': { params: [['STRING', 'CHAR']], returns: 'REAL' },
    'IS_NUM': { params: [['STRING', 'CHAR']], returns: 'BOOLEAN' },
    'ASC': { params: [['CHAR']], returns: 'INTEGER' },
    'CHR': { params: [['INTEGER']], returns: 'CHAR' },
    'LCASE': { params: [['CHAR']], returns: 'CHAR' },
    'UCASE': { params: [['CHAR']], returns: 'CHAR' },
    // Numeric functions
    'INT': { params: [['REAL']], returns: 'INTEGER' },
    'RAND': { params: [['INTEGER']], returns: 'REAL' },
    // Date functions
    'DAY': { params: [['DATE']], returns: 'INTEGER' },
    'MONTH': { params: [['DATE']], returns: 'INTEGER' },
    'YEAR': { params: [['DATE']], returns: 'INTEGER' },
    'DAYINDEX': { params: [['DATE']], returns: 'INTEGER' },
    'SETDATE': { params: [['INTEGER'], ['INTEGER'], ['INTEGER']], returns: 'DATE' },
    'TODAY': { params: [], returns: 'DATE' },
    'EOF': { params: [['STRING']], returns: 'BOOLEAN' }
  };

  // JavaScript implementations of built-in functions (typed as string)
  const builtInImplementations: string = `// Built-in functions
function LEFT(str, x) { 
  return str.substring(0, x); 
}
function RIGHT(str, x) { 
  return str.substring(str.length - x); 
}
function MID(str, x, y) { 
  return str.substring(x - 1, x - 1 + y); 
}
function LCASE(char) { 
  return char.toLowerCase(); 
}
function UCASE(char) { 
  return char.toUpperCase(); 
}
function LENGTH(str) { 
  return str.length; 
}
function TO_UPPER(x) { 
  return x.toUpperCase(); 
}
function TO_LOWER(x) { 
  return x.toLowerCase(); 
}
function NUM_TO_STR(x) { 
  return String(x); 
}
function STR_TO_NUM(x) { 
  return parseFloat(x); 
}
function IS_NUM(str) { 
  return !isNaN(parseFloat(str)) && isFinite(str); 
}
function ASC(char) { 
  return char.charCodeAt(0); 
}
function CHR(x) { 
  return String.fromCharCode(x); 
}
function INT(x) { 
  return Math.floor(x); 
}
function RAND(x) { 
  return Math.random() * x; 
}
function DAY(date) { 
  return date.getDate(); 
}
function MONTH(date) { 
  return date.getMonth() + 1; 
}
function YEAR(date) { 
  return date.getFullYear(); 
}
function DAYINDEX(date) { 
  return date.getDay() + 1; 
}
function SETDATE(day, month, year) { 
  return new Date(year, month - 1, day); 
}
function TODAY() { 
  return new Date(); 
}

`;

  // FILE HANDLING

  const fileHandlingImplementation: string = `
// File handling implementation
const __files = new Map<string, FileEntry>();

function OPENFILE(fileName, mode) {
  if (!__files.has(fileName)) {
    __files.set(fileName, { 
      mode: mode, 
      content: [], 
      position: 0,
      modified: false 
    });
  }
  
  const file = __files.get(fileName)!;
  
  if (mode === 'WRITE') {
    file.content = [];
    file.position = 0;
    file.modified = true;
  } else if (mode === 'APPEND') {
    file.position = file.content.length;
    file.modified = true;
  } else if (mode === 'READ') {
    file.position = 0;
  }
  file.mode = mode;
}

function CLOSEFILE(fileName) {
  if (__files.has(fileName)) {
    const file = __files.get(fileName)!;
    file.mode = null;
  }
}

function READFILE(fileName) {
  if (!__files.has(fileName)) {
    throw new Error('File ' + fileName + ' not opened');
  }
  const file = __files.get(fileName)!;
  if (file.mode !== 'READ') {
    throw new Error('File ' + fileName + ' not opened for reading');
  }
  if (file.position < file.content.length) {
    return file.content[file.position++];
  }
  return "";
}

function WRITEFILE(fileName, data) {
  if (!__files.has(fileName)) {
    throw new Error('File ' + fileName + ' not opened');
  }
  const file = __files.get(fileName)!;
  if (file.mode !== 'WRITE' && file.mode !== 'APPEND') {
    throw new Error('File ' + fileName + ' not opened for writing');
  }
  file.content.push(String(data));
  file.modified = true;
}

function EOF(fileName) {
  if (!__files.has(fileName)) {
    return true;
  }
  const file = __files.get(fileName)!;
  return file.position >= file.content.length;
}

`;

  // Helper function to validate built-in function call
  function validateBuiltinFunctionCall(funcName: string, args: string, line: number): void {
    const funcDef = BUILTIN_FUNCTIONS[funcName];
    if (!funcDef) return;
    
    const argList = args.trim() === '' ? [] : args.split(',').map(a => a.trim());
    const expectedCount = funcDef.params.length;
    const providedCount = argList.length;
    
    if (expectedCount !== providedCount) {
      throw new Error(`Built-in function "${funcName}" expects ${expectedCount} parameter(s) but ${providedCount} were provided (line ${line})`);
    }
    
    argList.forEach((arg, index) => {
      const expectedTypes = funcDef.params[index];
      let actualType: string | null = null;
      
      if (arg.startsWith('"') && arg.endsWith('"')) {
        actualType = 'STRING';
      } else if (arg.startsWith("'") && arg.endsWith("'")) {
        actualType = 'CHAR';
      } else if (arg === 'TRUE' || arg === 'FALSE') {
        actualType = 'BOOLEAN';
      } else if (/^-?\d+$/.test(arg)) {
        actualType = 'INTEGER';
      } else if (/^-?\d+\.\d+$/.test(arg)) {
        actualType = 'REAL';
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(arg)) {
        actualType = 'DATE';
      } else {
        const varType = varTypes.get(arg);
        if (varType) {
          actualType = varType;
        } else if (arg.includes('+') || arg.includes('-') || arg.includes('*') || arg.includes('/')) {
          if (arg.match(/[+\-*/%]/) && !arg.includes('"') && !arg.includes("'")) {
            actualType = arg.includes('.') ? 'REAL' : 'INTEGER';
          }
        } else {
          const funcMatch = arg.match(/^(\w+)\(/);
          if (funcMatch) {
            const nestedFunc = funcMatch[1];
            if (BUILTIN_FUNCTIONS[nestedFunc]) {
              actualType = BUILTIN_FUNCTIONS[nestedFunc].returns;
            }
          }
        }
      }
      
      if (actualType && !expectedTypes.includes(actualType)) {
        if (expectedTypes.includes('STRING') && actualType === 'CHAR') {
          return;
        }
        if (expectedTypes.includes('REAL') && actualType === 'INTEGER') {
          return;
        }
        throw new Error(`Type mismatch in ${funcName} function on line ${line}: Parameter ${index + 1} expects ${expectedTypes.join(' or ')} but got ${actualType}`);
      }
    });
  }
    
  function processExpression(expr: string): string {
    let processed = expr;
    processed = processed.replace(/&/g, '+');
    processed = processed.replace(/\bAND\b/g, '&&');
    processed = processed.replace(/\bOR\b/g, '||');
    processed = processed.replace(/\bNOT\b/g, '!');
    
    const builtinFunctionsList = ['LEFT', 'RIGHT', 'MID', 'LENGTH', 'TO_UPPER', 'TO_LOWER',
                            'LCASE', 'UCASE', 'NUM_TO_STR', 'STR_TO_NUM', 'IS_NUM', 
                            'ASC', 'CHR', 'INT', 'RAND', 'DAY', 'MONTH', 'YEAR', 
                            'DAYINDEX', 'SETDATE', 'TODAY', 'EOF'];
    
    const hasBuiltinFunction = builtinFunctionsList.some(func => 
        new RegExp(`\\b${func}\\s*\\(`).test(processed)
    );
    
    if (hasBuiltinFunction) {
        return processed;
    }
    
    processed = processed.replace(/<>/g, '!==');

    if (processed.includes('DIV')) {
        processed = processed.replace(/\bDIV\b/g, '___DIV___');
    }
    processed = processed.replace(/\bMOD\b/g, '%');
    processed = processed.replace(/\*\*/g, '**');
    
    let tokens = processed.split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === '=') {
        tokens[i] = '===';
      }
    }
    processed = tokens.join(' ');
    
    processed = processed.replace(/\bTRUE\b/g, 'true');
    processed = processed.replace(/\bFALSE\b/g, 'false');
    
    if (processed.includes('___DIV___')) {
        processed = processed.replace(/([^___]+)___DIV___([^___]+)/g, 'Math.floor($1 / $2)');
    }
    return processed;
  }
  
  function processCaseValue(value: string, varType?: string): string {
    const trimmed = value.trim();
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return '"' + trimmed.slice(1, -1) + '"';
    }
    
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed;
    }
    
    if (trimmed === 'TRUE' || trimmed === 'FALSE') {
      return trimmed.toLowerCase();
    }
    
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return trimmed;
    }
    
    return trimmed;
  }
  
  function inferTypeFromValue(value: string): string {
    const trimmed = value.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return 'STRING';
    }
    
    if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length === 3) {
      return 'CHAR';
    }
    
    if (trimmed === 'TRUE' || trimmed === 'FALSE') {
      return 'BOOLEAN';
    }
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return 'DATE';
    }
    
    if (/^-?\d+\.\d+$/.test(trimmed)) {
      return 'REAL';
    }
    
    if (/^-?\d+$/.test(trimmed)) {
      return 'INTEGER';
    }
    
    return 'STRING';
  }
  
  function processConstantValue(value: string): string {
    const trimmed = value.trim();
    
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed;
    }
    
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return '"' + trimmed.slice(1, -1) + '"';
    }
    
    if (trimmed === 'TRUE') {
      return 'true';
    }
    if (trimmed === 'FALSE') {
      return 'false';
    }
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split('/');
      return `new Date(${year}, ${+month - 1}, ${day})`;
    }
    
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return trimmed;
    }
    
    return trimmed;
  }
  
  function validateLiteral(value: string, expectedType: string, line: number): string {
    const trimmed = value.trim();
    
    switch(expectedType) {
      case 'INTEGER':
        if (!/^-?\d+$/.test(trimmed)) {
          throw new Error(`Invalid INTEGER literal "${trimmed}" on line ${line}`);
        }
        return trimmed;
      case 'REAL':
        if (!/^-?\d+\.\d+$/.test(trimmed)) {
          throw new Error(`Invalid REAL literal "${trimmed}" on line ${line}. Must be in format: d.d (e.g., 4.7, 0.3, -4.0)`);
        }
        return trimmed;
      case 'CHAR':
        if (!/^'.'$/.test(trimmed)) {
          throw new Error(`Invalid CHAR literal "${trimmed}" on line ${line}. Must be single character in single quotes (e.g., 'x')`);
        }
        return '"' + trimmed.slice(1, -1) + '"';
      case 'BOOLEAN':
        if (trimmed !== 'TRUE' && trimmed !== 'FALSE') {
          throw new Error(`Invalid BOOLEAN literal "${trimmed}" on line ${line}. Must be TRUE or FALSE`);
        }
        return trimmed.toLowerCase();
      case 'DATE':
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
          throw new Error(`Invalid DATE literal "${trimmed}" on line ${line}. Must be in format dd/mm/yyyy`);
        }
        const [day, month, year] = trimmed.split('/');
        return `new Date(${year}, ${+month - 1}, ${day})`;
      case 'STRING':
        if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) {
          return trimmed;
        }
        return trimmed;
      default:
        return trimmed;
    }
  }
  
  function extractVariables(expr: string): string[] {
    const vars: string[] = [];
    let cleanedExpr = expr;
    cleanedExpr = cleanedExpr.replace(/"[^"]*"/g, '');
    cleanedExpr = cleanedExpr.replace(/'[^']*'/g, '');
    const matches = cleanedExpr.match(/\b[a-zA-Z_]\w*\b/g) || [];
    for (const match of matches) {
      if (!['TRUE', 'FALSE', 'true', 'false', 'null', 'undefined', 'AND', 'OR', 'NOT'].includes(match) && isNaN(+match)) {
        vars.push(match);
      }
    }
    return vars;
  }
  
  function checkVariables(expr: string, line: number): string {
    const vars = extractVariables(expr);
    const checks: string[] = [];
    for (const v of vars) {
      if (declaredVars.has(v) && !initializedVars.has(v)) {
        checks.push(`if (${v} === undefined) throw new Error('Variable "${v}" has no value (used on line ${line})');`);
      }
    }
    return checks.join('\n');
  }
  
  function generateInputConversion(variable: string, varType: string): string {
    let js = "";
    switch(varType) {
      case 'INTEGER':
        js += `{\n`;
        js += `  let _input = prompt("Enter INTEGER value for ${variable}:");\n`;
        js += `  if (!/^-?\\d+$/.test(_input.trim())) {\n`;
        js += `    throw new Error('Invalid INTEGER input for ${variable}');\n`;
        js += `  }\n`;
        js += `  ${variable} = parseInt(_input, 10);\n`;
        js += `}\n`;
        break;
      case 'REAL':
        js += `{\n`;
        js += `  let _input = prompt("Enter REAL value for ${variable} (format: d.d):");\n`;
        js += `  if (!/^-?\\d+\\.\\d+$/.test(_input.trim())) {\n`;
        js += `    throw new Error('Invalid REAL input for ${variable}. Must be in format: d.d (e.g., 4.7, 0.3, -4.0)');\n`;
        js += `  }\n`;
        js += `  ${variable} = parseFloat(_input);\n`;
        js += `}\n`;
        break;
      case 'BOOLEAN':
        js += `{\n`;
        js += `  let _input = prompt("Enter BOOLEAN value for ${variable} (TRUE/FALSE):").toUpperCase().trim();\n`;
        js += `  if (_input !== 'TRUE' && _input !== 'FALSE') {\n`;
        js += `    throw new Error('Invalid BOOLEAN input for ${variable}. Must be TRUE or FALSE');\n`;
        js += `  }\n`;
        js += `  ${variable} = _input === 'TRUE';\n`;
        js += `}\n`;
        break;
      case 'CHAR':
        js += `{\n`;
        js += `  let _input = prompt("Enter CHAR value for ${variable} (single character):");\n`;
        js += `  if (!_input || _input.length !== 1) {\n`;
        js += `    throw new Error('Invalid CHAR input for ${variable}. Must be exactly one character');\n`;
        js += `  }\n`;
        js += `  ${variable} = _input;\n`;
        js += `}\n`;
        break;
      case 'DATE':
        js += `{\n`;
        js += `  let _input = prompt("Enter DATE value for ${variable} (format: dd/mm/yyyy):");\n`;
        js += `  if (!/^\\d{2}\\/\\d{2}\\/\\d{4}$/.test(_input)) {\n`;
        js += `    throw new Error('Invalid DATE input for ${variable}. Must be in format dd/mm/yyyy');\n`;
        js += `  }\n`;
        js += `  let [_day, _month, _year] = _input.split('/');\n`;
        js += `  ${variable} = new Date(parseInt(_year), parseInt(_month) - 1, parseInt(_day));\n`;
        js += `  if (isNaN(${variable}.getTime())) {\n`;
        js += `    throw new Error('Invalid DATE input for ${variable}');\n`;
        js += `  }\n`;
        js += `}\n`;
        break;
      case 'STRING':
      default:
        js += `${variable} = prompt("Enter STRING value for ${variable}:");\n`;
        break;
    }
    return js;
  }
  
  function processAssignmentValue(value: string, targetType: string, line: number): string {
    const trimmed = value.trim();
    const functionCallMatch = trimmed.match(/^(\w+)\s*\(([^)]*)\)$/);
    if (functionCallMatch) {
      const [, funcName] = functionCallMatch;
      const builtinFunctionsForAssign: { [key: string]: string } = {
        'LEFT': 'STRING', 'RIGHT': 'STRING', 'MID': 'STRING',
        'LENGTH': 'INTEGER', 'TO_UPPER': 'STRING', 'TO_LOWER': 'STRING',
        'LCASE': 'CHAR', 'UCASE': 'CHAR',
        'NUM_TO_STR': 'STRING', 'STR_TO_NUM': 'REAL', 'IS_NUM': 'BOOLEAN',
        'ASC': 'INTEGER', 'CHR': 'CHAR', 'INT': 'INTEGER', 'RAND': 'REAL',
        'DAY': 'INTEGER', 'MONTH': 'INTEGER', 'YEAR': 'INTEGER',
        'DAYINDEX': 'INTEGER', 'SETDATE': 'DATE', 'TODAY': 'DATE',
        'EOF': 'BOOLEAN'
      };
      
      if (builtinFunctionsForAssign[funcName]) {
        const returnType = builtinFunctionsForAssign[funcName];
        if (targetType) {
          if (returnType === 'STRING' && targetType === 'CHAR') {
            return `(function() { 
              let result = ${trimmed}; 
              if (result.length > 1) throw new Error('Cannot assign STRING of length > 1 to CHAR');
              return result;
            })()`;
          } else if (returnType === 'REAL' && targetType === 'INTEGER') {
            return `Math.floor(${trimmed})`;
          } else if (returnType !== targetType) {
            throw new Error(`Type mismatch on line ${line}: Function ${funcName} returns ${returnType} but variable expects ${targetType}`);
          }
        }
        return trimmed;
      }
    }
    
    if (targetType) {
      if (targetType === 'CHAR') {
        if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
            (trimmed.startsWith("ꞌ") && trimmed.endsWith("ꞌ"))) {
          if (trimmed.length !== 3) {
            throw new Error(`CHAR assignment must be single character in single quotes on line ${line}`);
          }
          return '"' + trimmed.slice(1, -1) + '"';
        }
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          const stringContent = trimmed.slice(1, -1);
          if (stringContent.length > 1) {
            throw new Error(`Type mismatch on line ${line}: Cannot assign STRING of length > 1 to CHAR variable`);
          }
          return trimmed;
        }
        if (trimmed === 'TRUE' || trimmed === 'FALSE') {
          throw new Error(`Type mismatch on line ${line}: Cannot assign BOOLEAN value to CHAR variable`);
        }
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign numeric value to CHAR variable`);
        }
        return trimmed;
      }
      
      if (targetType === 'BOOLEAN') {
        if (trimmed === 'TRUE') {
          return 'true';
        }
        if (trimmed === 'FALSE') {
          return 'false';
        }
        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign CHAR value to BOOLEAN variable`);
        }
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign STRING value to BOOLEAN variable`);
        }
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign numeric value to BOOLEAN variable`);
        }
        return trimmed;
      }
      
      if (targetType === 'STRING') {
        if (trimmed.includes('&')) {
          const parts = trimmed.split('&').map(p => p.trim());
          for (const part of parts) {
            if (!(part.startsWith('"') && part.endsWith('"')) &&
                !(part.startsWith("'") && part.endsWith("'")) &&
                !varTypes.has(part)) {
              if (/^\d+(\.\d+)?$/.test(part)) {
                throw new Error(`Type mismatch on line ${line}: Cannot concatenate numeric value with string. Use NUM_TO_STR() to convert numbers to strings.`);
              }
              if (part === 'TRUE' || part === 'FALSE') {
                throw new Error(`Type mismatch on line ${line}: Cannot concatenate BOOLEAN value with string.`);
              }
            }
          }
          return trimmed.replace(/&/g, '+');
        }
        
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          return trimmed;
        }
        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
          return '"' + trimmed.slice(1, -1) + '"';
        }
        if (trimmed === 'TRUE' || trimmed === 'FALSE') {
          throw new Error(`Type mismatch on line ${line}: Cannot assign BOOLEAN value to STRING variable. Use "TRUE" or "FALSE" in quotes for string literals.`);
        }
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign numeric value to STRING variable. Use quotes for string literals.`);
        }
        return processExpression(trimmed);
      }
      
      if (targetType === 'INTEGER') {
        if (/^-?\d+$/.test(trimmed)) {
          return trimmed;
        }
        if (trimmed === 'TRUE' || trimmed === 'FALSE') {
          throw new Error(`Type mismatch on line ${line}: Cannot assign BOOLEAN value to INTEGER variable`);
        }
        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign CHAR value to INTEGER variable`);
        }
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign STRING value to INTEGER variable`);
        }
        if (/^-?\d+\.\d+$/.test(trimmed)) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign REAL value to INTEGER variable. Use whole numbers only.`);
        }
        return trimmed;
      }
      
      if (targetType === 'REAL') {
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          if (!/\./.test(trimmed)) {
            return trimmed + '.0';
          }
          return trimmed;
        }
        if (trimmed === 'TRUE' || trimmed === 'FALSE') {
          throw new Error(`Type mismatch on line ${line}: Cannot assign BOOLEAN value to REAL variable`);
        }
        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign CHAR value to REAL variable`);
        }
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign STRING value to REAL variable`);
        }
        return trimmed;
      }
      
      if (targetType === 'DATE') {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
          const [day, month, year] = trimmed.split('/');
          return `new Date(${year}, ${+month - 1}, ${day})`;
        }
        if (trimmed === 'TRUE' || trimmed === 'FALSE') {
          throw new Error(`Type mismatch on line ${line}: Cannot assign BOOLEAN value to DATE variable`);
        }
        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign CHAR value to DATE variable`);
        }
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign STRING value to DATE variable. Use format dd/mm/yyyy`);
        }
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign numeric value to DATE variable. Use format dd/mm/yyyy`);
        }
        return trimmed;
      }
    }
    return value;
  }
  
  function replaceParameterReferences(node: any, oldName: string, newName: string): void {
    if (!node) return;
    
    if (node.type === 'AssignmentStatement') {
      if (node.left === oldName) {
        node.left = newName;
      }
      if (node.right && typeof node.right === 'string') {
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        node.right = node.right.replace(regex, newName);
      }
    }
    
    if (node.type === 'OutputStatement' && node.value) {
      const regex = new RegExp(`\\b${oldName}\\b`, 'g');
      node.value = node.value.replace(regex, newName);
    }
    
    if (node.body && Array.isArray(node.body)) {
      node.body.forEach((child: any) => replaceParameterReferences(child, oldName, newName));
    }
    if (node.ifBody && Array.isArray(node.ifBody)) {
      node.ifBody.forEach((child: any) => replaceParameterReferences(child, oldName, newName));
    }
    if (node.elseBody && Array.isArray(node.elseBody)) {
      node.elseBody.forEach((child: any) => replaceParameterReferences(child, oldName, newName));
    }
  }
  
  function transpileNode(node: any): string {
    let js = "";
    
    switch (node.type) {
      case "ConstantStatement":
        constants.add(node.name);
        initializedVars.add(node.name);
        const inferredType = inferTypeFromValue(node.value);
        varTypes.set(node.name, inferredType);
        const processedConstValue = processConstantValue(node.value);
        js += `const ${node.name} = ${processedConstValue};\n`;
        break;
      case "TypeDefinitionStatement":
        recordTypes.set(node.typeName, node.fields);
        js += `// Record type ${node.typeName} defined\n`;
        break;
      case "DeclareStatement":
        if (recordTypes.has(node.datatype)) {
          declaredVars.add(node.name);
          varTypes.set(node.name, node.datatype);
          js += `let ${node.name} = {};\n`;
          initializedVars.add(node.name);
        } else {
          if (!VALID_DATATYPES.includes(node.datatype)) {
            throw new Error(`Invalid datatype "${node.datatype}" on line ${node.line}. Valid types are: ${VALID_DATATYPES.join(', ')}`);
          }
          declaredVars.add(node.name);
          varTypes.set(node.name, node.datatype);
          js += `let ${node.name};\n`;
        }
        break;
      case "AssignmentStatement":
        if (constants.has(node.left)) {
          throw new Error(`Cannot assign to constant "${node.left}" on line ${node.line}`);
        }
        if (!declaredVars.has(node.left) && !constants.has(node.left)) {
          throw new Error(`Variable "${node.left}" was not declared. Use DECLARE before assignment (line ${node.line})`);
        }
        if (declaredVars.has(node.left)) {
          initializedVars.add(node.left);
        }
        
        const rightSideCheck = checkVariables(node.right, node.line);
        if (rightSideCheck) {
          js += rightSideCheck + '\n';
        }
      
        const funcInAssignment = node.right.match(/(\w+)\s*\(([^)]*)\)/);
        if (funcInAssignment) {
          const [, funcName, argsString] = funcInAssignment;
          if (BUILTIN_FUNCTIONS[funcName]) {
            validateBuiltinFunctionCall(funcName, argsString, node.line);
          }
        }
        
        if (varTypes.has(node.left) && varTypes.has(node.right)) {
          const leftType = varTypes.get(node.left);
          const rightType = varTypes.get(node.right);
          if (recordTypes.has(leftType!) && leftType === rightType) {
            js += `${node.left} = {...${node.right}};\n`;
            break;
          }
        }
        
        if (arrays.has(node.left) && arrays.has(node.right)) {
          const leftArray = arrays.get(node.left)!;
          if (leftArray.dimensions.length === 1) {
            js += `${node.left} = [...${node.right}];\n`;
          } else if (leftArray.dimensions.length === 2) {
            js += `${node.left} = ${node.right}.map((row: any) => [...row]);\n`;
          } else {
            throw new Error(`Arrays with more than 2 dimensions not supported on line ${node.line}`);
          }
        } else {
          const assignVarType = varTypes.get(node.left)!;
          const processedValue = processAssignmentValue(node.right, assignVarType, node.line);
          js += `${node.left} = ${processedValue};\n`;
        }
        break;
      case "InputStatement":
        if (!declaredVars.has(node.variable)) {
          throw new Error(`Variable "${node.variable}" used in INPUT on line ${node.line} was not declared`);
        }
        initializedVars.add(node.variable);
        const varType = varTypes.get(node.variable)!;
        js += generateInputConversion(node.variable, varType);
        break;
      case "CallStatement":
        {
          const builtinFunctionsCall: { [key: string]: { params: number, returns: string } } = {
            'LEFT': { params: 2, returns: 'STRING' },
            'RIGHT': { params: 2, returns: 'STRING' },
            'MID': { params: 3, returns: 'STRING' },
            'LENGTH': { params: 1, returns: 'INTEGER' },
            'TO_UPPER': { params: 1, returns: 'STRING' },
            'TO_LOWER': { params: 1, returns: 'STRING' },
            'NUM_TO_STR': { params: 1, returns: 'STRING' },
            'STR_TO_NUM': { params: 1, returns: 'REAL' },
            'IS_NUM': { params: 1, returns: 'BOOLEAN' },
            'ASC': { params: 1, returns: 'INTEGER' },
            'CHR': { params: 1, returns: 'CHAR' },
            'INT': { params: 1, returns: 'INTEGER' },
            'RAND': { params: 1, returns: 'REAL' },
            'DAY': { params: 1, returns: 'INTEGER' },
            'MONTH': { params: 1, returns: 'INTEGER' },
            'YEAR': { params: 1, returns: 'INTEGER' },
            'DAYINDEX': { params: 1, returns: 'INTEGER' },
            'SETDATE': { params: 3, returns: 'DATE' },
            'LCASE': { params: 1, returns: 'CHAR' },
            'UCASE': { params: 1, returns: 'CHAR' },
            'TODAY': { params: 0, returns: 'DATE' }
          };
          
          if (builtinFunctionsCall[node.functionName]) {
            const funcDef = builtinFunctionsCall[node.functionName];
            const expectedParams = funcDef.params;
            const providedArgs = node.arguments ? node.arguments.length : 0;
            
            if (expectedParams !== providedArgs) {
              throw new Error(`Built-in function "${node.functionName}" expects ${expectedParams} parameter(s) but ${providedArgs} were provided (line ${node.line})`);
            }
            
            if (node.arguments && node.arguments.length > 0) {
              const paramTypes: { [key: string]: string[][] } = {
                'LEFT': [['STRING'], ['INTEGER']],
                'RIGHT': [['STRING'], ['INTEGER']],
                'MID': [['STRING'], ['INTEGER'], ['INTEGER']],
                'LENGTH': [['STRING', 'CHAR']],
                'TO_UPPER': [['STRING', 'CHAR']],
                'TO_LOWER': [['STRING', 'CHAR']],
                'NUM_TO_STR': [['INTEGER', 'REAL']],
                'STR_TO_NUM': [['STRING', 'CHAR']],
                'IS_NUM': [['STRING', 'CHAR']],
                'ASC': [['CHAR']],
                'CHR': [['INTEGER']],
                'INT': [['REAL']],
                'RAND': [['INTEGER']],
                'DAY': [['DATE']],
                'MONTH': [['DATE']],
                'YEAR': [['DATE']],
                'DAYINDEX': [['DATE']],
                'LCASE': [['CHAR']],
                'UCASE': [['CHAR']],
                'SETDATE': [['INTEGER'], ['INTEGER'], ['INTEGER']]
              };
              
              const expectedParamTypes = paramTypes[node.functionName];
              
              if (expectedParamTypes) {
                node.arguments.forEach((arg: string, index: number) => {
                  const expectedTypes = expectedParamTypes[index];
                  let actualType: string | null = null;
                  const trimmedArg = arg.trim();
                  if (trimmedArg.startsWith('"') && trimmedArg.endsWith('"')) {
                    actualType = 'STRING';
                  } else if (trimmedArg.startsWith("'") && trimmedArg.endsWith("'")) {
                    actualType = 'CHAR';
                  } else if (trimmedArg === 'TRUE' || trimmedArg === 'FALSE') {
                    actualType = 'BOOLEAN';
                  } else if (/^-?\d+$/.test(trimmedArg)) {
                    actualType = 'INTEGER';
                  } else if (/^-?\d+\.\d+$/.test(trimmedArg)) {
                    actualType = 'REAL';
                  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmedArg)) {
                    actualType = 'DATE';
                  } else {
                    const varTypeArg = varTypes.get(trimmedArg);
                    if (varTypeArg) {
                      actualType = varTypeArg;
                    }
                  }
                  
                  if (actualType && !expectedTypes.includes(actualType)) {
                    if (expectedTypes.includes('STRING') && actualType === 'CHAR') return;
                    if (expectedTypes.includes('REAL') && actualType === 'INTEGER') return;
                    throw new Error(`Type mismatch in ${node.functionName} call on line ${node.line}: Parameter ${index + 1} expects ${expectedTypes.join(' or ')} but got ${actualType}`);
                  }
                });
              }
            }
            
            const processedArgs = node.arguments ? node.arguments.map((arg: string) => processExpression(arg)) : [];
            js += `${node.functionName}(${processedArgs.join(', ')});\n`;
            break;
          }
          
          let procedureNode: any = null;
          let functionNode: any = null;
          
          for (const astNode of ast.body) {
            if (astNode.type === 'ProcedureDefinition' && astNode.name === node.functionName) {
              procedureNode = astNode;
              break;
            } else if (astNode.type === 'FunctionDefinition' && astNode.name === node.functionName) {
              functionNode = astNode;
              break;
            }
          }
          
          const callableNode = procedureNode || functionNode;
          
          if (callableNode) {
            const expectedParams = callableNode.parameters.length;
            const providedArgs = node.arguments ? node.arguments.length : 0;
            if (expectedParams !== providedArgs) {
              throw new Error(`Procedure/Function "${node.functionName}" expects ${expectedParams} parameter(s) but ${providedArgs} were provided (line ${node.line})`);
            }
            
            if (node.arguments && callableNode.parameters) {
              node.arguments.forEach((arg: string, index: number) => {
                const expectedParam = callableNode.parameters[index];
                const expectedType = expectedParam.datatype;
                let actualType: string | null = null;
                const trimmedArg = arg.trim();
                if (trimmedArg.startsWith('"') && trimmedArg.endsWith('"')) {
                  actualType = 'STRING';
                } else if (trimmedArg.startsWith("'") && trimmedArg.endsWith("'")) {
                  actualType = 'CHAR';
                } else if (trimmedArg === 'TRUE' || trimmedArg === 'FALSE') {
                  actualType = 'BOOLEAN';
                } else if (/^-?\d+$/.test(trimmedArg)) {
                  actualType = 'INTEGER';
                } else if (/^-?\d+\.\d+$/.test(trimmedArg)) {
                  actualType = 'REAL';
                } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmedArg)) {
                  actualType = 'DATE';
                } else {
                  const varTypeArg = varTypes.get(trimmedArg);
                  if (varTypeArg) {
                    actualType = varTypeArg;
                  }
                }
                
                if (actualType && actualType !== expectedType) {
                  if (expectedType === 'STRING' && actualType === 'CHAR') return;
                  if (expectedType === 'REAL' && actualType === 'INTEGER') return;
                  throw new Error(`Type mismatch in ${node.functionName} call on line ${node.line}: Parameter ${index + 1} (${expectedParam.name}) expects ${expectedType} but got ${actualType}`);
                }
              });
            }
          }
          
          if (procedureNode && node.arguments && node.arguments.length > 0) {
            let hasByRef = false;
            const processedArgs: string[] = [];
            const byRefMapping: { index: number; varName: string; isRef: boolean }[] = [];
            
            node.arguments.forEach((arg: string, index: number) => {
              const param = procedureNode.parameters[index];
              if (param && param.passingMethod === 'BYREF') {
                hasByRef = true;
                processedArgs.push(`_ref_${index}`);
                byRefMapping.push({ index, varName: arg, isRef: true });
                js += `let _ref_${index} = {value: ${processExpression(arg)}};\n`;
              } else {
                processedArgs.push(processExpression(arg));
                byRefMapping.push({ index, varName: arg, isRef: false });
              }
            });
            
            js += `${node.functionName}(${processedArgs.join(', ')});\n`;
            
            byRefMapping.forEach(mapping => {
              if (mapping.isRef) {
                js += `${mapping.varName} = _ref_${mapping.index}.value;\n`;
              }
            });
          } else if (node.arguments && node.arguments.length > 0) {
            const processedArgs = node.arguments.map((arg: string) => processExpression(arg));
            js += `${node.functionName}(${processedArgs.join(', ')});\n`;
          } else {
            js += `${node.functionName}();\n`;
          }
        }
        break;
      case "CaseStatement":
        const caseVarCheck = checkVariables(node.variable, node.line);
        if (caseVarCheck) {
          js += caseVarCheck + '\n';
        }
        
        const caseVarType = varTypes.get(node.variable);
        let firstClause = true;
        for (const clause of node.clauses) {
          if (firstClause) {
            js += `if (`;
            firstClause = false;
          } else {
            js += `} else if (`;
          }
          if (clause.condition.type === 'single') {
            const processedVal = processCaseValue(clause.condition.value, caseVarType);
            js += `${node.variable} === ${processedVal}`;
          } else if (clause.condition.type === 'multiple') {
            const conditions = clause.condition.values.map((val: string) => {
              const processedVal = processCaseValue(val, caseVarType);
              return `${node.variable} === ${processedVal}`;
            });
            js += `(${conditions.join(' || ')})`;
          } else if (clause.condition.type === 'range') {
            const fromVal = processCaseValue(clause.condition.from, caseVarType);
            const toVal = processCaseValue(clause.condition.to, caseVarType);
            if (caseVarType === 'CHAR' || 
                (clause.condition.from.startsWith("'") && clause.condition.from.endsWith("'"))) {
              js += `(${node.variable}.charCodeAt(0) >= ${fromVal}.charCodeAt(0) && `;
              js += `${node.variable}.charCodeAt(0) <= ${toVal}.charCodeAt(0))`;
            } else {
              js += `(${node.variable} >= ${fromVal} && ${node.variable} <= ${toVal})`;
            }
          }
          
          js += `) {\n`;
          for (const stmt of clause.body) {
            js += transpileNode(stmt);
          }
        }
        
        if (node.otherwiseClause) {
          if (node.clauses.length > 0) {
            js += `} else {\n`;
          } else {
            js += `{\n`;
          }
          
          for (const stmt of node.otherwiseClause.body) {
            js += transpileNode(stmt);
          }
          js += `}\n`;
        } else if (node.clauses.length > 0) {
          js += `}\n`;
        }
        break;
      case "OutputStatement":
        const outputCheck = checkVariables(node.value, node.line);
      
        if (outputCheck) {
          js += outputCheck + '\n';
        }
      
        let outputExpression = node.value;
      
        const functionCallMatchOutput = outputExpression.match(/(\w+)\s*\(([^)]*)\)/);
        if (functionCallMatchOutput) {
          const [fullMatch, funcName, argsString] = functionCallMatchOutput;
        
          if (BUILTIN_FUNCTIONS[funcName]) {
            const funcDef = BUILTIN_FUNCTIONS[funcName];
            const args = argsString.trim() === '' ? [] : argsString.split(',').map((a: string) => a.trim());
            const providedArgs = args.length;
            const expectedParams = funcDef.params.length;
          
            if (expectedParams !== providedArgs) {
              throw new Error(`Built-in function "${funcName}" expects ${expectedParams} parameter(s) but ${providedArgs} were provided (line ${node.line})`);
            }
          
            args.forEach((arg: string, index: number) => {
              const expectedTypes = funcDef.params[index];
              let actualType: string | null = null;
              if (arg.startsWith('"') && arg.endsWith('"')) {
                actualType = 'STRING';
              } else if (arg.startsWith("'") && arg.endsWith("'")) {
                actualType = 'CHAR';
              } else if (arg === 'TRUE' || arg === 'FALSE') {
                actualType = 'BOOLEAN';
              } else if (/^-?\d+$/.test(arg)) {
                actualType = 'INTEGER';
              } else if (/^-?\d+\.\d+$/.test(arg)) {
                actualType = 'REAL';
              } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(arg)) {
                actualType = 'DATE';
              } else {
                const varTypeArg = varTypes.get(arg);
                if (varTypeArg) actualType = varTypeArg;
              }
              
              if (actualType && !expectedTypes.includes(actualType)) {
                if (expectedTypes.includes('STRING') && actualType === 'CHAR') return;
                if (expectedTypes.includes('REAL') && actualType === 'INTEGER') return;
                throw new Error(`Type mismatch in ${funcName} function on line ${node.line}: Parameter ${index + 1} expects ${expectedTypes.join(' or ')} but got ${actualType}`);
              }
            });
          
            if (funcDef.returns === 'BOOLEAN') {
              js += `console.log(${outputExpression} ? "TRUE" : "FALSE");\n`;
              break;
            } else if (funcDef.returns === 'DATE') {
              js += `console.log((${outputExpression}).toLocaleDateString('en-GB'));\n`;
              break;
            } else {
              js += `console.log(${outputExpression});\n`;
              break;
            }
          }
        }
      
        const arrayAccessMatch = outputExpression.match(/^(\w+)\[([^\]]+)\]$/);
        if (arrayAccessMatch) {
          const [, arrayName, indices] = arrayAccessMatch;
        
          if (arrays.has(arrayName)) {
            const arrayInfo = arrays.get(arrayName)!;
            const indexList = indices.split(',').map((i: string) => i.trim());
          
            const processedIndices = indexList.map((index: string, i: number) => {
              const dim = arrayInfo.dimensions[i];
              if (/^\d+$/.test(index)) {
                return String(parseInt(index) - dim.lower);
              }
              return `(${index}) - ${dim.lower}`;
            });
          
            if (arrayInfo.dimensions.length === 1) {
              outputExpression = `${arrayName}[${processedIndices[0]}]`;
            } else if (arrayInfo.dimensions.length === 2) {
              outputExpression = `${arrayName}[${processedIndices[0]}][${processedIndices[1]}]`;
            }
          
            if (arrayInfo.elementType === 'BOOLEAN') {
              js += `console.log(${outputExpression} ? "TRUE" : "FALSE");\n`;
            } else if (arrayInfo.elementType === 'DATE') {
              js += `console.log(${outputExpression} instanceof Date ? ${outputExpression}.toLocaleDateString('en-GB') : ${outputExpression});\n`;
            } else {
              js += `console.log(${outputExpression});\n`;
            }
          } else {
            js += `console.log(${outputExpression});\n`;
          }
        } else if (!outputExpression.includes(',')) {
          const trimmedValue = outputExpression.trim();
          const hasConcatenation = trimmedValue.includes('&');
          const isStringLiteral = trimmedValue.startsWith('"') && trimmedValue.endsWith('"') && !hasConcatenation;
          const isCharLiteral = trimmedValue.startsWith("'") && trimmedValue.endsWith("'") && !hasConcatenation;
          const hasOperators = !isStringLiteral && !isCharLiteral && (/[<>=]|AND|OR|NOT|<>|DIV|MOD|\*\*/.test(outputExpression) || hasConcatenation);
        
          if (hasOperators) {
            outputExpression = processExpression(outputExpression);
            js += `(function() {\n`;
            js += `  let _result = ${outputExpression};\n`;
            js += `  if (typeof _result === 'boolean') {\n`;
            js += `    console.log(_result ? "TRUE" : "FALSE");\n`;
            js += `  } else {\n`;
            js += `    console.log(String(_result));\n`;
            js += `  }\n`;
            js += `})();\n`;
          } else {
            const trimmedValue2 = outputExpression.trim();
          
            if (trimmedValue2.startsWith("'") && trimmedValue2.endsWith("'")) {
              js += `console.log("${trimmedValue2.slice(1, -1)}");\n`;
            } else if (trimmedValue2 === 'TRUE' || trimmedValue2 === 'FALSE') {
              js += `console.log("${trimmedValue2}");\n`;
            } else if (varTypes.get(trimmedValue2) === 'BOOLEAN') {
              js += `console.log(${trimmedValue2} ? "TRUE" : "FALSE");\n`;
            } else if (!trimmedValue2.startsWith('"') && !trimmedValue2.endsWith('"') && varTypes.get(trimmedValue2) === 'DATE') {
              js += `console.log(${trimmedValue2} instanceof Date ? ${trimmedValue2}.toLocaleDateString('en-GB') : ${trimmedValue2});\n`;
            } else {
              js += `console.log(${outputExpression});\n`;
            }
          }
        } else {
          const outputParts = outputExpression.split(',').map((part: string) => part.trim());
          const concatenated = outputParts.map((part: string) => {
            const trimmed = part.trim();
            if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
              return '"' + trimmed.slice(1, -1) + '"';
            }
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
              return trimmed;
            }
            if (trimmed === 'TRUE' || trimmed === 'FALSE') {
              return '"' + trimmed + '"';
            }
            const varName = trimmed;
            if (varTypes.get(varName) === 'DATE') {
              return `(${varName} instanceof Date ? ${varName}.toLocaleDateString('en-GB') : String(${varName}))`;
            }
            return `String(${trimmed})`;
          }).join(' + ');
          js += `console.log(${concatenated});\n`;
        }
        break;
      case "ForLoopStatement":
        {
          const fromCheck = checkVariables(String(node.from), node.line);
          const toCheck = checkVariables(String(node.to), node.line);
          if (fromCheck) js += fromCheck + '\n';
          if (toCheck) js += toCheck + '\n';
          js += `for (let ${node.variable} = ${node.from}; ${node.variable} <= ${node.to}; ${node.variable}++) {\n`;
          const wasInitialized = initializedVars.has(node.variable);
          initializedVars.add(node.variable);
          for (const child of node.body) {
            js += transpileNode(child);
          }
          if (!wasInitialized) {
            initializedVars.delete(node.variable);
          }
          js += `}\n`;
        }
        break;
      case "WhileLoopStatement":
        {
          const whileConditionCheck = checkVariables(node.condition, node.line);
          if (whileConditionCheck) {
            js += whileConditionCheck + '\n';
          }
          let whileProcessedCondition = processExpression(node.condition);
          js += `while (${whileProcessedCondition}) {\n`;
          for (const child of node.body) {
            js += transpileNode(child);
          }
          js += `}\n`;
        }
        break;
      case "RepeatLoopStatement":
        {
          js += `do {\n`;
          for (const child of node.body) {
            js += transpileNode(child);
          }
          const repeatConditionCheck = checkVariables(node.condition, node.line);
          if (repeatConditionCheck) {
            js += repeatConditionCheck + '\n';
          }
          let repeatProcessedCondition = processExpression(node.condition);
          js += `} while (!(${repeatProcessedCondition}));\n`;
        }
        break;
      case "OpenFileStatement":
        {
          let openFileName = node.fileName;
          if (!openFileName.startsWith('"')) {
            openFileName = processExpression(openFileName);
          }
          js += `OPENFILE(${openFileName}, '${node.mode}');\n`;
        }
        break;
      case "CloseFileStatement":
        {
          let closeFileName = node.fileName;
          if (!closeFileName.startsWith('"')) {
            closeFileName = processExpression(closeFileName);
          }
          js += `CLOSEFILE(${closeFileName});\n`;
        }
        break;
      case "ReadFileStatement":
        {
          if (!declaredVars.has(node.variable)) {
            throw new Error(`Variable "${node.variable}" was not declared. Use DECLARE before READFILE (line ${node.line})`);
          }
          initializedVars.add(node.variable);
          let readFileName = node.fileName;
          if (!readFileName.startsWith('"')) {
            readFileName = processExpression(readFileName);
          }
          js += `${node.variable} = READFILE(${readFileName});\n`;
        }
        break;
      case "WriteFileStatement":
        {
          let writeFileName = node.fileName;
          if (!writeFileName.startsWith('"')) {
            writeFileName = processExpression(writeFileName);
          }
          const writeData = processExpression(node.data);
          js += `WRITEFILE(${writeFileName}, ${writeData});\n`;
        }
        break;
      case "DeclareArrayStatement":
        {
          if (recordTypes.has(node.elementType)) {
            arrays.set(node.name, {
              dimensions: node.dimensions,
              elementType: node.elementType,
              isRecordType: true
            });
            declaredVars.add(node.name);
            initializedVars.add(node.name);
            const sizes: number[] = [];
            for (const dim of node.dimensions) {
              const size = dim.upper - dim.lower + 1;
              sizes.push(size);
            }
            if (node.dimensions.length === 1) {
              js += `let ${node.name} = Array(${sizes[0]}).fill(null).map(() => ({}));\n`;
            } else {
              throw new Error(`Multi-dimensional arrays of records not supported on line ${node.line}`);
            }
          } else {
            if (!VALID_DATATYPES.includes(node.elementType)) {
              throw new Error(`Invalid array element type "${node.elementType}" on line ${node.line}. Valid types are: ${VALID_DATATYPES.join(', ')}`);
            }
            arrays.set(node.name, {
              dimensions: node.dimensions,
              elementType: node.elementType,
              isRecordType: false
            });
            declaredVars.add(node.name);
            initializedVars.add(node.name);
            let totalSize = 1;
            const sizes: number[] = [];
            for (const dim of node.dimensions) {
              const size = dim.upper - dim.lower + 1;
              sizes.push(size);
              totalSize *= size;
            }
            if (node.dimensions.length === 1) {
              js += `let ${node.name} = new Array(${sizes[0]});\n`;
            } else if (node.dimensions.length === 2) {
              js += `let ${node.name} = Array(${sizes[0]}).fill(null).map(() => Array(${sizes[1]}));\n`;
            } else {
              throw new Error(`Arrays with more than 2 dimensions not supported on line ${node.line}`);
            }
          }
        }
        break;
      case "AssignArrayRecordFieldStatement":
        {
          if (!arrays.has(node.arrayName)) {
            throw new Error(`Array "${node.arrayName}" was not declared on line ${node.line}`);
          }
          const arrayRecordInfo = arrays.get(node.arrayName)!;
          if (!arrayRecordInfo.isRecordType) {
            throw new Error(`"${node.arrayName}" is not an array of records on line ${node.line}`);
          }
          const arrayRecordType = arrayRecordInfo.elementType;
          const arrayRecordFields = recordTypes.get(arrayRecordType);
          const arrayField = arrayRecordFields.find((f: any) => f.name === node.fieldName);
          
          if (!arrayField) {
            throw new Error(`Field "${node.fieldName}" does not exist in record type "${arrayRecordType}" on line ${node.line}`);
          }
          
          const dim = arrayRecordInfo.dimensions[0];
          let processedIndex: string;
          if (/^\d+$/.test(node.index)) {
            processedIndex = String(parseInt(node.index) - dim.lower);
          } else {
            processedIndex = `(${node.index}) - ${dim.lower}`;
          }
          
          const processedFieldValue = processAssignmentValue(node.right, arrayField.datatype, node.line);
          
          js += `${node.arrayName}[${processedIndex}].${node.fieldName} = ${processedFieldValue};\n`;
        }
        break;
      case "AssignRecordFieldStatement":
        {
          if (!declaredVars.has(node.recordName)) {
            throw new Error(`Record "${node.recordName}" was not declared on line ${node.line}`);
          }
          const recordType = varTypes.get(node.recordName);
          if (!recordTypes.has(recordType!)) {
            throw new Error(`"${node.recordName}" is not a record type on line ${node.line}`);
          }
          const recordFields = recordTypes.get(recordType!);
          const field = recordFields.find((f: any) => f.name === node.fieldName);
          
          if (!field) {
            throw new Error(`Field "${node.fieldName}" does not exist in record type "${recordType}" on line ${node.line}`);
          }
          
          const processedRecordValue = processAssignmentValue(node.right, field.datatype, node.line);
          
          js += `${node.recordName}.${node.fieldName} = ${processedRecordValue};\n`;
        }
        break;
      case "AssignArrayElementStatement":
        {
          if (!arrays.has(node.arrayName)) {
            throw new Error(`Array "${node.arrayName}" was not declared. Use DECLARE before assignment (line ${node.line})`);
          }
          
          const arrayInfo = arrays.get(node.arrayName)!;
          if (node.indices.length !== arrayInfo.dimensions.length) {
            throw new Error(`Array "${node.arrayName}" expects ${arrayInfo.dimensions.length} indices but got ${node.indices.length} on line ${node.line}`);
          }
          
          const processedIndices = node.indices.map((index: string, i: number) => {
            const dim = arrayInfo.dimensions[i];
            if (/^\d+$/.test(index)) {
              const indexNum = parseInt(index);
              return String(indexNum - dim.lower);
            }
            return `(${index}) - ${dim.lower}`;
          });
          
          const rightCheck = checkVariables(node.right, node.line);
          if (rightCheck) {
            js += rightCheck + '\n';
          }
          
          const processedArrayValue = processAssignmentValue(node.right, arrayInfo.elementType, node.line);
          
          if (arrayInfo.dimensions.length === 1) {
            js += `${node.arrayName}[${processedIndices[0]}] = ${processedArrayValue};\n`;
          } else if (arrayInfo.dimensions.length === 2) {
            js += `${node.arrayName}[${processedIndices[0]}][${processedIndices[1]}] = ${processedArrayValue};\n`;
          }
        }
        break;
      case "ProcedureDefinition":
        {
          js += `function ${node.name}(`;
          const procParams = node.parameters.map((p: any) => p.name).join(', ');
          js += procParams;
          js += `) {\n`;
          for (const param of node.parameters) {
            if (param.passingMethod === 'BYREF') {
              js += `  let _${param.name} = ${param.name}.value;\n`;
              declaredVars.add(`_${param.name}`);
              initializedVars.add(`_${param.name}`);
              varTypes.set(`_${param.name}`, param.datatype);
            } else {
              declaredVars.add(param.name);
              initializedVars.add(param.name);
              varTypes.set(param.name, param.datatype);
            }
          }
          
          const savedDeclaredVars = new Set(declaredVars);
          const savedInitializedVars = new Set(initializedVars);
          
          for (const stmt of node.body) {
            let stmtCopy = JSON.parse(JSON.stringify(stmt));
            for (const param of node.parameters) {
              if (param.passingMethod === 'BYREF') {
                replaceParameterReferences(stmtCopy, param.name, `_${param.name}`);
              }
            }
            js += transpileNode(stmtCopy);
          }
          
          for (const param of node.parameters) {
            if (param.passingMethod === 'BYREF') {
              js += `  ${param.name}.value = _${param.name};\n`;
            }
          }
          
          js += `}\n\n`;
          
          declaredVars.clear();
          initializedVars.clear();
          savedDeclaredVars.forEach(v => declaredVars.add(v));
          savedInitializedVars.forEach(v => initializedVars.add(v));
        }
        break;
      case "FunctionDefinition":
        {
          js += `function ${node.name}(`;
          const funcParams = node.parameters.map((p: any) => p.name).join(', ');
          js += funcParams;
          js += `) {\n`;
          varTypes.set(`${node.name}_RETURN`, node.returnType);
          for (const param of node.parameters) {
            declaredVars.add(param.name);
            initializedVars.add(param.name);
            varTypes.set(param.name, param.datatype);
          }
          for (const stmt of node.body) {
            js += transpileNode(stmt);
          }
          js += `}\n\n`;
        }
        break;
      case "ReturnStatement":
        {
          const returnCheck = checkVariables(node.value, node.line);
          if (returnCheck) {
            js += returnCheck + '\n';
          }
          const processedReturn = processExpression(node.value);
          js += `return ${processedReturn};\n`;
        }
        break;
      case "IfStatement":
        {
          const conditionCheck = checkVariables(node.condition, node.line);
          if (conditionCheck) {
            js += conditionCheck + '\n';
          }
          let processedCondition = processExpression(node.condition);
          js += `if (${processedCondition}) {\n`;
          for (const child of node.ifBody) {
            js += transpileNode(child);
          }
          js += `}\n`;
          if (node.elseBody.length > 0) {
            js += `else {\n`;
            for (const child of node.elseBody) {
              js += transpileNode(child);
            }
            js += `}\n`;
          }
        }
        break;
      default:
        throw new Error(`Unknown AST node type: ${node.type}`);
    }
    return js;
  }
  
  let js = builtInImplementations + fileHandlingImplementation;
  
  for (const node of ast.body) {
    js += transpileNode(node);
  }

  console.log("📝 Generated JavaScript:");
  console.log(js);

  js += `
// Expose files for the UI
if (typeof window !== 'undefined') {
  const modifiedFiles = new Map<string, FileEntry>();
  __files.forEach((value, key) => {
    if (value.modified && value.content && value.content.length > 0) {
      modifiedFiles.set(key, value);
    }
  });
  window.__virtualFiles = modifiedFiles;
}
`;

  return js;
}
