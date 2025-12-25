# MiniJS Syntax Specification

MiniJS is a JavaScript-like DSL designed to be embedded in JSON configurations and evaluated using the seval runtime.

## Literals

### Numbers

```javascript
42 // Integer
3.14 // Floating point
-5 // Negative numbers
```

### Strings

```javascript
"hello" // Double-quoted strings
"world" // Single-quoted strings
```

**Escape sequences:**

- `\n` - newline
- `\t` - tab
- `\\` - backslash
- `\"` - double quote
- `\'` - single quote

### Booleans

```javascript
true
false
```

### Null

```javascript
null
```

### Arrays

```javascript
[]                    // Empty array
[1, 2, 3]            // Array with elements
["a", "b"]           // String array
[1, "two", true]     // Mixed types
```

## Operators

### Arithmetic

| Operator | Description    | S-expr    |
| -------- | -------------- | --------- |
| `a + b`  | Addition       | `(+ a b)` |
| `a - b`  | Subtraction    | `(- a b)` |
| `a * b`  | Multiplication | `(* a b)` |
| `a / b`  | Division       | `(/ a b)` |
| `a % b`  | Modulo         | `(% a b)` |
| `-a`     | Unary minus    | `(- 0 a)` |

### Comparison

| Operator | Description      | S-expr     |
| -------- | ---------------- | ---------- |
| `a == b` | Equality         | `(= a b)`  |
| `a != b` | Inequality       | `(!= a b)` |
| `a < b`  | Less than        | `(< a b)`  |
| `a > b`  | Greater than     | `(> a b)`  |
| `a <= b` | Less or equal    | `(<= a b)` |
| `a >= b` | Greater or equal | `(>= a b)` |

### Logical

| Operator   | Description | S-expr      |
| ---------- | ----------- | ----------- |
| `a && b`   | Logical AND | `(and a b)` |
| `a \|\| b` | Logical OR  | `(or a b)`  |
| `!a`       | Logical NOT | `(not a)`   |

### Ternary Conditional

```javascript
condition ? valueIfTrue : valueIfFalse
```

Compiles to: `(if condition valueIfTrue valueIfFalse)`

## Operator Precedence (highest to lowest)

1. Unary operators: `!`, `-` (prefix)
2. Multiplicative: `*`, `/`, `%`
3. Additive: `+`, `-`
4. Comparison: `<`, `>`, `<=`, `>=`
5. Equality: `==`, `!=`
6. Logical AND: `&&`
7. Logical OR: `||`
8. Ternary: `?:`

Parentheses can be used to override precedence: `(1 + 2) * 3`

## Functions

### Arrow Functions

```javascript
// Single parameter (no parentheses needed)
x => x * 2

// Multiple parameters
(a, b) => a + b

// No parameters
() => 42

// With expression body
(x, y) => x > y ? x : y
```

Arrow functions compile to `(lambda (params...) body)`.

### Function Calls

```javascript
// Simple call
add(1, 2)

// Nested calls
max(abs(x), abs(y))

// Chained calls
map(filter(list, predicate), transform)
```

## Object Literals with Method Definitions

Object literals are used to define multiple functions at once:

```javascript
{
  // Method definition (short syntax)
  add(a, b) { a + b },

  // Method with multi-line body
  calculate(op, a, b) {
    result = op == "+" ? a + b : a - b
    result * 2
  },

  // Method with no parameters
  greeting() { "Hello, World!" },

  // Property definition (value)
  version: 1
}
```

### Multi-line Function Bodies

Function bodies support multiple statements, one per line:

```javascript
{
  processData(input) {
    // First statement: assignment
    cleaned = trim(input)
    // Second statement: another assignment
    upper = toUpperCase(cleaned)
    // Last line: return value (no explicit return needed)
    length(upper)
  }
}
```

**Rules for multi-line bodies:**

- Each line is a separate statement/expression
- Statements are separated by newlines or semicolons (`;`)
- Semicolons are optional but can be used to separate multiple statements on one line
- A line continues if it ends with a binary operator (`+`, `-`, `*`, `/`, `?`, `:`, `&&`, `||`, etc.)
- The last expression is the implicit return value
- Multiple statements compile to `(progn stmt1 stmt2 ... lastExpr)`

**Assignment expressions:**

```javascript
x = value; // Compiles to: (define x value) if x is new
a = b + c; // Compiles to: (define a (+ b c))
display = "42"; // Rebinds the existing symbol `display`
```

Assignments either create a new binding (if the identifier has never been defined) or
mutate an existing binding within the current environment. This is how component
state is updated inside method bodies.

### Important Notes

- Method body uses `{ }` braces, not `=> ` arrow
- No explicit `return` keyword - last expression is returned
- Use `=` for assignment (creates local binding via `define`)
- Object compiles to: `(progn (define (method1 params) body1) (define (method2 params) body2) ...)`

## Property Access

### Dot Notation

Access object properties using dot notation:

```javascript
obj.property
obj.nested.deep.value
context.digit
```

### Bracket Notation

Access array elements or object properties with computed keys:

```javascript
arr[0]              // Array element access
arr[index]          // Dynamic array access
obj["key"]          // Object property with string key
obj[computedKey]    // Object property with computed key
```

Both dot notation and bracket notation compile to property access operations.

## Comments

```javascript
// Single line comment
1 + 2; // End of line comment
```

Multi-line comments are not supported.

## Component Objects and State

MiniJS programs are usually written as a single object literal. Properties declared with
`name: value` become object properties. To access these properties from methods, use `this`:

```javascript
{
  display: "0",
  waitingForOperand: true,
  history: "",

  action_digit(digit) {
    if this.waitingForOperand {
      this.display = str(digit)
      this.waitingForOperand = false
    } else {
      this.display = this.display + str(digit)
    }
  }
}
```

**Important:** Variables without `this` are local to the function. Use `this.property` to access
object properties. The evaluator preserves the object state between calls, so successive
invocations of `action_digit` mutate the same object properties.

## Structured Control Flow

### If / Elif / Else Blocks

```javascript
if condition {
  // statements
} elif otherCondition {
  // statements
} else {
  // fallback
}
```

Each branch is compiled to nested `(if ...)` forms. The `elif` section can appear zero or
many times, and `else` is optional.

### For Loops

MiniJS supports a compact `for init; test; update { ... }` syntax:

```javascript
sum = 0
for i = 0; i < 5; i = i + 1 {
  sum = sum + i
}
```

This expands to a recursive loop implementation. All three clauses are optional:
omit `init` or `update` by leaving the slot empty (`for (; condition; ) { ... }`), and the
test defaults to `true` when omitted.

## Complete Example

```javascript
{
  display: "0",
  memory: "0",
  operator: "",
  waitingForOperand: true,
  history: "",

  hasDecimal(s) { strContains(str(s), ".") },
  formatNum(n) { str(round(n * 1000000000) / 1000000000) },

  action_operator(op) {
    if this.operator == "" {
      this.memory = this.display
      this.operator = op
      this.waitingForOperand = true
      this.history = this.display + " " + op
    } else {
      result = calcOp(this.operator, this.memory, this.display)
      this.display = result
      this.memory = result
      this.operator = op
      this.waitingForOperand = true
      this.history = result + " " + op
    }
  }
}
```


## Differences from JavaScript

| Feature        | MiniJS                                    | JavaScript                 |
| -------------- | ----------------------------------------- | -------------------------- |
| Equality       | `==` is strict (like `===`)               | `==` is loose              |
| Logical ops    | Return boolean                            | Return operand             |
| Statements     | Expression-only                           | Has statements             |
| Variables      | No `const`/`let`/`var`, use `this` prefix | Has declarations           |
| Semicolons     | Optional (newlines separate statements)   | Optional (ASI)             |
| Object syntax  | Method shorthand + property syntax        | Full object literals       |
| Classes        | Not supported                             | Supported                  |
| Loops          | `for (init; test; update)` only           | `for`, `while`, `do`, etc. |
| Property access| Dot and bracket notation                  | Same                       |
| Functions      | Arrow functions and method definitions    | Multiple syntaxes          |

## Built-in Functions (from seval)

MiniJS code has access to all seval primitives:

### Universal Properties

All values have these properties and methods:

- `value.type` - Get type name as string
- `value.str()` - Convert to string

### Number

Number parsing:

- `Number.parse(str)` - Parse string to number

### Math

Math functions are accessed through the `Math` namespace:

- `Math.round(n)` - Round to nearest integer
- `Math.floor(n)` - Round down
- `Math.ceil(n)` - Round up
- `Math.abs(n)` - Absolute value
- `Math.min(a, b, ...)` - Minimum value
- `Math.max(a, b, ...)` - Maximum value

### String

String properties and methods:

- `s.length` - String length
- `s.substr(start, end)` - Get substring
- `s.contains(substr)` - Check if contains substring
- `s.startsWith(prefix)` - Check if starts with prefix
- `s.concat(other)` - Concatenate strings

### Array

Arrays are created using bracket syntax `[...]`:

```javascript
[]                    // Empty array
[1, 2, 3]            // Array with elements
["a", "b"]           // String array
[1, "two", true]     // Mixed types
```

Array methods:

- `arr.length` - Get array length
- `arr[index]` - Get element at index
- `arr.first()` - Get first element
- `arr.rest()` - Get all elements except first
- `arr.append(item)` - Append item (returns new array)
- `arr.prepend(item)` - Prepend item (returns new array)
- `arr.map(fn)` - Map function over array
- `arr.filter(fn)` - Filter array
- `arr.reduce(fn, init)` - Reduce array

### Object

Objects are created using brace syntax `{...}`:

```javascript
{}                           // Empty object
{ name: "Alice", age: 30 }  // Object with properties
```

Object methods:

- `obj.keys()` - Get all keys
- `obj.merge(other)` - Merge with another object (returns new object)

### Time

Time functions are accessed through the `Time` namespace:

- `Time.now()` - Current timestamp in milliseconds
