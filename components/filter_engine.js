// filter_engine.js

export function evaluate_filter(filter_string, dataset) {
	const tokens = tokenize(filter_string);
	const ast = parse(tokens);
	return evaluate(ast, dataset);
}


function tokenize(input) {
	const tokens = [];

	// [type, regex]
	const specs = [
		["NULL",     /null\b/],
		["RANGE",    /(-?\d+(?:\.\d+)?)\s*(?:[:-]|\.\.)\s*(-?\d+(?:\.\d+)?)/],
		["NUMBER",   /-?\d+(?:\.\d+)?/],
		["OPERATOR", /(==|!=|>=|<=|=|>|<)/],
		["COMMA",    /,/],
		["VARIABLE", /[A-Za-z][A-Za-z0-9_]*/],
		["LPAREN",   /\(/],
		["RPAREN",   /\)/],
		["AND",      /&&|&/],
		["OR",       /\|\||\|/],
		["NOT",      /!/]
	];

	const converter = {
		NUMBER: s => Number(s),
		OPERATOR: s => s === "=" ? "==" : s,
		VARIABLE: s => s
	};

	for (const i in specs) {
		specs[i][1] = new RegExp("^\\s*(?:" + specs[i][1].source + ")\\s*");
	}

	function match_token(str) {
		for (const [type, regex] of specs) {
			const m = str.match(regex);
			if (!m) continue;

			let token = { type };
			if (type === "RANGE") {
				token.value = [Number(m[1]), Number(m[2])];
			} else if (type in converter) {
				token.value = converter[type](m[0].trim());
			}
			return { token, rest: str.slice(m[0].length) };
		}

		throw new Error("Unexpected token at: " + str.slice(0, 10));
	}

	while (input.length > 0) {
		const result = match_token(input);
		tokens.push(result.token);
		input = result.rest;
	}

	return tokens;
}


function parse(tokens) {
	let pos = 0;

	function peek() {
		return pos < tokens.length ? tokens[pos] : null;
	}

	function expect(type) {
		const tok = peek();
		if (tok && tok.type === type) {
			pos++;
			return tok;
		}
		throw new Error("Expected token type " + type + " but found " + (tok ? tok.type : "end of input"));
	}

	function parse_literal() {
		const num = expect("NUMBER");
		return { type: "Literal", value: num.value };
	}

	function parse_range_or_literal() {
		if (peek() && peek().type === "RANGE") {
			const rangeTok = expect("RANGE");
			return { type: "Range", from: rangeTok.value[0], to: rangeTok.value[1] };
		}
		return parse_literal();
	}

	function parse_rhs_item() {
		if (peek() && peek().type === "NULL") {
			expect("NULL");
			return { type: "NullLiteral" };
		}
		return parse_range_or_literal();
	}

	function parse_rhs() {
		const items = [];
		items.push(parse_rhs_item());
		while (peek() && peek().type === "COMMA") {
			expect("COMMA");
			items.push(parse_rhs_item());
		}
		return items.length === 1 ? items[0] : { type: "List", elements: items };
	}

	function parse_comparison() {
		const v = expect("VARIABLE");
		const op = expect("OPERATOR");
		const right = parse_rhs();
		return {
			type: "ComparisonExpression",
			variable: v.value,
			operator: op.value,
			right
		};
	}

	function parse_primary() {
		if (peek() && peek().type === "LPAREN") {
			expect("LPAREN");
			const expr = parse_or();
			expect("RPAREN");
			return expr;
		}
		return parse_comparison();
	}

	function parse_not() {
		if (peek() && peek().type === "NOT") {
			expect("NOT");
			return {
				type: "UnaryExpression",
				operator: "!",
				argument: parse_not()
			};
		}
		return parse_primary();
	}

	function parse_and() {
		let left = parse_not();
		while (peek() && peek().type === "AND") {
			expect("AND");
			const right = parse_not();
			left = {
				type: "LogicalExpression",
				operator: "&&",
				left,
				right
			};
		}
		return left;
	}

	function parse_or() {
		let left = parse_and();
		while (peek() && peek().type === "OR") {
			expect("OR");
			const right = parse_and();
			left = {
				type: "LogicalExpression",
				operator: "||",
				left,
				right
			};
		}
		return left;
	}

	const ast = parse_or();

	if (pos < tokens.length) {
		throw new Error("Unexpected tokens remaining: " + tokens.slice(pos).map(a => ("value" in a) ? `${a.type}(${a.value})` : a.type).join(" "));
	}

	return ast;
}


