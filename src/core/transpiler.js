export function transpile(ast) {
  // Track declared variables and whether they've been initialized
  const declaredVars = new Set();
  const initializedVars = new Set();
  const varTypes = new Map(); // Track variable datatypes
  const constants = new Set(); // Track constant names
  const arrays = new Map(); // Track array info
  const recordTypes = new Map(); // Track user-defined record types
  
  // Valid datatypes according to specification
  const VALID_DATATYPES = ['INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN', 'DATE'];

  const BUILTIN_FUNCTIONS = {
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

  // JavaScript implementations of built-in functions
  const builtInImplementations = `// Built-in functions
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

// Add file handling implementation
const fileHandlingImplementation = `
// File handling implementation
// const __files = new Map();

function OPENFILE(fileName, mode) {
  // Check if file already exists (either uploaded or virtual)
  if (!__files.has(fileName)) {
    // Create new file entry
    __files.set(fileName, { 
      mode: mode, 
      content: [], 
      position: 0,
      modified: false 
    });
  }
  
  const file = __files.get(fileName);
  
  if (mode === 'WRITE') {
    // WRITE mode clears the file
    file.content = [];
    file.position = 0;
    file.modified = true;
  } else if (mode === 'APPEND') {
    // APPEND mode positions at end
    file.position = file.content.length;
    file.modified = true;
  } else if (mode === 'READ') {
    // READ mode positions at beginning
    file.position = 0;
  }
  file.mode = mode;
}

function CLOSEFILE(fileName) {
  // In browser environment, we just clear the mode
  if (__files.has(fileName)) {
    const file = __files.get(fileName);
    file.mode = null;
  }
}

function READFILE(fileName) {
  if (!__files.has(fileName)) {
    throw new Error('File ' + fileName + ' not opened');
  }
  const file = __files.get(fileName);
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
  const file = __files.get(fileName);
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
  const file = __files.get(fileName);
  return file.position >= file.content.length;
}


`;



// Add this helper function near the top of transpile function, after BUILTIN_FUNCTIONS definition
function validateBuiltinFunctionCall(funcName, args, line) {
  const funcDef = BUILTIN_FUNCTIONS[funcName];
  if (!funcDef) return; // Not a built-in function
  
  // Parse arguments
  const argList = args.trim() === '' ? [] : args.split(',').map(a => a.trim());
  
  // Check parameter count
  const expectedCount = funcDef.params.length;
  const providedCount = argList.length;
  
  if (expectedCount !== providedCount) {
    throw new Error(`Built-in function "${funcName}" expects ${expectedCount} parameter(s) but ${providedCount} were provided (line ${line})`);
  }
  
  // Check parameter types
  argList.forEach((arg, index) => {
    const expectedTypes = funcDef.params[index];
    let actualType = null;
    
    // Determine actual type of argument
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
      // It's a variable or expression - check variable types
      const varType = varTypes.get(arg);
      if (varType) {
        actualType = varType;
      } else if (arg.includes('+') || arg.includes('-') || arg.includes('*') || arg.includes('/')) {
        // It's an expression - try to infer type
        if (arg.match(/[+\-*/%]/) && !arg.includes('"') && !arg.includes("'")) {
          // Numeric expression
          actualType = arg.includes('.') ? 'REAL' : 'INTEGER';
        }
      } else {
        // Check if it's a function call result
        const funcMatch = arg.match(/^(\w+)\(/);
        if (funcMatch) {
          const nestedFunc = funcMatch[1];
          if (BUILTIN_FUNCTIONS[nestedFunc]) {
            actualType = BUILTIN_FUNCTIONS[nestedFunc].returns;
          }
        }
      }
    }
    
    // Validate type compatibility
    if (actualType && !expectedTypes.includes(actualType)) {
      // Special cases for type compatibility
      if (expectedTypes.includes('STRING') && actualType === 'CHAR') {
        return; // CHAR can be used where STRING is expected
      }
      if (expectedTypes.includes('REAL') && actualType === 'INTEGER') {
        return; // INTEGER can be used where REAL is expected
      }
      
      throw new Error(`Type mismatch in ${funcName} function on line ${line}: Parameter ${index + 1} expects ${expectedTypes.join(' or ')} but got ${actualType}`);
    }
  });
}
  
  // Helper function to process expressions with operators
function processExpression(expr) {
    let processed = expr;

    // Handle string concatenation operator (&)
    // Replace & with + for JavaScript string concatenation
    processed = processed.replace(/&/g, '+');
    
    // Handle logical operators BEFORE checking for built-in functions
    processed = processed.replace(/\bAND\b/g, '&&');
    processed = processed.replace(/\bOR\b/g, '||');
    processed = processed.replace(/\bNOT\b/g, '!');
    
    // Check for built-in function calls and preserve them
    const builtinFunctions = ['LEFT', 'RIGHT', 'MID', 'LENGTH', 'TO_UPPER', 'TO_LOWER',
                            'LCASE', 'UCASE', 'NUM_TO_STR', 'STR_TO_NUM', 'IS_NUM', 
                            'ASC', 'CHR', 'INT', 'RAND', 'DAY', 'MONTH', 'YEAR', 
                            'DAYINDEX', 'SETDATE', 'TODAY', 'EOF'];
    
    // Check if expression contains any built-in function
    const hasBuiltinFunction = builtinFunctions.some(func => 
        new RegExp(`\\b${func}\\s*\\(`).test(processed)
    );
    
    // If it contains a built-in function, return as-is to preserve function calls
    if (hasBuiltinFunction) {
        return processed;
    }
    
    // Handle inequality operator first (<> to !==)
    processed = processed.replace(/<>/g, '!==');

    if (processed.includes('DIV')) {
        processed = processed.replace(/\bDIV\b/g, '___DIV___');
    }
    // Handle MOD operator (modulo)
    processed = processed.replace(/\bMOD\b/g, '%');
  
    // Handle exponentiation operator
    processed = processed.replace(/\*\*/g, '**');
    
    // Handle equality operator (= to ===)
    // Split by spaces and process each token
    let tokens = processed.split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === '=') {
        tokens[i] = '===';
      }
    }
    processed = tokens.join(' ');
    
    // Handle boolean literals in expressions - convert to JavaScript booleans
    processed = processed.replace(/\bTRUE\b/g, 'true');
    processed = processed.replace(/\bFALSE\b/g, 'false');
    
    // Now handle DIV - wrap the division in Math.floor
    if (processed.includes('___DIV___')) {
        // Simple case: a DIV b becomes Math.floor(a / b)
        processed = processed.replace(/([^___]+)___DIV___([^___]+)/g, 'Math.floor($1 / $2)');
    }
    return processed;
}

  // Helper function to process case value for comparison
function processCaseValue(value, varType) {
  const trimmed = value.trim();
  
  // Handle CHAR literals (single quotes)
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return '"' + trimmed.slice(1, -1) + '"';
  }
  
  // Handle STRING literals (double quotes)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed;
  }
  
  // Handle BOOLEAN literals
  if (trimmed === 'TRUE' || trimmed === 'FALSE') {
    return trimmed.toLowerCase();
  }
  
  // Handle numeric values
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed;
  }
  
  // Otherwise it's a variable or expression
  return trimmed;
}
  
  // Helper function to infer type from constant value
  function inferTypeFromValue(value) {
    const trimmed = value.trim();
    
    // Check for string (double quotes)
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return 'STRING';
    }
    
    // Check for char (single quotes)
    if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length === 3) {
      return 'CHAR';
    }
    
    // Check for boolean
    if (trimmed === 'TRUE' || trimmed === 'FALSE') {
      return 'BOOLEAN';
    }
    
    // Check for date
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return 'DATE';
    }
    
    // Check for real (has decimal point)
    if (/^-?\d+\.\d+$/.test(trimmed)) {
      return 'REAL';
    }
    
    // Check for integer
    if (/^-?\d+$/.test(trimmed)) {
      return 'INTEGER';
    }
    
    return 'STRING'; // Default to string if uncertain
  }
  
  // Helper function to process constant values
  function processConstantValue(value) {
    const trimmed = value.trim();
    
    // String literal (double quotes) - keep as is
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed;
    }
    
    // Char literal (single quotes) - convert to double quotes
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return '"' + trimmed.slice(1, -1) + '"';
    }
    
    // Boolean literals - use JavaScript booleans
    if (trimmed === 'TRUE') {
      return 'true';
    }
    if (trimmed === 'FALSE') {
      return 'false';
    }
    
    // Date literal
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split('/');
      return `new Date(${year}, ${month - 1}, ${day})`;
    }
    
    // Numeric literals (integer or real) - keep as is
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return trimmed;
    }
    
    return trimmed;
  }
  
  // Helper function to validate and convert literals based on type
  function validateLiteral(value, expectedType, line) {
    const trimmed = value.trim();
    
    switch(expectedType) {
      case 'INTEGER':
        // Check if it's a valid integer (including negative)
        if (!/^-?\d+$/.test(trimmed)) {
          throw new Error(`Invalid INTEGER literal "${trimmed}" on line ${line}`);
        }
        return trimmed;
        
      case 'REAL':
        // Must have at least one digit on either side of decimal point
        if (!/^-?\d+\.\d+$/.test(trimmed)) {
          throw new Error(`Invalid REAL literal "${trimmed}" on line ${line}. Must be in format: d.d (e.g., 4.7, 0.3, -4.0)`);
        }
        return trimmed;
        
      case 'CHAR':
        // Single character delimited by single quotes
        if (!/^'.'$/.test(trimmed)) {
          throw new Error(`Invalid CHAR literal "${trimmed}" on line ${line}. Must be single character in single quotes (e.g., 'x')`);
        }
        // Convert single quotes to double quotes for JavaScript
        return '"' + trimmed.slice(1, -1) + '"';
        
      case 'BOOLEAN':
        if (trimmed !== 'TRUE' && trimmed !== 'FALSE') {
          throw new Error(`Invalid BOOLEAN literal "${trimmed}" on line ${line}. Must be TRUE or FALSE`);
        }
        return trimmed.toLowerCase();  // Convert to JavaScript boolean
        
      case 'DATE':
        // Check for dd/mm/yyyy format
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
          throw new Error(`Invalid DATE literal "${trimmed}" on line ${line}. Must be in format dd/mm/yyyy`);
        }
        // Convert to JavaScript Date
        const [day, month, year] = trimmed.split('/');
        return `new Date(${year}, ${month - 1}, ${day})`;
        
      case 'STRING':
        // Should be delimited by double quotes
        if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) {
          // If it's not a string literal, it might be a variable
          return trimmed;
        }
        return trimmed;
        
      default:
        return trimmed;
    }
  }
  
  // Helper function to extract variables from expressions
  function extractVariables(expr) {
    const vars = [];
    
    // First, remove all string literals from the expression
    let cleanedExpr = expr;
    
    // Remove double-quoted strings
    cleanedExpr = cleanedExpr.replace(/"[^"]*"/g, '');
    
    // Remove single-quoted strings (for CHAR literals)
    cleanedExpr = cleanedExpr.replace(/'[^']*'/g, '');
    
    // Now find potential variable names in the cleaned expression
    const matches = cleanedExpr.match(/\b[a-zA-Z_]\w*\b/g) || [];
    
    for (const match of matches) {
      // Filter out keywords and boolean literals
      if (!['TRUE', 'FALSE', 'true', 'false', 'null', 'undefined', 'AND', 'OR', 'NOT'].includes(match) && 
          isNaN(match)) {
        vars.push(match);
      }
    }
    
    return vars;
  }
  
  // Helper function to check if variables in an expression are initialized
  function checkVariables(expr, line) {
    const vars = extractVariables(expr);
    const checks = [];
    for (const v of vars) {
      // Check if it's a declared variable (not a constant) that's uninitialized
      if (declaredVars.has(v) && !initializedVars.has(v)) {
        checks.push(`if (${v} === undefined) throw new Error('Variable "${v}" has no value (used on line ${line})');`);
      }
      // Constants are always initialized, so no check needed
    }
    return checks.join('\n');
  }
  
  // Helper function to generate type conversion code for INPUT
  function generateInputConversion(variable, varType) {
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
        js += `  ${variable} = _input === 'TRUE';\n`;  // Convert to JavaScript boolean
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
  
  // Helper function to process assignment values
  function processAssignmentValue(value, targetType, line) {
    const trimmed = value.trim();
    
    // Check for built-in function calls
    const functionCallMatch = trimmed.match(/^(\w+)\s*\(([^)]*)\)$/);
    if (functionCallMatch) {
      const [, funcName] = functionCallMatch;
      
      // Define built-in functions and their return types
      const builtinFunctions = {
        'LEFT': 'STRING', 'RIGHT': 'STRING', 'MID': 'STRING',
        'LENGTH': 'INTEGER', 'TO_UPPER': 'STRING', 'TO_LOWER': 'STRING',
        'LCASE': 'CHAR', 'UCASE': 'CHAR',
        'NUM_TO_STR': 'STRING', 'STR_TO_NUM': 'REAL', 'IS_NUM': 'BOOLEAN',
        'ASC': 'INTEGER', 'CHR': 'CHAR', 'INT': 'INTEGER', 'RAND': 'REAL',
        'DAY': 'INTEGER', 'MONTH': 'INTEGER', 'YEAR': 'INTEGER',
        'DAYINDEX': 'INTEGER', 'SETDATE': 'DATE', 'TODAY': 'DATE',
        'EOF': 'BOOLEAN'  // Added EOF function
      };
      
      if (builtinFunctions[funcName]) {
        const returnType = builtinFunctions[funcName];
        
        // Type validation for function return type
        if (targetType) {
          // Special case: STRING from function can be assigned to CHAR if length is 1
          if (returnType === 'STRING' && targetType === 'CHAR') {
            return `(function() { 
              let result = ${trimmed}; 
              if (result.length > 1) throw new Error('Cannot assign STRING of length > 1 to CHAR');
              return result;
            })()`;
          } 
          // REAL to INTEGER needs conversion
          else if (returnType === 'REAL' && targetType === 'INTEGER') {
            return `Math.floor(${trimmed})`;
          } 
          // Incompatible types
          else if (returnType !== targetType) {
            throw new Error(`Type mismatch on line ${line}: Function ${funcName} returns ${returnType} but variable expects ${targetType}`);
          }
        }
        return trimmed;
      }
    }
    
    // Check if it's a literal that needs validation
    if (targetType) {
      // Check for CHAR literals
      if (targetType === 'CHAR') {
        // Handle both standard and special single quotes
        if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
            (trimmed.startsWith("ꞌ") && trimmed.endsWith("ꞌ"))) {
          if (trimmed.length !== 3) {
            throw new Error(`CHAR assignment must be single character in single quotes on line ${line}`);
          }
          // Convert to JavaScript string
          return '"' + trimmed.slice(1, -1) + '"';
        }
        // Handle string literals that could be single char
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          const stringContent = trimmed.slice(1, -1);
          if (stringContent.length > 1) {
            throw new Error(`Type mismatch on line ${line}: Cannot assign STRING of length > 1 to CHAR variable`);
          }
          return trimmed;
        }
        // Check for invalid literal types
        if (trimmed === 'TRUE' || trimmed === 'FALSE') {
          throw new Error(`Type mismatch on line ${line}: Cannot assign BOOLEAN value to CHAR variable`);
        }
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign numeric value to CHAR variable`);
        }
        // If it's not in quotes, it might be a variable
        return trimmed;
      }
      
      // Check for BOOLEAN literals
      if (targetType === 'BOOLEAN') {
        if (trimmed === 'TRUE') {
          return 'true';  // Use JavaScript boolean
        }
        if (trimmed === 'FALSE') {
          return 'false';  // Use JavaScript boolean
        }
        // Check for invalid literal types
        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign CHAR value to BOOLEAN variable`);
        }
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign STRING value to BOOLEAN variable`);
        }
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign numeric value to BOOLEAN variable`);
        }
        // Otherwise it's a variable
        return trimmed;
      }
      
      // Check for STRING type
      if (targetType === 'STRING') {
        // Check if it's a concatenation expression
        if (trimmed.includes('&')) {
          // Validate that all operands are strings or chars
          const parts = trimmed.split('&').map(p => p.trim());
          for (const part of parts) {
            // Check each part is string, char, or string variable
            if (!(part.startsWith('"') && part.endsWith('"')) &&
                !(part.startsWith("'") && part.endsWith("'")) &&
                !varTypes.has(part)) {
              // Check if it's a numeric literal being concatenated
              if (/^\d+(\.\d+)?$/.test(part)) {
                throw new Error(`Type mismatch on line ${line}: Cannot concatenate numeric value with string. Use NUM_TO_STR() to convert numbers to strings.`);
              }
              if (part === 'TRUE' || part === 'FALSE') {
                throw new Error(`Type mismatch on line ${line}: Cannot concatenate BOOLEAN value with string.`);
              }
            }
          }
          // Process the concatenation - replace & with +
          return trimmed.replace(/&/g, '+');
        }
        
        // String literals are fine
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          return trimmed;
        }
        // CHAR literals can be assigned to STRING
        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
          // Convert single quotes to double quotes
          return '"' + trimmed.slice(1, -1) + '"';
        }
        // BOOLEAN literals should be treated as type mismatch
        if (trimmed === 'TRUE' || trimmed === 'FALSE') {
          throw new Error(`Type mismatch on line ${line}: Cannot assign BOOLEAN value to STRING variable. Use "TRUE" or "FALSE" in quotes for string literals.`);
        }
        // Numbers should be treated as type mismatch
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign numeric value to STRING variable. Use quotes for string literals.`);
        }
        // Otherwise it's a variable or expression
        return processExpression(trimmed);
      }
      
      // Check for INTEGER type
      if (targetType === 'INTEGER') {
        if (/^-?\d+$/.test(trimmed)) {
          return trimmed;
        }
        // Check for invalid literal types
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
        // Otherwise it's a variable or expression
        return trimmed;
      }
      
      // Check for REAL type
      if (targetType === 'REAL') {
        // Check if it's a number literal
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          // If it's an integer, convert to real format (add .0)
          if (!/\./.test(trimmed)) {
            return trimmed + '.0';
          }
          return trimmed;
        }
        // Check for invalid literal types
        if (trimmed === 'TRUE' || trimmed === 'FALSE') {
          throw new Error(`Type mismatch on line ${line}: Cannot assign BOOLEAN value to REAL variable`);
        }
        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign CHAR value to REAL variable`);
        }
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          throw new Error(`Type mismatch on line ${line}: Cannot assign STRING value to REAL variable`);
        }
        // Otherwise it's a variable or expression
        return trimmed;
      }
      
      // Check for DATE literals (raw format without quotes)
      if (targetType === 'DATE') {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
          const [day, month, year] = trimmed.split('/');
          return `new Date(${year}, ${month - 1}, ${day})`;
        }
        // Check for invalid literal types
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
        // Otherwise it's a variable or function call
        return trimmed;
      }
    }
    
    return value;
}

  // CASE OF STATEMENT 

  function replaceParameterReferences(node, oldName, newName) {
    if (!node) return;
    
    // Replace in assignments
    if (node.type === 'AssignmentStatement') {
      if (node.left === oldName) {
        node.left = newName;
      }
      if (node.right && typeof node.right === 'string') {
        // Replace whole word occurrences - don't use asterisks
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        node.right = node.right.replace(regex, newName);
      }
    }
    
    // Replace in output statements
    if (node.type === 'OutputStatement' && node.value) {
      const regex = new RegExp(`\\b${oldName}\\b`, 'g');
      node.value = node.value.replace(regex, newName);
    }
    
    // Recursively handle nested structures
    if (node.body && Array.isArray(node.body)) {
      node.body.forEach(child => replaceParameterReferences(child, oldName, newName));
    }
    if (node.ifBody && Array.isArray(node.ifBody)) {
      node.ifBody.forEach(child => replaceParameterReferences(child, oldName, newName));
    }
    if (node.elseBody && Array.isArray(node.elseBody)) {
      node.elseBody.forEach(child => replaceParameterReferences(child, oldName, newName));
    }
  }
  
  function transpileNode(node) {
    let js = "";
    
    switch (node.type) {
      case "ConstantStatement":
        // Track the constant
        constants.add(node.name);
        initializedVars.add(node.name); // Constants are always initialized
        
        // Infer type from value and store it
        const inferredType = inferTypeFromValue(node.value);
        varTypes.set(node.name, inferredType);
        
        // Process the value based on inferred type
        const processedConstValue = processConstantValue(node.value);
        
        // Use const in JavaScript for constants
        js += `const ${node.name} = ${processedConstValue};\n`;
        break;

      case "TypeDefinitionStatement":
      // Store the record type definition
      recordTypes.set(node.typeName, node.fields);
      
      // JavaScript doesn't need type definitions, but we track them for validation
      js += `// Record type ${node.typeName} defined\n`;
      break;
      
      
      case "DeclareStatement":
        // Check if it's a record type
        if (recordTypes.has(node.datatype)) {
          // It's a record type - create an object with all fields
          declaredVars.add(node.name);
          varTypes.set(node.name, node.datatype);
          
          // Initialize as an object with undefined fields
          js += `let ${node.name} = {};\n`;
          
          // Store that this is a record
          initializedVars.add(node.name); // Records are considered initialized as objects
        } else {
          // Regular variable declaration (existing code)
          if (!VALID_DATATYPES.includes(node.datatype)) {
            throw new Error(`Invalid datatype "${node.datatype}" on line ${node.line}. Valid types are: ${VALID_DATATYPES.join(', ')}`);
          }
          
          declaredVars.add(node.name);
          varTypes.set(node.name, node.datatype);
          js += `let ${node.name};\n`;
        }
        break;

      case "AssignmentStatement":
        // Check if trying to assign to a constant
        if (constants.has(node.left)) {
          throw new Error(`Cannot assign to constant "${node.left}" on line ${node.line}`);
        }
        
        // Check if variable was declared
        if (!declaredVars.has(node.left) && !constants.has(node.left)) {
          throw new Error(`Variable "${node.left}" was not declared. Use DECLARE before assignment (line ${node.line})`);
        }
        
        // Mark variable as initialized when assigned
        if (declaredVars.has(node.left)) {
          initializedVars.add(node.left);
        }
        
        // Check if variables on the right side are initialized
        const rightSideCheck = checkVariables(node.right, node.line);
        if (rightSideCheck) {
          js += rightSideCheck + '\n';
        }

        // Check for built-in function calls in the right side
      const funcInAssignment = node.right.match(/(\w+)\s*\(([^)]*)\)/);
      if (funcInAssignment) {
        const [, funcName, argsString] = funcInAssignment;
        if (BUILTIN_FUNCTIONS[funcName]) {
          validateBuiltinFunctionCall(funcName, argsString, node.line);
        }
      }

              // Check if both sides are records (for record assignment like Pupil2 ← Pupil1)
        if (varTypes.has(node.left) && varTypes.has(node.right)) {
          const leftType = varTypes.get(node.left);
          const rightType = varTypes.get(node.right);
          
          if (recordTypes.has(leftType) && leftType === rightType) {
            // Deep copy for record assignment
            js += `${node.left} = {...${node.right}};\n`;
            break;
          }
        }
        
        // Check if both sides are arrays (for full array assignment like SavedGame ← NoughtsAndCrosses)
        if (arrays.has(node.left) && arrays.has(node.right)) {
          // Deep copy for array assignment
          const leftArray = arrays.get(node.left);
          if (leftArray.dimensions.length === 1) {
            js += `${node.left} = [...${node.right}];\n`;
          } else if (leftArray.dimensions.length === 2) {
            js += `${node.left} = ${node.right}.map(row => [...row]);\n`;
          } else {
            throw new Error(`Arrays with more than 2 dimensions not supported on line ${node.line}`);
          }
        } else {
          // Regular variable assignment
          // Process the assignment value based on target type
          const assignVarType = varTypes.get(node.left);
          const processedValue = processAssignmentValue(node.right, assignVarType, node.line);
          
          js += `${node.left} = ${processedValue};\n`;
        }
        break;

      case "InputStatement":
        // Check if variable was declared
        if (!declaredVars.has(node.variable)) {
          throw new Error(`Variable "${node.variable}" used in INPUT on line ${node.line} was not declared`);
        }
        
        // Mark variable as initialized after input
        initializedVars.add(node.variable);
        
        // Use type-specific input handling
        const varType = varTypes.get(node.variable);
        js += generateInputConversion(node.variable, varType);
        break;

      case "CallStatement":
      // Check if it's a built-in function first
      const builtinFunctions = {
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
      
      if (builtinFunctions[node.functionName]) {
        const funcDef = builtinFunctions[node.functionName];
        const expectedParams = funcDef.params;
        const providedArgs = node.arguments ? node.arguments.length : 0;
        
        if (expectedParams !== providedArgs) {
          throw new Error(`Built-in function "${node.functionName}" expects ${expectedParams} parameter(s) but ${providedArgs} were provided (line ${node.line})`);
        }
        
        // Validate parameter types for built-in functions with expected types
        if (node.arguments && node.arguments.length > 0) {
          // Define expected types for each built-in function's parameters
          const paramTypes = {
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
            node.arguments.forEach((arg, index) => {
              const expectedTypes = expectedParamTypes[index];
              let actualType = null;
              
              // Determine actual type of argument
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
                // Check if it's a variable
                const varType = varTypes.get(trimmedArg);
                if (varType) {
                  actualType = varType;
                }
              }
              
              // Validate type compatibility
              if (actualType && !expectedTypes.includes(actualType)) {
                // Special cases for type compatibility
                if (expectedTypes.includes('STRING') && actualType === 'CHAR') {
                  return; // CHAR can be used where STRING is expected
                }
                if (expectedTypes.includes('REAL') && actualType === 'INTEGER') {
                  return; // INTEGER can be used where REAL is expected
                }
                
                throw new Error(`Type mismatch in ${node.functionName} function on line ${node.line}: Parameter ${index + 1} expects ${expectedTypes.join(' or ')} but got ${actualType}`);
              }
            });
          }
        }
        
        // Process arguments for built-in function
        const processedArgs = node.arguments ? node.arguments.map(arg => processExpression(arg)) : [];
        js += `${node.functionName}(${processedArgs.join(', ')});\n`;
        break;
      }
      
      // Find the procedure/function definition in the AST
      let procedureNode = null;
      let functionNode = null;
      
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
      
      // Validate parameter count for user-defined procedures/functions
      if (callableNode) {
        const expectedParams = callableNode.parameters.length;
        const providedArgs = node.arguments ? node.arguments.length : 0;
        
        if (expectedParams !== providedArgs) {
          throw new Error(`Procedure/Function "${node.functionName}" expects ${expectedParams} parameter(s) but ${providedArgs} were provided (line ${node.line})`);
        }
        
        // Validate parameter types for user-defined procedures/functions
        if (node.arguments && callableNode.parameters) {
          node.arguments.forEach((arg, index) => {
            const expectedParam = callableNode.parameters[index];
            const expectedType = expectedParam.datatype;
            let actualType = null;
            
            // Determine actual type of argument
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
              // Check if it's a variable
              const varType = varTypes.get(trimmedArg);
              if (varType) {
                actualType = varType;
              }
            }
            
            // Validate type compatibility
            if (actualType && actualType !== expectedType) {
              // Special cases for type compatibility
              if (expectedType === 'STRING' && actualType === 'CHAR') {
                return; // CHAR can be used where STRING is expected
              }
              if (expectedType === 'REAL' && actualType === 'INTEGER') {
                return; // INTEGER can be used where REAL is expected
              }
              
              throw new Error(`Type mismatch in ${node.functionName} call on line ${node.line}: Parameter ${index + 1} (${expectedParam.name}) expects ${expectedType} but got ${actualType}`);
            }
          });
        }
      }
      
      // Rest of the existing CallStatement code...
      if (procedureNode && node.arguments && node.arguments.length > 0) {
        // Check if any parameters are BYREF
        let hasByRef = false;
        const processedArgs = [];
        const byRefMapping = [];
        
        node.arguments.forEach((arg, index) => {
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
        // Regular function call with arguments
        const processedArgs = node.arguments.map(arg => processExpression(arg));
        js += `${node.functionName}(${processedArgs.join(', ')});\n`;
      } else {
        // No arguments call
        js += `${node.functionName}();\n`;
      }
      break;

      case "CaseStatement":
        // Check if the variable is initialized
        const caseVarCheck = checkVariables(node.variable, node.line);
        
        if (caseVarCheck) {
          js += caseVarCheck + '\n';
        }
        
        const caseVarType = varTypes.get(node.variable);
        let firstClause = true;
        
        // Process each case clause
        for (const clause of node.clauses) {
          if (firstClause) {
            js += `if (`;
            firstClause = false;
          } else {
            js += `} else if (`;
          }
          
          // Handle different condition types
          if (clause.condition.type === 'single') {
            const processedVal = processCaseValue(clause.condition.value, caseVarType);
            js += `${node.variable} === ${processedVal}`;
          } else if (clause.condition.type === 'multiple') {
            const conditions = clause.condition.values.map(val => {
              const processedVal = processCaseValue(val, caseVarType);
              return `${node.variable} === ${processedVal}`;
            });
            js += `(${conditions.join(' || ')})`;
          } else if (clause.condition.type === 'range') {
            const fromVal = processCaseValue(clause.condition.from, caseVarType);
            const toVal = processCaseValue(clause.condition.to, caseVarType);
            
            // For CHAR ranges, we need to compare character codes
            if (caseVarType === 'CHAR' || 
                (clause.condition.from.startsWith("'") && clause.condition.from.endsWith("'"))) {
              js += `(${node.variable}.charCodeAt(0) >= ${fromVal}.charCodeAt(0) && `;
              js += `${node.variable}.charCodeAt(0) <= ${toVal}.charCodeAt(0))`;
            } else {
              js += `(${node.variable} >= ${fromVal} && ${node.variable} <= ${toVal})`;
            }
          }
          
          js += `) {\n`;
          
          // Transpile the body statements
          for (const stmt of clause.body) {
            js += transpileNode(stmt);
          }
        }
        
        // Handle OTHERWISE clause
        if (node.otherwiseClause) {
          if (node.clauses.length > 0) {
            js += `} else {\n`;
          } else {
            // If there are no other clauses, just execute the otherwise block
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
      // Check if variables in output are initialized
      const outputCheck = checkVariables(node.value, node.line);
      
      if (outputCheck) {
        js += outputCheck + '\n';
      }
      
      // Process the expression to handle operators
      let outputExpression = node.value;
      
      // Check if output contains a built-in function call
      const functionCallMatch = outputExpression.match(/(\w+)\s*\(([^)]*)\)/);
      if (functionCallMatch) {
        const [fullMatch, funcName, argsString] = functionCallMatch;
        
        if (BUILTIN_FUNCTIONS[funcName]) {
          const funcDef = BUILTIN_FUNCTIONS[funcName];
          
          // Parse and validate arguments
          const args = argsString.trim() === '' ? [] : argsString.split(',').map(a => a.trim());
          const providedArgs = args.length;
          const expectedParams = funcDef.params.length;
          
          // Validate parameter count
          if (expectedParams !== providedArgs) {
            throw new Error(`Built-in function "${funcName}" expects ${expectedParams} parameter(s) but ${providedArgs} were provided (line ${node.line})`);
          }
          
          // Validate parameter types
          args.forEach((arg, index) => {
            const expectedTypes = funcDef.params[index];
            let actualType = null;
            
            // Determine actual type of argument
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
              // Check if it's a variable
              const varType = varTypes.get(arg);
              if (varType) {
                actualType = varType;
              }
            }
            
            // Validate type compatibility
            if (actualType && !expectedTypes.includes(actualType)) {
              // Special cases for type compatibility
              if (expectedTypes.includes('STRING') && actualType === 'CHAR') {
                return; // CHAR can be used where STRING is expected
              }
              if (expectedTypes.includes('REAL') && actualType === 'INTEGER') {
                return; // INTEGER can be used where REAL is expected
              }
              
              throw new Error(`Type mismatch in ${funcName} function on line ${node.line}: Parameter ${index + 1} expects ${expectedTypes.join(' or ')} but got ${actualType}`);
            }
          });
          
          // Handle return types
          if (funcDef.returns === 'BOOLEAN') {
            js += `console.log(${outputExpression} ? "TRUE" : "FALSE");\n`;
            break;
          }
          else if (funcDef.returns === 'DATE') {
            js += `console.log((${outputExpression}).toLocaleDateString('en-GB'));\n`;
            break;
          }
          else {
            js += `console.log(${outputExpression});\n`;
            break;
          }
        }
      }
      
      // Check if it's an array access first (before checking for comma separation)
      const arrayAccessMatch = outputExpression.match(/^(\w+)\[([^\]]+)\]$/);
      if (arrayAccessMatch) {
        const [, arrayName, indices] = arrayAccessMatch;
        
        // Check if this is a declared array
        if (arrays.has(arrayName)) {
          const arrayInfo = arrays.get(arrayName);
          const indexList = indices.split(',').map(i => i.trim());
          
          // Process indices for 0-based indexing
          const processedIndices = indexList.map((index, i) => {
            const dim = arrayInfo.dimensions[i];
            if (/^\d+$/.test(index)) {
              return parseInt(index) - dim.lower;
            }
            return `(${index}) - ${dim.lower}`;
          });
          
          // Generate the array access
          if (arrayInfo.dimensions.length === 1) {
            outputExpression = `${arrayName}[${processedIndices[0]}]`;
          } else if (arrayInfo.dimensions.length === 2) {
            outputExpression = `${arrayName}[${processedIndices[0]}][${processedIndices[1]}]`;
          }
          
          // Output based on element type
          if (arrayInfo.elementType === 'BOOLEAN') {
            js += `console.log(${outputExpression} ? "TRUE" : "FALSE");\n`;
          } else if (arrayInfo.elementType === 'DATE') {
            js += `console.log(${outputExpression} instanceof Date ? ${outputExpression}.toLocaleDateString('en-GB') : ${outputExpression});\n`;
          } else {
            js += `console.log(${outputExpression});\n`;
          }
        } else {
          // Not an array, output as regular expression
          js += `console.log(${outputExpression});\n`;
        }
      }
      // Check if it's a simple expression that needs operator processing
      else if (!outputExpression.includes(',')) {
        // Single expression - check if it contains operators (but not in string literals)
        const trimmedValue = outputExpression.trim();
        
        // Check for concatenation operator FIRST
        const hasConcatenation = trimmedValue.includes('&');
        
        // Don't process operators if it's a SINGLE string literal (no operators)
        const isStringLiteral = trimmedValue.startsWith('"') && trimmedValue.endsWith('"') && !hasConcatenation;
        const isCharLiteral = trimmedValue.startsWith("'") && trimmedValue.endsWith("'") && !hasConcatenation;
        
        const hasOperators = !isStringLiteral && !isCharLiteral && 
                      (/[<>=]|AND|OR|NOT|<>|DIV|MOD|\*\*/.test(outputExpression) || hasConcatenation);
        
        
        if (hasOperators) {
          // Process operators in the expression
          outputExpression = processExpression(outputExpression);
          
          // For boolean results, convert to "TRUE"/"FALSE" strings for display
          js += `(function() {\n`;
          js += `  let _result = ${outputExpression};\n`;
          js += `  if (typeof _result === 'boolean') {\n`;
          js += `    console.log(_result ? "TRUE" : "FALSE");\n`;
          js += `  } else {\n`;
          js += `    console.log(String(_result));\n`;
          js += `  }\n`;
          js += `})();\n`;
        } else {
          // Handle as before for simple values
          const trimmedValue = outputExpression.trim();
          
          // Handle CHAR literals
          if (trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) {
            js += `console.log("${trimmedValue.slice(1, -1)}");\n`;
          }
          // Handle BOOLEAN literals - convert to uppercase for display
          else if (trimmedValue === 'TRUE' || trimmedValue === 'FALSE') {
            js += `console.log("${trimmedValue}");\n`;
          }
          // Handle BOOLEAN variables - convert to uppercase for display
          else if (varTypes.get(trimmedValue) === 'BOOLEAN') {
            js += `console.log(${trimmedValue} ? "TRUE" : "FALSE");\n`;
          }
          // Handle DATE variables
          else if (!trimmedValue.startsWith('"') && !trimmedValue.endsWith('"') && 
                  varTypes.get(trimmedValue) === 'DATE') {
            js += `console.log(${trimmedValue} instanceof Date ? ${trimmedValue}.toLocaleDateString('en-GB') : ${trimmedValue});\n`;
          }
          else {
            js += `console.log(${outputExpression});\n`;
          }
        }
      } else {
        // Multiple comma-separated values (but not array indices)
        const outputParts = outputExpression.split(',').map(part => part.trim());
        const concatenated = outputParts.map(part => {
          const trimmed = part.trim();
          
          // Handle CHAR literals (single quotes)
          if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
            return '"' + trimmed.slice(1, -1) + '"';
          }
          
          // Handle STRING literals (double quotes)
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return trimmed;
          }
          
          // Handle BOOLEAN literals
          if (trimmed === 'TRUE' || trimmed === 'FALSE') {
            return '"' + trimmed + '"';  // Keep as string 'TRUE' or 'FALSE'
          }
          
          // Handle variables
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
        // Check variables in loop bounds
        const fromCheck = checkVariables(String(node.from), node.line);
        const toCheck = checkVariables(String(node.to), node.line);
        
        if (fromCheck) js += fromCheck + '\n';
        if (toCheck) js += toCheck + '\n';
        
        js += `for (let ${node.variable} = ${node.from}; ${node.variable} <= ${node.to}; ${node.variable}++) {\n`;
        
        // Mark loop variable as initialized within loop scope
        const wasInitialized = initializedVars.has(node.variable);
        initializedVars.add(node.variable);
        
        for (const child of node.body) {
          js += transpileNode(child);
        }
        
        // Restore previous initialization state
        if (!wasInitialized) {
          initializedVars.delete(node.variable);
        }
        
        js += `}\n`;
        break;
      
      case "WhileLoopStatement":
        // Check if variables in condition are initialized
        const whileConditionCheck = checkVariables(node.condition, node.line);
        if (whileConditionCheck) {
          js += whileConditionCheck + '\n';
        }
        
        // Process condition to handle operators and BOOLEAN literals
        let whileProcessedCondition = processExpression(node.condition);
        
        js += `while (${whileProcessedCondition}) {\n`;
        
        // Transpile the body statements
        for (const child of node.body) {
          js += transpileNode(child);
        }
        
        js += `}\n`;
        break;

      case "RepeatLoopStatement":
        // REPEAT...UNTIL is a do...while loop with inverted condition
        // (REPEAT continues while condition is FALSE, stops when TRUE)
        
        js += `do {\n`;
        
        // Transpile the body statements
        for (const child of node.body) {
          js += transpileNode(child);
        }
        
        // Check if variables in condition are initialized
        const repeatConditionCheck = checkVariables(node.condition, node.line);
        if (repeatConditionCheck) {
          js += repeatConditionCheck + '\n';
        }
        
        // Process condition to handle operators and BOOLEAN literals
        let repeatProcessedCondition = processExpression(node.condition);
        
        // Invert the condition (REPEAT runs while condition is FALSE)
        js += `} while (!(${repeatProcessedCondition}));\n`;
        break;

        // FILE HANDLING


      case "OpenFileStatement":
        // Process the filename
        let openFileName = node.fileName;
        if (!openFileName.startsWith('"')) {
          // It's a variable, not a literal
          openFileName = processExpression(openFileName);
        }
        js += `OPENFILE(${openFileName}, '${node.mode}');\n`;
        break;

      case "CloseFileStatement":
        let closeFileName = node.fileName;
        if (!closeFileName.startsWith('"')) {
          closeFileName = processExpression(closeFileName);
        }
        js += `CLOSEFILE(${closeFileName});\n`;
        break;

      case "ReadFileStatement":
        // Check if variable was declared
        if (!declaredVars.has(node.variable)) {
          throw new Error(`Variable "${node.variable}" was not declared. Use DECLARE before READFILE (line ${node.line})`);
        }
        
        // Mark variable as initialized after reading
        initializedVars.add(node.variable);
        
        let readFileName = node.fileName;
        if (!readFileName.startsWith('"')) {
          readFileName = processExpression(readFileName);
        }
        
        js += `${node.variable} = READFILE(${readFileName});\n`;
        break;

      case "WriteFileStatement":
        let writeFileName = node.fileName;
        if (!writeFileName.startsWith('"')) {
          writeFileName = processExpression(writeFileName);
        }
        
        // Process the data expression
        const writeData = processExpression(node.data);
        
        js += `WRITEFILE(${writeFileName}, ${writeData});\n`;
        break;
      

      case "DeclareArrayStatement":
        // Check if element type is a record
        if (recordTypes.has(node.elementType)) {
          // Array of records
          arrays.set(node.name, {
            dimensions: node.dimensions,
            elementType: node.elementType,
            isRecordType: true
          });
          
          declaredVars.add(node.name);
          initializedVars.add(node.name);
          
          const sizes = [];
          for (const dim of node.dimensions) {
            const size = dim.upper - dim.lower + 1;
            sizes.push(size);
          }
          
          if (node.dimensions.length === 1) {
            // 1D array of records - initialize each element as empty object
            js += `let ${node.name} = Array(${sizes[0]}).fill(null).map(() => ({}));\n`;
          } else {
            throw new Error(`Multi-dimensional arrays of records not supported on line ${node.line}`);
          }
        } else {
          // Regular array (existing code)
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
          const sizes = [];
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
        break;

      case "AssignArrayRecordFieldStatement":
        // Check if array was declared
        if (!arrays.has(node.arrayName)) {
          throw new Error(`Array "${node.arrayName}" was not declared on line ${node.line}`);
        }
        
        const arrayRecordInfo = arrays.get(node.arrayName);
        
        // Check if it's an array of records
        if (!arrayRecordInfo.isRecordType) {
          throw new Error(`"${node.arrayName}" is not an array of records on line ${node.line}`);
        }
        
        // Get field info
        const arrayRecordType = arrayRecordInfo.elementType;
        const arrayRecordFields = recordTypes.get(arrayRecordType);
        const arrayField = arrayRecordFields.find(f => f.name === node.fieldName);
        
        if (!arrayField) {
          throw new Error(`Field "${node.fieldName}" does not exist in record type "${arrayRecordType}" on line ${node.line}`);
        }
        
        // Process the index
        const dim = arrayRecordInfo.dimensions[0];
        let processedIndex;
        if (/^\d+$/.test(node.index)) {
          processedIndex = parseInt(node.index) - dim.lower;
        } else {
          processedIndex = `(${node.index}) - ${dim.lower}`;
        }
        
        // Process the value
        const processedFieldValue = processAssignmentValue(node.right, arrayField.datatype, node.line);
        
        js += `${node.arrayName}[${processedIndex}].${node.fieldName} = ${processedFieldValue};\n`;
        break;  

      case "AssignRecordFieldStatement":
        // Check if record was declared
        if (!declaredVars.has(node.recordName)) {
          throw new Error(`Record "${node.recordName}" was not declared on line ${node.line}`);
        }
        
        // Get the record type
        const recordType = varTypes.get(node.recordName);
        if (!recordTypes.has(recordType)) {
          throw new Error(`"${node.recordName}" is not a record type on line ${node.line}`);
        }
        
        // Get field info
        const recordFields = recordTypes.get(recordType);
        const field = recordFields.find(f => f.name === node.fieldName);
        
        if (!field) {
          throw new Error(`Field "${node.fieldName}" does not exist in record type "${recordType}" on line ${node.line}`);
        }
        
        // Process the value based on field type
        const processedRecordValue = processAssignmentValue(node.right, field.datatype, node.line);
        
        js += `${node.recordName}.${node.fieldName} = ${processedRecordValue};\n`;
        break;

      case "AssignArrayElementStatement":
        // Check if array was declared
        if (!arrays.has(node.arrayName)) {
          throw new Error(`Array "${node.arrayName}" was not declared. Use DECLARE before assignment (line ${node.line})`);
        }
        
        const arrayInfo = arrays.get(node.arrayName);
        
        // Check number of indices matches dimensions
        if (node.indices.length !== arrayInfo.dimensions.length) {
          throw new Error(`Array "${node.arrayName}" expects ${arrayInfo.dimensions.length} indices but got ${node.indices.length} on line ${node.line}`);
        }
        
        // Process the indices (convert to 0-based indexing)
        const processedIndices = node.indices.map((index, i) => {
          const dim = arrayInfo.dimensions[i];
          // If index is a literal number, adjust it
          if (/^\d+$/.test(index)) {
            const indexNum = parseInt(index);
            return indexNum - dim.lower; // Convert to 0-based
          }
          // If it's an expression, need to adjust at runtime
          return `(${index}) - ${dim.lower}`;
        });
        
        // Check variables on right side
        const rightCheck = checkVariables(node.right, node.line);
        if (rightCheck) {
          js += rightCheck + '\n';
        }
        
        // Process the assignment value
        const processedArrayValue = processAssignmentValue(node.right, arrayInfo.elementType, node.line);
        
        // Generate the assignment
        if (arrayInfo.dimensions.length === 1) {
          js += `${node.arrayName}[${processedIndices[0]}] = ${processedArrayValue};\n`;
        } else if (arrayInfo.dimensions.length === 2) {
          js += `${node.arrayName}[${processedIndices[0]}][${processedIndices[1]}] = ${processedArrayValue};\n`;
        }
        break;

      //PROCEDURES AND FUNCTIONS
      
      case "ProcedureDefinition":
        // Generate JavaScript function for procedure
        js += `function ${node.name}(`;
        
        // Add parameters
        const procParams = node.parameters.map(p => p.name).join(', ');
        js += procParams;
        js += `) {\n`;
        
        // Handle BYREF parameters - unwrap at the beginning
        for (const param of node.parameters) {
          if (param.passingMethod === 'BYREF') {
            // Create a local variable that unwraps the reference object
            js += `  let _${param.name} = ${param.name}.value;\n`;
            // Also declare _X as a known variable
            declaredVars.add(`_${param.name}`);
            initializedVars.add(`_${param.name}`);
            varTypes.set(`_${param.name}`, param.datatype);
          } else {
            // For BYVAL parameters, just track them normally
            declaredVars.add(param.name);
            initializedVars.add(param.name);
            varTypes.set(param.name, param.datatype);
          }
        }
        
        // Save current variable state and create new scope
        const savedDeclaredVars = new Set(declaredVars);
        const savedInitializedVars = new Set(initializedVars);
        
        // Transpile body with BYREF replacements
        for (const stmt of node.body) {
          // For BYREF parameters, replace references in the body
          let stmtCopy = JSON.parse(JSON.stringify(stmt)); // Deep copy
          
          // Replace parameter names with their wrapped versions
          for (const param of node.parameters) {
            if (param.passingMethod === 'BYREF') {
              replaceParameterReferences(stmtCopy, param.name, `_${param.name}`);
            }
          }
          
          js += transpileNode(stmtCopy);
        }
        
        // Write back BYREF parameters at the end
        for (const param of node.parameters) {
          if (param.passingMethod === 'BYREF') {
            js += `  ${param.name}.value = _${param.name};\n`;
          }
        }
        
        js += `}\n\n`;
        
        // Restore variable state
        declaredVars.clear();
        initializedVars.clear();
        savedDeclaredVars.forEach(v => declaredVars.add(v));
        savedInitializedVars.forEach(v => initializedVars.add(v));
        break;

    case "FunctionDefinition":
      // Generate JavaScript function
      js += `function ${node.name}(`;
      
      // Add parameters
      const funcParams = node.parameters.map(p => p.name).join(', ');
      js += funcParams;
      js += `) {\n`;
      
      // Track return type
      varTypes.set(`${node.name}_RETURN`, node.returnType);
      
      // Initialize parameters as local variables
      for (const param of node.parameters) {
        declaredVars.add(param.name);
        initializedVars.add(param.name);
        varTypes.set(param.name, param.datatype);
      }
      
      // Transpile body
      for (const stmt of node.body) {
        js += transpileNode(stmt);
      }
      
      js += `}\n\n`;
      break;

    case "ReturnStatement":
      // Check variables in return value
      const returnCheck = checkVariables(node.value, node.line);
      if (returnCheck) {
        js += returnCheck + '\n';
      }
      
      // Process the return value
      const processedReturn = processExpression(node.value);
      js += `return ${processedReturn};\n`;
      break;

      case "IfStatement":
        // Check if variables in condition are initialized
        const conditionCheck = checkVariables(node.condition, node.line);
        if (conditionCheck) {
          js += conditionCheck + '\n';
        }
        
        // Process condition to handle operators and BOOLEAN literals
        let processedCondition = processExpression(node.condition);
        
        // No need for special boolean variable handling since we're using real booleans
        
        js += `if (${processedCondition}) {\n`;

        // Recursively transpile the ifBody
        for (const child of node.ifBody) {
          js += transpileNode(child);
        }

        js += `}\n`;

        if (node.elseBody.length > 0) {
          js += `else {\n`;

          // Recursively transpile the elseBody
          for (const child of node.elseBody) {
            js += transpileNode(child);
          }

          js += `}\n`;
        }
        break;

      default:
        throw new Error(`Unknown AST node type: ${node.type}`);
    }
    
    return js;
  }

  let js = builtInImplementations + fileHandlingImplementation;
  
  // Process all nodes
  for (const node of ast.body) {
    js += transpileNode(node);
  }

  console.log("📝 Generated JavaScript:");
  console.log(js);

  // Expose files for the UI with modification tracking
  js += `
// Expose files for the UI
if (typeof window !== 'undefined') {
  // Create a new Map with only modified or new files
  const modifiedFiles = new Map();
  __files.forEach((value, key) => {
    // Only expose files that have been modified or created during execution
    if (value.modified && value.content && value.content.length > 0) {
      modifiedFiles.set(key, value);
    }
  });
  window.__virtualFiles = modifiedFiles;
}
`;


  
  return js;
}