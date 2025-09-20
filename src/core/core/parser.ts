interface Token {
  type: string;
  line: number;
  // Allow additional properties based on token type
  [key: string]: any;
}

interface Program {
  type: "Program";
  body: Statement[];
}

type Statement =
  | ConstantStatement
  | DeclareStatement
  | AssignmentStatement
  | OutputStatement
  | InputStatement
  | CallStatement
  | OpenFileStatement
  | CloseFileStatement
  | ReadFileStatement
  | WriteFileStatement
  | CaseStatement
  | WhileLoopStatement
  | RepeatLoopStatement
  | TypeDefinitionStatement
  | AssignRecordFieldStatement
  | AssignArrayRecordFieldStatement
  | DeclareArrayStatement
  | AssignArrayElementStatement
  | ProcedureDefinition
  | FunctionDefinition
  | ReturnStatement
  | ForLoopStatement
  | IfStatement
  | any; // Extend as needed

interface ConstantStatement {
  type: "ConstantStatement";
  name: string;
  value: string;
  line: number;
}

interface DeclareStatement {
  type: "DeclareStatement";
  name: string;
  datatype: string;
  line: number;
}

interface AssignmentStatement {
  type: "AssignmentStatement";
  left: string;
  right: string;
  line: number;
}

interface OutputStatement {
  type: "OutputStatement";
  value: string;
  line: number;
}

interface InputStatement {
  type: "InputStatement";
  variable: string;
  line: number;
}

interface CallStatement {
  type: "CallStatement";
  functionName: string;
  arguments: any[];
  line: number;
}

interface OpenFileStatement {
  type: "OpenFileStatement";
  fileName: string;
  mode: string;
  line: number;
}

interface CloseFileStatement {
  type: "CloseFileStatement";
  fileName: string;
  line: number;
}

interface ReadFileStatement {
  type: "ReadFileStatement";
  fileName: string;
  variable: string;
  line: number;
}

interface WriteFileStatement {
  type: "WriteFileStatement";
  fileName: string;
  data: string;
  line: number;
}

interface CaseClause {
  condition: string;
  body: Statement[];
  line: number;
}

interface CaseOtherwiseClause {
  body: Statement[];
  line: number;
}

interface CaseStatement {
  type: "CaseStatement";
  variable: string;
  clauses: CaseClause[];
  otherwiseClause: CaseOtherwiseClause | null;
  line: number;
}

interface WhileLoopStatement {
  type: "WhileLoopStatement";
  condition: string;
  body: Statement[];
  line: number;
}

interface RepeatLoopStatement {
  type: "RepeatLoopStatement";
  condition: string;
  body: Statement[];
  line: number;
}

interface TypeDefinitionStatement {
  type: "TypeDefinitionStatement";
  typeName: string;
  fields: { name: string; datatype: string; line: number }[];
  line: number;
}

interface AssignRecordFieldStatement {
  type: "AssignRecordFieldStatement";
  recordName: string;
  fieldName: string;
  right: string;
  line: number;
}

interface AssignArrayRecordFieldStatement {
  type: "AssignArrayRecordFieldStatement";
  arrayName: string;
  index: number;
  fieldName: string;
  right: string;
  line: number;
}

interface DeclareArrayStatement {
  type: "DeclareArrayStatement";
  name: string;
  dimensions: number[];
  elementType: string;
  line: number;
}

interface AssignArrayElementStatement {
  type: "AssignArrayElementStatement";
  arrayName: string;
  indices: number[];
  right: string;
  line: number;
}

interface ProcedureDefinition {
  type: "ProcedureDefinition";
  name: string;
  parameters: any[];
  body: Statement[];
  line: number;
}

interface FunctionDefinition {
  type: "FunctionDefinition";
  name: string;
  parameters: any[];
  returnType: string;
  body: Statement[];
  line: number;
}

interface ReturnStatement {
  type: "ReturnStatement";
  value: string;
  line: number;
}

interface ForLoopStatement {
  type: "ForLoopStatement";
  variable: string;
  from: number;
  to: number;
  body: Statement[];
  line: number;
}

interface IfStatement {
  type: "IfStatement";
  condition: string;
  ifBody: Statement[];
  elseBody: Statement[];
  line: number;
}

interface ParseResult {
  statement: Statement | null;
  nextIndex: number;
}

export function parse(tokens: Token[]): Program {
  const body: Statement[] = [];
  let i = 0;

  while (i < tokens.length) {
    const result = parseStatement(tokens, i);
    if (result.statement) {
      body.push(result.statement);
    }
    i = result.nextIndex;
  }

  return { type: "Program", body };
}

