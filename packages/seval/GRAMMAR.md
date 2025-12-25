# Seval Language Grammar (EBNF)

This document defines the formal grammar of the Seval language in Extended Backus-Naur Form (EBNF).

## Lexical Elements

### Tokens

```ebnf
(* Whitespace and Comments *)
WHITESPACE     = { " " | "\t" } ;
NEWLINE        = "\n" | "\r\n" ;
LINE_COMMENT   = "//" , { any_char - "\n" } , "\n" ;

(* Literals *)
NUMBER         = digit , { digit } , [ "." , { digit } ] ;
STRING         = '"' , { string_char } , '"' ;
BOOLEAN        = "true" | "false" ;
NULL           = "null" ;

(* Identifiers and Keywords *)
IDENTIFIER     = letter , { letter | digit | "_" } ;
KEYWORD        = "if" | "elif" | "else" | "true" | "false" | "null" | "this" ;

(* Operators *)
ARROW          = "=>" ;
ASSIGN         = "=" ;
PLUS           = "+" ;
MINUS          = "-" ;
STAR           = "*" ;
SLASH          = "/" ;
PERCENT        = "%" ;
EQ             = "==" ;
NE             = "!=" ;
STRICT_EQ      = "===" ;
STRICT_NE      = "!==" ;
LT             = "<" ;
LE             = "<=" ;
GT             = ">" ;
GE             = ">=" ;
AND            = "&&" ;
OR             = "||" ;
NOT            = "!" ;
QUESTION       = "?" ;
COLON          = ":" ;
COMMA          = "," ;
DOT            = "." ;
SEMICOLON      = ";" ;
LPAREN         = "(" ;
RPAREN         = ")" ;
LBRACKET       = "[" ;
RBRACKET       = "]" ;
LBRACE         = "{" ;
RBRACE         = "}" ;

(* Character Classes *)
digit          = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
letter         = "a" | ... | "z" | "A" | ... | "Z" | "_" | "$" ;
string_char    = any_char - '"' | '\"' ;
```

## Grammar Rules

### Program Structure

```ebnf
Program        = "{" , [ member_list ] , "}" ;

member_list    = member , { separator , member } , [ separator ] ;

member         = FunctionDef | PropertyDef ;

separator      = NEWLINE | SEMICOLON ;

FunctionDef    = IDENTIFIER , "(" , [ param_list ] , ")" , block ;

PropertyDef    = IDENTIFIER , ":" , expression ;

param_list     = IDENTIFIER , { "," , IDENTIFIER } ;

block          = "{" , [ statement_list ] , "}" ;

statement_list = statement , { separator , statement } , [ separator ] ;
```

### Statements

```ebnf
statement      = if_statement | for_statement | expression_statement ;

if_statement   = "if" , "(" , expression , ")" , block ,
                 { "elif" , "(" , expression , ")" , block } ,
                 [ "else" , block ] ;

(* For statement: two forms *)
(* 1. Three-part: for init; cond; update { body } *)
(* 2. Condition-only: for cond { body } - like while *)
for_statement  = "for" , ( for_three_part | for_condition_only ) , block ;

for_three_part = for_init , ";" , expression , ";" , expression ;

for_condition_only = expression ;

for_init       = assignment | expression ;

expression_statement = expression ;
```

#### For Statement Examples

```seval
// Three-part for loop
for i = 0; i < 10; i = i + 1 {
  sum = sum + i
}

// Condition-only for loop (like while)
for count > 0 {
  count = count - 1
}
```

### Expressions (by precedence, lowest to highest)

