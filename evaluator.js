class Evaluator {
    constructor(ast) {
        this.ast = ast;
        this.skolemCounter = 0
        this.skolemCounterFunc = 0
        this.maxRecursionDepth = 100; 

        this.precedence = {
            CONJUNCAO: 4,
            DISJUNCAO: 3,
            NEGACAO: 5,
            IMPLICA: 2,
            BI_IMPLICA: 1,
            UNIVERSAL: 6,
            EXISTENCIAL: 6
        }
    }



    toFNC(node) {
        if (!node) return node;

        const distributed = this.distributeFNC(node);

        return distributed;
    }

    toFND(node) {
        if (!node) return node;

        const distributed = this.distributeFND(node);

        return distributed;
    }

    distributeFNC(node) {
        if (!node) return node;

        if (node.type === "BINARY_OP" && node.operator === "DISJUNCAO") {
            const left = this.distributeFNC(node.left);
            const right = this.distributeFNC(node.right);

            if (right.type === "BINARY_OP" && right.operator === "CONJUNCAO") {
                return {
                    type: "BINARY_OP",
                    operator: "CONJUNCAO",
                    left: this.distributeFNC({
                        type: "BINARY_OP",
                        operator: "DISJUNCAO",
                        left: left,
                        right: right.left
                    }),
                    right: this.distributeFNC({
                        type: "BINARY_OP",
                        operator: "DISJUNCAO",
                        left: left,
                        right: right.right
                    })
                };
            }

            if (left.type === "BINARY_OP" && left.operator === "CONJUNCAO") {
                return {
                    type: "BINARY_OP",
                    operator: "CONJUNCAO",
                    left: this.distributeFNC({
                        type: "BINARY_OP",
                        operator: "DISJUNCAO",
                        left: left.left,
                        right: right
                    }),
                    right: this.distributeFNC({
                        type: "BINARY_OP",
                        operator: "DISJUNCAO",
                        left: left.right,
                        right: right
                    })
                };
            }

            return {
                type: "BINARY_OP",
                operator: "DISJUNCAO",
                left: left,
                right: right
            };
        }

        if (node.type === "BINARY_OP") {
            return {
                ...node,
                left: this.distributeFNC(node.left),
                right: this.distributeFNC(node.right)
            };
        }

        if (node.type === "UNARY_OP") {
            return {
                ...node,
                operand: this.distributeFNC(node.operand)
            };
        }

        return node;
    }

    distributeFND(node) {
        if (!node) return node;

        if (node.type === "BINARY_OP" && node.operator === "CONJUNCAO") {
            const left = this.distributeFND(node.left);
            const right = this.distributeFND(node.right);

            if (right.type === "BINARY_OP" && right.operator === "DISJUNCAO") {
                return {
                    type: "BINARY_OP",
                    operator: "DISJUNCAO",
                    left: this.distributeFND({
                        type: "BINARY_OP",
                        operator: "CONJUNCAO",
                        left: left,
                        right: right.left
                    }),
                    right: this.distributeFND({
                        type: "BINARY_OP",
                        operator: "CONJUNCAO",
                        left: left,
                        right: right.right
                    })
                };
            }

            if (left.type === "BINARY_OP" && left.operator === "DISJUNCAO") {
                return {
                    type: "BINARY_OP",
                    operator: "DISJUNCAO",
                    left: this.distributeFND({
                        type: "BINARY_OP",
                        operator: "CONJUNCAO",
                        left: left.left,
                        right: right
                    }),
                    right: this.distributeFND({
                        type: "BINARY_OP",
                        operator: "CONJUNCAO",
                        left: left.right,
                        right: right
                    })
                };
            }

            return {
                type: "BINARY_OP",
                operator: "CONJUNCAO",
                left: left,
                right: right
            };
        }

        if (node.type === "BINARY_OP") {
            return {
                ...node,
                left: this.distributeFND(node.left),
                right: this.distributeFND(node.right)
            };
        }

        if (node.type === "UNARY_OP") {
            return {
                ...node,
                operand: this.distributeFND(node.operand)
            };
        }

        return node;
    }

    collectConjuncts(node, conjuncts) {
        if (node.type === "BINARY_OP" && node.operator === "CONJUNCAO") {
            this.collectConjuncts(node.left, conjuncts);
            this.collectConjuncts(node.right, conjuncts);
        } else {
            conjuncts.push(node);
        }
    }

    collectDisjuncts(node, disjuncts) {
        if (node.type === "BINARY_OP" && node.operator === "DISJUNCAO") {
            this.collectDisjuncts(node.left, disjuncts);
            this.collectDisjuncts(node.right, disjuncts);
        } else {
            disjuncts.push(node);
        }
    }

    buildConjunction(conjuncts) {
        if (conjuncts.length === 1) {
            return conjuncts[0];
        }

        let result = conjuncts[0];
        for (let i = 1; i < conjuncts.length; i++) {
            result = {
                type: "BINARY_OP",
                operator: "CONJUNCAO",
                left: result,
                right: conjuncts[i]
            };
        }

        return result;
    }

    buildDisjunction(disjuncts) {
        if (disjuncts.length === 1) {
            return disjuncts[0];
        }

        let result = disjuncts[0];
        for (let i = 1; i < disjuncts.length; i++) {
            result = {
                type: "BINARY_OP",
                operator: "DISJUNCAO",
                left: result,
                right: disjuncts[i]
            };
        }

        return result;
    }


    toConjunctivePrenexForm(node) {

        const quantifiers = [];
        const expression = this.extractQuantifiers(node, quantifiers);

        const cnfExpression = this.toFNC(expression);

        return cnfExpression;
    }

    toDisjunctivePrenexForm(node) {

        const quantifiers = [];
        const expression = this.extractQuantifiers(node, quantifiers);

        const dnfExpression = this.toFND(expression);

        return dnfExpression;
    }


    eliminateImplication(node) {
        if (!node) return node;

        if (node.type === "UNIVERSAL" || node.type === "EXISTENCIAL") {
            return {
                type: node.type,
                variable: node.variable,
                expression: this.eliminateImplication(node.expression)
            }
        }

        if (node.type === "BINARY_OP" && node.operator === "IMPLICA") {
            return {
                type: "BINARY_OP",
                operator: "DISJUNCAO",
                left: {
                    type: "UNARY_OP",
                    operator: "NEGACAO",
                    operand: this.eliminateImplication(node.left)
                },
                right: this.eliminateImplication(node.right)
            }
        }
        if (node.type === "BINARY_OP" && node.operator === "BI_IMPLICA") {
            const leftToRight = {
                type: "BINARY_OP",
                operator: "IMPLICA",
                left: this.eliminateImplication(node.left),
                right: this.eliminateImplication(node.right)
            }
            const rightToLeft = {
                type: "BINARY_OP",
                operator: "IMPLICA",
                left: this.eliminateImplication(node.right),
                right: this.eliminateImplication(node.left)
            }
            const bicToOr = {
                type: "BINARY_OP",
                operator: "CONJUNCAO",
                left: leftToRight,
                right: rightToLeft
            }
            return this.eliminateImplication(bicToOr);
        }

        if (node.type === "BINARY_OP") {
            return {
                ...node,
                left: this.eliminateImplication(node.left),
                right: this.eliminateImplication(node.right)
            }
        }

        if (node.type === "UNARY_OP") {
            return {
                ...node,
                operand: this.eliminateImplication(node.operand)
            }
        }

        return node;
    }

    deMorgans(node) {
        if (!node) return node;

        if (node.type === "UNARY_OP" && node.operator === "NEGACAO") {
            const operador = node.operand;
            if (!operador) return node;

            if (operador.type === "BINARY_OP" && operador.operator === "CONJUNCAO") {
                return {
                    type: "BINARY_OP",
                    operator: "DISJUNCAO",
                    left: this.deMorgans({
                        type: "UNARY_OP",
                        operator: "NEGACAO",
                        operand: operador.left
                    }),
                    right: this.deMorgans({
                        type: "UNARY_OP",
                        operator: "NEGACAO",
                        operand: operador.right
                    })
                }
            }

            if (operador.type === "BINARY_OP" && operador.operator === "DISJUNCAO") {
                return {
                    type: "BINARY_OP",
                    operator: "CONJUNCAO",
                    left: this.deMorgans({
                        type: "UNARY_OP",
                        operator: "NEGACAO",
                        operand: operador.left
                    }),
                    right: this.deMorgans({
                        type: "UNARY_OP",
                        operator: "NEGACAO",
                        operand: operador.right
                    })
                }
            }

            if (operador.type === "UNARY_OP" && operador.operator === "NEGACAO") {
                return this.deMorgans(operador.operand);
            }

            if (operador.type === "UNIVERSAL") {
                return this.deMorgans({
                    type: "EXISTENCIAL",
                    variable: operador.variable,
                    expression: {
                        type: "UNARY_OP",
                        operator: "NEGACAO",
                        operand: this.deMorgans(operador.expression)
                    }
                })
            }

            if (operador.type === "EXISTENCIAL") {
                return this.deMorgans({
                    type: "UNIVERSAL",
                    variable: operador.variable,
                    expression: {
                        type: "UNARY_OP",
                        operator: "NEGACAO",
                        operand: this.deMorgans(operador.expression)
                    }
                })
            }

            return node;
        }
        if (node.type === "UNIVERSAL" || node.type === "EXISTENCIAL") {
            return {
                type: node.type,
                variable: node.variable,
                expression: this.deMorgans(node.expression)
            }
        }

        if (node.type === "BINARY_OP") {
            return {
                ...node,
                left: this.deMorgans(node.left),
                right: this.deMorgans(node.right)
            }
        }

        return node;

    }

    padronizeVariables(node, usedVaria = new Set(), counter = { count: 0 }, variableCounter = 0) {
        if (!node) return node;

        if (node.type === "UNIVERSAL" || node.type === "EXISTENCIAL") {
            const original = node.variable;
            let newVar = original;

            if (usedVaria.has(newVar)) {
                let suffix = 1;
                do {
                    newVar = original + suffix;
                    suffix++;
                } while (usedVaria.has(newVar) && suffix < 1000); // Safety limit
            }

            usedVaria.add(newVar);

            const renamedExpression = this.renameExpression(node.expression, original, newVar);
            const stardardExpression = this.padronizeVariables(renamedExpression, usedVaria, counter);

            return {
                type: node.type,
                variable: newVar,
                expression: stardardExpression
            }
        }

        if (node.type === "BINARY_OP") {
            return {
                ...node,
                left: this.padronizeVariables(node.left, usedVaria, counter),
                right: this.padronizeVariables(node.right, usedVaria, counter)
            }
        }

        if (node.type === "UNARY_OP") {
            return {
                ...node,
                operand: this.padronizeVariables(node.operand, usedVaria, counter)
            }
        }

        return node;



    }

    renameExpression(node, oldVariavel, newVar) {
        if (!node) {
            return node
        }

        if (node.type === "PROPOSICAO") {
            const newVariables = node.variables.map(v => v === oldVariavel ? newVar : v);
            return {
                ...node,
                variables: newVariables,
                value: node.value.replace(new RegExp(`\\b${oldVariavel}\\b`, 'g'), newVar)
            };
        }

        if (node.type === "VARIAVEL" && node.value === oldVariavel) {
            return {
                ...node,
                value: newVar
            };

        }

        if (node.type === "BINARY_OP") {
            return {
                ...node,
                left: this.renameExpression(node.left, oldVariavel, newVar),
                right: this.renameExpression(node.right, oldVariavel, newVar)
            };
        }

        if (node.type === "UNARY_OP") {
            return {
                ...node,
                operand: this.renameExpression(node.operand, oldVariavel, newVar)
            };
        }

        if (node.type === "UNIVERSAL" || node.type === "EXISTENCIAL") {
            if (node.variable === oldVariavel) {
                return node;
            }
            return {
                ...node,
                expression: this.renameExpression(node.expression, oldVariavel, newVar)
            };
        }

        return node;
    }


    moveQuantifiersToFront(node) {
        const quantifiers = [];
        const expression = this.extractQuantifiers(node, quantifiers);


        return this.buildPrenexForm(quantifiers, expression);
    }

    extractQuantifiers(node, quantifiers) {
        if (!node) return node;

        if (node.type === "UNIVERSAL" || node.type === "EXISTENCIAL") {

            quantifiers.push({
                type: node.type,
                variable: node.variable
            });

            return this.extractQuantifiers(node.expression, quantifiers);
        }

        if (node.type === "BINARY_OP") {
            const left = this.extractQuantifiers(node.left, quantifiers);
            const right = this.extractQuantifiers(node.right, quantifiers);

            return {
                ...node,
                left: left,
                right: right
            };
        }

        if (node.type === "UNARY_OP") {
            const operand = this.extractQuantifiers(node.operand, quantifiers);
            return {
                ...node,
                operand: operand
            };
        }

        return node;
    }

    buildPrenexForm(quantifiers, expression) {
        let result = expression;

        for (let i = quantifiers.length - 1; i >= 0; i--) {
            result = {
                type: quantifiers[i].type,
                variable: quantifiers[i].variable,
                expression: result
            };
        }

        return result;
    }


    needsParentheses(parentOperator, childNode, isRightChild = false) {
        if (!childNode || childNode.type !== 'BINARY_OP') {
            return false;
        }

        const parentPrecedence = this.precedence[parentOperator];
        const childPrecedence = this.precedence[childNode.operator];

        if (childPrecedence < parentPrecedence) {
            return true;
        }

        if (childPrecedence > parentPrecedence) {
            return true;
        }

        if (childPrecedence === parentPrecedence) {

            if (parentOperator === 'IMPLICA') {
                return !isRightChild;
            }

            if (parentOperator === 'BI_IMPLICA' || childNode.operator === 'BI_IMPLICA') {
                return parentOperator !== childNode.operator;
            }

            if (parentOperator === 'CONJUNCAO' || parentOperator === 'DISJUNCAO') {
                return true;
            }
        }

        return false;
    }

    skolemize(node) {

        this.skolemCounter = 0;

        return this.skolemizeRecursive(node, []);
    }

    skolemizeRecursive(node, universalVars) {
        if (!node) return node;

        if (node.type === "UNIVERSAL") {

            const newUniversalVars = [...universalVars, node.variable];
            return {
                type: "UNIVERSAL",
                variable: node.variable,
                expression: this.skolemizeRecursive(node.expression, newUniversalVars)
            };
        }

        if (node.type === "EXISTENCIAL") {

            const skolemTerm = this.generateSkolemTerm(node.variable, universalVars);

            const substitutedExpression = this.substituteVariable(
                node.expression,
                node.variable,
                skolemTerm
            );

            return this.skolemizeRecursive(substitutedExpression, universalVars);
        }

        if (node.type === "BINARY_OP") {
            return {
                ...node,
                left: this.skolemizeRecursive(node.left, universalVars),
                right: this.skolemizeRecursive(node.right, universalVars)
            };
        }

        if (node.type === "UNARY_OP") {
            return {
                ...node,
                operand: this.skolemizeRecursive(node.operand, universalVars)
            };
        }

        return node;
    }

    generateSkolemTerm(existentialVar, universalVars) {
        this.skolemCounter++;
        const skolemName = `c${this.skolemCounter}`;
        const skolemNameFunc = `f${this.skolemCounterFunc}`;

        if (universalVars.length === 0) {
            return {
                type: "PROPOSICAO",
                value: skolemName,
                variables: []
            };
        } else {
            this.skolemCounterFunc++;
            return {
                type: "PROPOSICAO",
                value: `${skolemNameFunc}(${universalVars.join(', ')})`,
                variables: universalVars
            };
        }
    }

    substituteVariable(node, oldVar, newTerm) {
        if (!node) return node;

        if (node.type === "VARIAVEL" && node.value === oldVar) {
            return newTerm;
        }

        if (node.type === "PROPOSICAO") {
            if (node.variables && node.variables.includes(oldVar)) {
                const newVariables = node.variables.map(v => v === oldVar ? newTerm.value : v);
                return {
                    ...node,
                    variables: newVariables,
                    value: node.value.replace(new RegExp(`\\b${oldVar}\\b`, 'g'), newTerm.value)
                };
            }
            return node;
        }

        if (node.type === "BINARY_OP") {
            return {
                ...node,
                left: this.substituteVariable(node.left, oldVar, newTerm),
                right: this.substituteVariable(node.right, oldVar, newTerm)
            };
        }

        if (node.type === "UNARY_OP") {
            return {
                ...node,
                operand: this.substituteVariable(node.operand, oldVar, newTerm)
            };
        }

        if (node.type === "UNIVERSAL" || node.type === "EXISTENCIAL") {
            if (node.variable === oldVar) {
                return node;
            }
            return {
                ...node,
                expression: this.substituteVariable(node.expression, oldVar, newTerm)
            };
        }

        return node;
    }

    removeQuantifiers(node) {
        if (!node) {
            return node;
        }

        if (node.type == "UNIVERSAL") {
            return this.removeQuantifiers(node.expression);
        }

        return node;
    }

    extractClauses(node) {
        if (!node) return [];

        if (node.type === "BINARY_OP" && node.operator === "CONJUNCAO") {
            const clauses = [];
            this.collectConjuncts(node, clauses);
            return clauses;
        }

        return [node];
    }

    collectClausesFromConjunction(node, clauses) {
        if (node.type === "BINARY_OP" && node.operator === "CONJUNCAO") {
            this.collectClausesFromConjunction(node.left, clauses);
            this.collectClausesFromConjunction(node.right, clauses);
        } else {
            clauses.push(node);
        }
    }

    isHornClause(clause) {
        if (!clause) return false;

        const literals = this.getLiteralsFromClause(clause);

        let positiveCount = 0;

        for (const literal of literals) {
            if (!this.isNegatedLiteral(literal)) {
                positiveCount++;
            }
        }

        return positiveCount <= 1;
    }

    getLiteralsFromClause(clause) {
        const literals = [];

        if (clause.type === "BINARY_OP" && clause.operator === "DISJUNCAO") {
            this.collectDisjuncts(clause, literals);
        } else {
            literals.push(clause);
        }

        return literals;
    }

    isNegatedLiteral(literal) {
        return literal.type === "UNARY_OP" && literal.operator === "NEGACAO";
    }

    verifyHornClauses(node) {
        const clauses = this.extractClauses(node);

        const results = []


        for (let i = 0; i < clauses.length; i++) {
            const clause = clauses[i];
            const isHorn = this.isHornClause(clause);
            const literals = this.getLiteralsFromClause(clause);
            const positiveCount = literals.filter(lit => !this.isNegatedLiteral(lit)).length;
            const negativeCount = literals.filter(lit => this.isNegatedLiteral(lit)).length;

            const analysis = {
                clause: this.toString(clause),
                isHorn: isHorn,
                type: this.getHornClauseType(positiveCount, negativeCount)
            };

            results.push(analysis);
        }

        return results;
    }

    getHornClauseType(positiveCount, negativeCount) {
        if (positiveCount === 0 && negativeCount > 0) {
            return "Consulta \\hspace{0.1cm}(todos \\hspace{0.1cm} os \\hspace{0.1cm} literais \\hspace{0.1cm} negativos)";
        } else if (positiveCount === 1 && negativeCount === 0) {
            return "Fato\\hspace{0.1cm} (um \\hspace{0.1cm} literal \\hspace{0.1cm} positivo)";
        } else if (positiveCount === 1 && negativeCount > 0) {
            return "Regra \\hspace{0.1cm}(um \\hspace{0.1cm} literal \\hspace{0.1cm} positivo, \\hspace{0.1cm} multiplos\\hspace{0.1cm} literais \\hspace{0.1cm} negativos)";
        } else if (positiveCount === 0 && negativeCount === 0) {
            return "Vazio";
        } else {
            return "Non-Horn \\hspace{0.1cm} (multiplos \\hspace{0.1cm} literais \\hspace{0.1cm} positivos)";
        }
    }


    toString(node = this.ast) {
        if (!node) {
            return '';
        }

        if (node == "error") {
            return "erro: A formula nao e bem formada";
        }

        if (node.type === "UNIVERSAL") {
            return `\\forall ${node.variable} ${this.toString(node.expression)}`;
        }

        if (node.type === "EXISTENCIAL") {
            return `\\exists ${node.variable} ${this.toString(node.expression)}`;
        }

        if (node.type === 'VARIAVEL') {
            return node.value;
        }

        if (node.type === 'PROPOSICAO') {
            return node.value;
        }

        if (node.type === 'UNARY_OP') {
            const operandStr = this.toString(node.operand);
            if (node.operand && node.operand.type === 'BINARY_OP') {
                return `\\neg (${operandStr})`;
            }
            return `\\neg ${operandStr}`;
        }

        if (node.type === 'BINARY_OP') {
            const leftNeedsParens = this.needsParentheses(node.operator, node.left, false);
            const rightNeedsParens = this.needsParentheses(node.operator, node.right, true);

            const leftStr = leftNeedsParens ? `(${this.toString(node.left)})` : this.toString(node.left);
            const rightStr = rightNeedsParens ? `(${this.toString(node.right)})` : this.toString(node.right);

            const op = {
                'CONJUNCAO': '\\land',
                'DISJUNCAO': '\\lor',
                'IMPLICA': '\\implies',
                'BI_IMPLICA': '\\iff'
            }[node.operator];

            return `${leftStr} ${op} ${rightStr}`;
        }

        return `[Unknown node type: ${node.type}]`;
    }

}