function parseStatement(tokens: Token[], startIndex: number): ParseResult {
  const token = tokens[startIndex];

  if (!token) {
    return { statement: null, nextIndex: startIndex };
  }

  // CONSTANT
  if (token.type === "CONSTANT") {
    return {
      statement: {
        type: "ConstantStatement",
        name: token.name,
        value: token.value,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // DECLARE
  if (token.type === "DECLARE") {
    return {
      statement: {
        type: "DeclareStatement",
        name: token.name,
        datatype: token.datatype,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // ASSIGN
  if (token.type === "ASSIGN") {
    return {
      statement: {
        type: "AssignmentStatement",
        left: token.left,
        right: token.right,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // OUTPUT
  if (token.type === "OUTPUT") {
    return {
      statement: {
        type: "OutputStatement",
        value: token.value,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // INPUT
  if (token.type === "INPUT") {
    return {
      statement: {
        type: "InputStatement",
        variable: token.variable,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // CALL statement (for function calls)
  if (token.type === "CALL") {
    return {
      statement: {
        type: "CallStatement",
        functionName: token.functionName,
        arguments: token.arguments || [],
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // OPENFILE
  if (token.type === "OPENFILE") {
    return {
      statement: {
        type: "OpenFileStatement",
        fileName: token.fileName,
        mode: token.mode,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // CLOSEFILE
  if (token.type === "CLOSEFILE") {
    return {
      statement: {
        type: "CloseFileStatement",
        fileName: token.fileName,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // READFILE
  if (token.type === "READFILE") {
    return {
      statement: {
        type: "ReadFileStatement",
        fileName: token.fileName,
        variable: token.variable,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // WRITEFILE
  if (token.type === "WRITEFILE") {
    return {
      statement: {
        type: "WriteFileStatement",
        fileName: token.fileName,
        data: token.data,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // CASE statement
  if (token.type === "CASE_START") {
    const variable = token.variable;
    const line = token.line;
    const clauses: CaseClause[] = [];
    let otherwiseClause: CaseOtherwiseClause | null = null;

    let i = startIndex + 1;

    // Parse all case clauses
    while (i < tokens.length && tokens[i].type !== "CASE_END") {
      const clauseToken = tokens[i];

      if (clauseToken.type === "CASE_CLAUSE") {
        const clauseBody: Statement[] = [];

        // If there's an inline statement, parse it as a single statement
        if (clauseToken.statement && clauseToken.statement.trim() !== "") {
          const tempToken = identifyInlineStatement(clauseToken.statement, clauseToken.line);
          if (tempToken) {
            const result = parseStatement([tempToken], 0);
            if (result.statement) {
              clauseBody.push(result.statement);
            }
          }
          i++;
        } else {
          i++;
          // Parse following statements until next clause
          while (
            i < tokens.length &&
            tokens[i].type !== "CASE_CLAUSE" &&
            tokens[i].type !== "CASE_OTHERWISE" &&
            tokens[i].type !== "CASE_END"
          ) {
            const result = parseStatement(tokens, i);
            if (result.statement) {
              clauseBody.push(result.statement);
            }
            i = result.nextIndex;
          }
        }

        clauses.push({
          condition: clauseToken.condition,
          body: clauseBody,
          line: clauseToken.line,
        });
      } else if (clauseToken.type === "CASE_OTHERWISE") {
        const otherwiseBody: Statement[] = [];

        if (clauseToken.statement && clauseToken.statement.trim() !== "") {
          const tempToken = identifyInlineStatement(clauseToken.statement, clauseToken.line);
          if (tempToken) {
            const result = parseStatement([tempToken], 0);
            if (result.statement) {
              otherwiseBody.push(result.statement);
            }
          }
          i++;
        } else {
          i++;
          while (i < tokens.length && tokens[i].type !== "CASE_END") {
            const result = parseStatement(tokens, i);
            if (result.statement) {
              otherwiseBody.push(result.statement);
            }
            i = result.nextIndex;
          }
        }

        otherwiseClause = { body: otherwiseBody, line: clauseToken.line };
      } else {
        throw new Error(`Unexpected token ${tokens[i].type} inside CASE on line ${tokens[i].line}`);
      }
    }

    if (i >= tokens.length || tokens[i].type !== "CASE_END") {
      throw new Error(`Missing ENDCASE for CASE statement on line ${line}`);
    }

    return {
      statement: {
        type: "CaseStatement",
        variable,
        clauses,
        otherwiseClause,
        line,
      },
      nextIndex: i + 1,
    };
  }

  // WHILE loop
  if (token.type === "WHILE_START") {
    const whileBody: Statement[] = [];
    const condition = token.condition;
    const line = token.line;

    let i = startIndex + 1;
    while (i < tokens.length && tokens[i].type !== "WHILE_END") {
      const result = parseStatement(tokens, i);
      if (result.statement) {
        whileBody.push(result.statement);
      }
      i = result.nextIndex;
    }

    if (i >= tokens.length || tokens[i].type !== "WHILE_END") {
      throw new Error(`Missing ENDWHILE for WHILE loop on line ${line}`);
    }

    return {
      statement: {
        type: "WhileLoopStatement",
        condition,
        body: whileBody,
        line,
      },
      nextIndex: i + 1,
    };
  }

  // REPEAT...UNTIL loop
  if (token.type === "REPEAT_START") {
    const repeatBody: Statement[] = [];
    const line = token.line;

    let i = startIndex + 1;
    while (i < tokens.length && tokens[i].type !== "REPEAT_END") {
      const result = parseStatement(tokens, i);
      if (result.statement) {
        repeatBody.push(result.statement);
      }
      i = result.nextIndex;
    }

    if (i >= tokens.length || tokens[i].type !== "REPEAT_END") {
      throw new Error(`Missing UNTIL for REPEAT loop on line ${line}`);
    }

    const untilCondition = tokens[i].condition;

    return {
      statement: {
        type: "RepeatLoopStatement",
        condition: untilCondition,
        body: repeatBody,
        line,
      },
      nextIndex: i + 1,
    };
  }

  // TYPE definition
  if (token.type === "TYPE_START") {
    const typeName = token.typeName;
    const line = token.line;
    const fields: { name: string; datatype: string; line: number }[] = [];

    let i = startIndex + 1;

    while (i < tokens.length && tokens[i].type !== "TYPE_END") {
      if (tokens[i].type === "DECLARE") {
        fields.push({
          name: tokens[i].name,
          datatype: tokens[i].datatype,
          line: tokens[i].line,
        });
        i++;
      } else {
        throw new Error(`Unexpected token ${tokens[i].type} inside TYPE definition on line ${tokens[i].line}`);
      }
    }

    if (i >= tokens.length || tokens[i].type !== "TYPE_END") {
      throw new Error(`Missing ENDTYPE for TYPE definition on line ${line}`);
    }

    return {
      statement: {
        type: "TypeDefinitionStatement",
        typeName,
        fields,
        line,
      },
      nextIndex: i + 1,
    };
  }

  // Assign to record field
  if (token.type === "ASSIGN_RECORD_FIELD") {
    return {
      statement: {
        type: "AssignRecordFieldStatement",
        recordName: token.recordName,
        fieldName: token.fieldName,
        right: token.right,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // Assign to array element's record field
  if (token.type === "ASSIGN_ARRAY_RECORD_FIELD") {
    return {
      statement: {
        type: "AssignArrayRecordFieldStatement",
        arrayName: token.arrayName,
        index: token.index,
        fieldName: token.fieldName,
        right: token.right,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // DECLARE ARRAY
  if (token.type === "DECLARE_ARRAY") {
    return {
      statement: {
        type: "DeclareArrayStatement",
        name: token.name,
        dimensions: token.dimensions,
        elementType: token.elementType,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // ASSIGN to array element
  if (token.type === "ASSIGN_ARRAY") {
    return {
      statement: {
        type: "AssignArrayElementStatement",
        arrayName: token.arrayName,
        indices: token.indices,
        right: token.right,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // PROCEDURE definition
  if (token.type === "PROCEDURE_START") {
    const procedureBody: Statement[] = [];
    const name = token.name;
    const parameters = token.parameters;
    const line = token.line;

    let i = startIndex + 1;
    while (i < tokens.length && tokens[i].type !== "PROCEDURE_END") {
      const result = parseStatement(tokens, i);
      if (result.statement) {
        procedureBody.push(result.statement);
      }
      i = result.nextIndex;
    }

    if (i >= tokens.length || tokens[i].type !== "PROCEDURE_END") {
      throw new Error(`Missing ENDPROCEDURE for procedure ${name} on line ${line}`);
    }

    return {
      statement: {
        type: "ProcedureDefinition",
        name,
        parameters,
        body: procedureBody,
        line,
      },
      nextIndex: i + 1,
    };
  }

  // FUNCTION definition
  if (token.type === "FUNCTION_START") {
    const functionBody: Statement[] = [];
    const name = token.name;
    const parameters = token.parameters;
    const returnType = token.returnType;
    const line = token.line;

    let i = startIndex + 1;
    while (i < tokens.length && tokens[i].type !== "FUNCTION_END") {
      const result = parseStatement(tokens, i);
      if (result.statement) {
        functionBody.push(result.statement);
      }
      i = result.nextIndex;
    }

    if (i >= tokens.length || tokens[i].type !== "FUNCTION_END") {
      throw new Error(`Missing ENDFUNCTION for function ${name} on line ${line}`);
    }

    return {
      statement: {
        type: "FunctionDefinition",
        name,
        parameters,
        returnType,
        body: functionBody,
        line,
      },
      nextIndex: i + 1,
    };
  }

  // RETURN statement
  if (token.type === "RETURN") {
    return {
      statement: {
        type: "ReturnStatement",
        value: token.value,
        line: token.line,
      },
      nextIndex: startIndex + 1,
    };
  }

  // FOR LOOP
  if (token.type === "FOR_LOOP_START") {
    const loopBody: Statement[] = [];
    const loopVar = token.variable;
    const start = token.from;
    const end = token.to;
    const line = token.line;

    let i = startIndex + 1;
    while (i < tokens.length && tokens[i].type !== "FOR_LOOP_END") {
      const result = parseStatement(tokens, i);
      if (result.statement) {
        loopBody.push(result.statement);
      }
      i = result.nextIndex;
    }

    if (i >= tokens.length || tokens[i].type !== "FOR_LOOP_END") {
      throw new Error(`Missing NEXT for FOR loop on line ${line}`);
    }

    return {
      statement: {
        type: "ForLoopStatement",
        variable: loopVar,
        from: start,
        to: end,
        body: loopBody,
        line,
      },
      nextIndex: i + 1,
    };
  }

  // IF statement
  if (token.type === "IF_START") {
    const ifBody: Statement[] = [];
    const elseBody: Statement[] = [];
    const condition = token.condition;
    const line = token.line;

    let i = startIndex + 1;

    // IF body
    while (i < tokens.length && tokens[i].type !== "ELSE" && tokens[i].type !== "ENDIF") {
      const result = parseStatement(tokens, i);
      if (result.statement) {
        ifBody.push(result.statement);
      }
      i = result.nextIndex;
    }

    // ELSE block
    if (i < tokens.length && tokens[i].type === "ELSE") {
      i++; // skip ELSE token

      while (i < tokens.length && tokens[i].type !== "ENDIF") {
        const result = parseStatement(tokens, i);
        if (result.statement) {
          elseBody.push(result.statement);
        }
        i = result.nextIndex;
      }
    }

    if (i >= tokens.length || tokens[i].type !== "ENDIF") {
      throw new Error(`Missing ENDIF for IF on line ${line}`);
    }

    return {
      statement: {
        type: "IfStatement",
        condition,
        ifBody,
        elseBody,
        line,
      },
      nextIndex: i + 1,
    };
  }

  // Tokens meant to be part of their parent structures
  if (
    token.type === "ELSE" ||
    token.type === "ENDIF" ||
    token.type === "FOR_LOOP_END" ||
    token.type === "CASE_CLAUSE" ||
    token.type === "CASE_OTHERWISE" ||
    token.type === "CASE_END" ||
    token.type === "WHILE_END" ||
    token.type === "REPEAT_END"
  ) {
    return { statement: null, nextIndex: startIndex };
  }

  throw new Error(`Unexpected token type: ${token.type} on line ${token.line}`);
}

// Helper function to identify inline statements in CASE clauses
function identifyInlineStatement(statement: string, line: number): Token | null {
  const trimmed = statement.trim();

  if (!trimmed) return null;

  if (trimmed.startsWith("OUTPUT")) {
    const value = trimmed.replace("OUTPUT", "").trim();
    return { type: "OUTPUT", value, line };
  }

  if (trimmed.includes("←") || trimmed.includes("<-") || trimmed.includes("<--")) {
    const parts = trimmed.split(/←|<--|<-/);
    if (parts.length === 2) {
      return { type: "ASSIGN", left: parts[0].trim(), right: parts[1].trim(), line };
    }
  }

  if (trimmed.startsWith("CALL")) {
    const functionName = trimmed.replace("CALL", "").trim();
    return { type: "CALL", functionName, line };
  }

  if (trimmed.startsWith("INPUT")) {
    const variable = trimmed.replace("INPUT", "").trim();
    return { type: "INPUT", variable, line };
  }

  if (trimmed.startsWith("IF") && trimmed.includes("THEN")) {
    // Inline IF not supported in this example
    return null;
  }

  return null;
}