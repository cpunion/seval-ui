/**
 * Seval AST Node Types
 */

export type ASTNode =
	| NumberLiteral
	| StringLiteral
	| BooleanLiteral
	| Identifier
	| BinaryExpression
	| UnaryExpression
	| TernaryExpression
	| CallExpression
	| ArrowFunction
	| ArrayLiteral
	| ObjectLiteral
	| MemberExpression
	| AssignmentStatement
	| PropertyDef
	| FunctionDef

export interface NumberLiteral {
	kind: 'NumberLiteral'
	value: number
}

export interface StringLiteral {
	kind: 'StringLiteral'
	value: string
}

export interface BooleanLiteral {
	kind: 'BooleanLiteral'
	value: boolean
}

export interface Identifier {
	kind: 'Identifier'
	name: string
}

export interface ArrayLiteral {
	kind: 'ArrayLiteral'
	elements: ASTNode[]
}

export interface ObjectLiteral {
	kind: 'ObjectLiteral'
	properties: Array<{ key: string; value: ASTNode }>
}

export interface PropertyDef {
	kind: 'PropertyDef'
	name: string
	value: ASTNode
}

export interface FunctionDef {
	kind: 'FunctionDef'
	name: string
	params: string[]
	body: ASTNode
}

export interface CallExpression {
	kind: 'CallExpression'
	callee: ASTNode // Can be Identifier or ArrowFunction
	args: ASTNode[]
}

export interface MemberExpression {
	kind: 'MemberExpression'
	object: ASTNode
	property: string | ASTNode // string for dot notation, ASTNode for bracket notation
	computed: boolean // true for arr[0], false for obj.prop
}

export interface AssignmentStatement {
	kind: 'AssignmentStatement'
	target: Identifier | MemberExpression // variable or property
	value: ASTNode
}

export interface ArrowFunction {
	kind: 'ArrowFunction'
	params: string[]
	body: ASTNode
}

export interface BinaryExpression {
	kind: 'BinaryExpression'
	operator: string
	left: ASTNode
	right: ASTNode
}

export interface UnaryExpression {
	kind: 'UnaryExpression'
	operator: string
	operand: ASTNode
}

export interface TernaryExpression {
	kind: 'TernaryExpression'
	condition: ASTNode
	consequent: ASTNode
	alternate: ASTNode
}

export interface Program {
	kind: 'Program'
	members: Array<PropertyDef | FunctionDef>
}