function assert_integer(value, context) {
	if (!Number.isInteger(value)) {
		throw new Error(`Categorical variable "${context}" cannot use non-integer value: ${value}`);
	}
}


function evaluate(ast, dataset) {
	const { data, var_type } = dataset;

	// semantic check for categorical RHS
	function ensureIntegerValues(node, variable) {
		switch (node.type) {
			case "NullLiteral": return;
			case "Literal":     return assert_integer(node.value, variable);
			case "Range":       return [node.from, node.to].forEach(v => assert_integer(v, variable));
			case "List":        return node.elements.forEach(el => ensureIntegerValues(el, variable));
			default:
				throw new Error(`Unsupported RHS node type for categorical: ${node.type}`);
		}
	}

	// numeric and categorical matchers
	function matchesNumeric(x, node) {
		switch (node.type) {
			case "NullLiteral": return x === null;
			case "Literal":     return x === node.value;
			case "Range":       return x !== null && x >= node.from && x <= node.to;
			case "List":        return node.elements.some(el => matchesNumeric(x, el));
			default:
				throw new Error(`Unsupported RHS node type for numeric: ${node.type}`);
		}
	}

	function matchesCategorical(x, node) {
		switch (node.type) {
			case "NullLiteral": return x.length === 0;
			case "Literal":     return x.includes(node.value);
			case "Range":       return x.some(v => v >= node.from && v <= node.to);
			case "List":        return node.elements.some(el => matchesCategorical(x, el));
			default:
				throw new Error(`Unsupported RHS node type for categorical: ${node.type}`);
		}
	}

	// evaluate a ComparisonExpression for every row
	function evalComparison(expr) {
		const { variable, operator, right } = expr;
		if (!(variable in data)) {
			throw new Error(`Unknown variable: ${variable}`);
		}
		const col = data[variable];
		const type = var_type[variable];

		if (type === "single" || type === "multiple") {
			if (operator !== "==" && operator !== "!=") {
				throw new Error(`Operator "${operator}" not supported for categorical variable "${variable}"`);
			}
			ensureIntegerValues(right, variable);
		}

		if (operator !== "==" && operator !== "!=") {
			if (right.type !== "Literal") {
				throw new Error(`Operator "${operator}" only allowed against a single literal, not ${right.type}`);
			}
			if (right.value === null) {
				throw new Error(`Cannot compare "${variable}" to null with "${operator}"`);
			}
		}

		return col.map(cell => {
			if (operator === "==" || operator === "!=") {
				const hit = (type === "single" || type === "multiple") ? matchesCategorical(cell, right) : matchesNumeric(cell, right);
				return operator === "==" ? hit : !hit;
			}
			// non‐equality numeric only
			if (type === "numeric") {
				if (cell === null) return false;
				switch (operator) {
					case ">":  return cell >  right.value;
					case "<":  return cell <  right.value;
					case ">=": return cell >= right.value;
					case "<=": return cell <= right.value;
				}
			}
			throw new Error(`Operator "${operator}" not supported for type ${type}`);
		});
	}

	// recursive evaluator
	function evalNode(node) {
		switch (node.type) {
			case "LogicalExpression": {
				const left  = evalNode(node.left);
				const right = evalNode(node.right);
				if (node.operator === "&&") {
					return left.map((v,i) => v && right[i]);
				} else if (node.operator === "||") {
					return left.map((v,i) => v || right[i]);
				}
				throw new Error(`Unknown logical operator: ${node.operator}`);
			}

			case "UnaryExpression": {
				if (node.operator !== "!") {
					throw new Error(`Unsupported unary operator: ${node.operator}`);
				}
				const arg = evalNode(node.argument);
				return arg.map(v => !v);
			}

			case "ComparisonExpression":
				return evalComparison(node);

			default:
				throw new Error(`Unsupported AST node type: ${node.type}`);
		}
	}

	return evalNode(ast);
}