```ebnf
expression     = arrow_function | assignment ;

(* Arrow function: x => expr, (x, y) => expr *)
arrow_function = arrow_params , "=>" , expression ;

arrow_params   = IDENTIFIER                              (* x => ... *)
               | "(" , [ param_list ] , ")" ;            (* (x, y) => ... *)

(* Assignment: x = value, obj.prop = value *)
assignment     = conditional , [ "=" , expression ] ;

(* Ternary: cond ? a : b *)
conditional    = logical_or , [ "?" , expression , ":" , expression ] ;

(* Logical OR: a || b *)
logical_or     = logical_and , { "||" , logical_and } ;

(* Logical AND: a && b *)
logical_and    = equality , { "&&" , equality } ;

(* Equality: a == b, a != b, a === b, a !== b *)
equality       = relational , { ( "==" | "!=" | "===" | "!==" ) , relational } ;

(* Relational: a < b, a <= b, a > b, a >= b *)
relational     = additive , { ( "<" | "<=" | ">" | ">=" ) , additive } ;

(* Additive: a + b, a - b *)
additive       = multiplicative , { ( "+" | "-" ) , multiplicative } ;

(* Multiplicative: a * b, a / b, a % b *)
multiplicative = unary , { ( "*" | "/" | "%" ) , unary } ;

(* Unary: !a, -a *)
unary          = ( "!" | "-" ) , unary
               | postfix ;

(* Postfix: a.b, a[b], a(b) *)
postfix        = primary , { postfix_op } ;

postfix_op     = "." , IDENTIFIER                        (* Member access *)
               | "[" , expression , "]"                  (* Index access *)
               | "(" , [ arg_list ] , ")" ;              (* Function call *)

arg_list       = expression , { "," , expression } ;
```

### Primary Expressions

```ebnf
primary        = NUMBER
               | STRING
               | BOOLEAN
               | NULL
               | IDENTIFIER
               | "this"
               | array_literal
               | object_literal
               | "(" , expression , ")" ;               (* Grouped *)

array_literal  = "[" , [ element_list ] , "]" ;

element_list   = expression , { "," , expression } , [ "," ] ;

object_literal = "{" , [ property_list ] , "}" ;

property_list  = property , { "," , property } , [ "," ] ;

property       = IDENTIFIER , ":" , expression ;
```

## Operator Precedence (lowest to highest)

| Level | Operators          | Associativity | Description              |
|-------|-------------------|---------------|--------------------------|
| 1     | `=>`              | Right         | Arrow function           |
| 2     | `=`               | Right         | Assignment               |
| 3     | `? :`             | Right         | Ternary conditional      |
| 4     | `\|\|`            | Left          | Logical OR               |
| 5     | `&&`              | Left          | Logical AND              |
| 6     | `==` `!=` `===` `!==` | Left     | Equality                 |
| 7     | `<` `<=` `>` `>=` | Left          | Relational               |
| 8     | `+` `-`           | Left          | Additive                 |
| 9     | `*` `/` `%`       | Left          | Multiplicative           |
| 10    | `!` `-` (unary)   | Right         | Unary                    |
| 11    | `.` `[]` `()`     | Left          | Postfix                  |

## Newline Handling

### Statement Context (inside blocks)
- Newlines act as **statement separators**
- Semicolons are optional
- Multiple newlines/semicolons are collapsed

### Expression Context (inside expressions)
- Newlines are **ignored**
- Allows multi-line expressions, arrays, objects

### Examples

```seval
{
  // Multi-statement function body
  calculate(x, y) {
    result = x + y    // newline separates statements
    result * 2        // last expression is return value
  }

  // Multi-line array (newlines ignored)
  items: [
    1,
    2,
    3
  ]

  // Multi-line function call (newlines ignored)
  process(
    arg1,
    arg2
  ) { arg1 + arg2 }
}
```

## Arrow Function Grammar Detail

Arrow functions are parsed at the **assignment level** because they have lower precedence than most operators:

```ebnf
expression     = arrow_function | assignment ;

arrow_function = simple_arrow | paren_arrow ;

simple_arrow   = IDENTIFIER , "=>" , expression ;

paren_arrow    = "(" , [ param_list ] , ")" , "=>" , expression ;
```

### Valid Arrow Function Syntax

```seval
// Single parameter (no parens)
x => x + 1

// No parameters
() => 42

// Multiple parameters
(a, b) => a + b

// As function argument
arr.filter(x => x > 0)
arr.map(item => item.value)
arr.reduce((a, b) => a + b)

// With expression body
nums.filter(n => n % 2 == 0)
```

## Reserved Words

The following identifiers are reserved:
- `if`, `elif`, `else`, `for`
- `true`, `false`, `null`
- `this`

## Built-in Primitives

Available as global functions/objects:
- **Functions**: `obj()`, `merge()`
- **Objects**: `Math`, `Array`, `Number`, `String`, `Date`
