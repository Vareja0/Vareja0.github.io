class ExpressionParser {
    constructor(tokens, options = {}) {
        this.tokens = tokens;
        this.position = 0;
        this.currentToken = this.tokens[this.position];
        this.errors = [];
        // Define operator precedence (higher number = higher precedence)
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

    // AST Node types
    static NODE_TYPES = {
        CONJUNCAO: "CONJUNCAO",
        DISJUNCAO: "DISJUNCAO",
        NEGACAO: "NEGACAO",
        IMPLICA: "IMPLICA",
        BI_IMPLICA: "BI_IMPLICA",
        UNIVERSAL: "UNIVERSAL",
        EXISTENCIAL: "EXISTENCIAL",
        PROPOSICAO: 'PROPOSICAO',
        VARIAVEL: 'VARIAVEL',
        PARENTHESIZED: 'PARENTHESIZED',
        PROGRAM: 'PROGRAM',
        BINARY_OP: 'BINARY_OP',
        UNARY_OP: 'UNARY_OP'
    };
    //avanca uma posicao
    next() {
        this.position++;
        if (this.position < this.tokens.length) {
            this.currentToken = this.tokens[this.position];
        }
        else {
            this.currentToken = null;
        }
    }

    //verifica se o tipo do token eh o esperado
    expect(tokenType) {
        if (!this.currentToken || this.currentToken.type !== tokenType) {
            const errorMsg = `Expected ${tokenType} but got ${this.currentToken ? this.currentToken.type : 'EOF'} at position ${this.position}`;
            throw new Error(errorMsg);

        }
        const token = this.currentToken;
        this.next();
        return token;
    }
    //lida com o erro
    reportError(message) {
        const error = {
            message: message,
            position: this.currentToken ? this.currentToken.position : this.position,
            token: this.currentToken
        };

        this.errors.push(error);
        console.error(`Parse Error: ${message}`);
        throw new Error(message);
    }

    recover() {
        while (this.currentToken &&
            this.currentToken.type !== 'COMANDO' &&
            this.currentToken.type !== 'PROPOSICAO' &&
            this.currentToken.type !== 'VARIAVEL' &&
            this.currentToken.type !== 'LPARENTESE' &&
            !this.isOperator(this.currentToken.type)) {
            this.next();
        }
    }
    // verifica se eh um operador
    isOperator(tokenType) {
        return this.precedence.hasOwnProperty(tokenType);
    }

    // parse principal
    parse() {
        const statements = [];

        while (this.currentToken) {
            try {
                let statement = this.parseExpression();

                if (statement) {
                    statements.push(statement);
                }
            } catch (error) {
                console.warn('Parse error encountered, attempting recovery:', error.message);
                this.recover();
                if (!this.currentToken) break;
            }
        }

        const ast = {
            body: statements
        };

        return ast;
    }

    parseExpression(minPrec = 0) {
        let left = this.parsePrimary();

        if (!left) {
            return null;
        }

        while (this.currentToken && this.isOperator(this.currentToken.type)) {
            const opPrec = this.precedence[this.currentToken.type];

            if (opPrec < minPrec) {
                break;
            }

            const operator = this.currentToken;
            this.next();

            const D_Assoc = operator.type === 'IMPLICA' || operator.type === 'BI_IMPLICA';
            const nextMinPrec = D_Assoc ? opPrec : opPrec + 1;

            const right = this.parseExpression(nextMinPrec);

            if (!right) {
                console.warn('Missing right operand for operator:', operator.type);
                break;
            }

            left = {
                type: ExpressionParser.NODE_TYPES.BINARY_OP,
                operator: operator.type,
                left: left,
                right: right,
                position: operator.position
            };
        }

        return left;
    }


    // Resolve expressoes (Parenteses, operadores)
    parsePrimary() {

        if (this.currentToken && this.currentToken.type === "UNIVERSAL" || this.currentToken.type === "EXISTENCIAL") {
            return this.parseQuantifier();
        }
        // Handle NEGACAO (unary operator)
        if (this.currentToken && this.currentToken.type === 'NEGACAO') {
            const notToken = this.currentToken;
            this.next();
            const operand = this.parsePrimary();

            return {
                type: ExpressionParser.NODE_TYPES.UNARY_OP,
                operator: 'NEGACAO',
                operand: operand,
                position: notToken.position
            };
        }

        // Lida com parenteses
        if (this.currentToken && this.currentToken.type === 'LPARENTESE') {
            this.next();
            let expr;

            expr = this.parseExpression();

            // Handle missing closing parenthesis gracefully
            if (this.currentToken && this.currentToken.type === 'RPARENTESE') {
                this.next();
            } else {
                console.warn('Missing closing parenthesis - continuing anyway');
            }
            return expr;
        }


        return this.parseAtom();
    }

    // Resolve variaveis etc
    parseAtom() {
        if (!this.currentToken) {
            console.warn('Unexpected end of input');
            return null;
        }

        // Handle unexpected closing parenthesis more gracefully
        if (this.currentToken.type === 'RPARENTESE') {
            console.warn('Unexpected closing parenthesis - skipping');
            this.next(); // Skip the problematic token
            if (this.currentToken) {
                return this.parseAtom(); // Try to parse the next atom
            }
            return null;
        }

        switch (this.currentToken.type) {
            case 'PROPOSICAO':
                return this.parseProposition();
            case 'VARIAVEL':
                return this.parseVariable();
            default:
                console.warn(`Unexpected token: ${this.currentToken.type} - skipping`);
                this.next(); // Skip the problematic token
                if (this.currentToken) {
                    return this.parseAtom(); // Try to parse the next atom
                }
                return null;
        }
    }

    
    parseProposition() {
        if (!this.currentToken || this.currentToken.type !== 'PROPOSICAO') {
            console.warn('Expected PROPOSICAO token but got:', this.currentToken?.type);
            return null;
        }

        const propToken = this.currentToken;
        this.next();

        return {
            type: ExpressionParser.NODE_TYPES.PROPOSICAO,
            value: propToken.value,
            variables: propToken.variables || [],
            position: propToken.position
        };
    }
    // Lidar com Quantificadores
    parseQuantifier() {
        const quantifierToken = this.currentToken;
        this.next();

        if (!this.currentToken || this.currentToken.type !== 'VARIAVEL') {
            console.warn('Expected VARIAVEL after quantifier but got:', this.currentToken?.type);
            return null;
        }

        const variable = this.currentToken;
        this.next();

        // Use quantifier precedence to limit scope - quantifiers should only bind to their immediate scope
        const quantifierPrec = this.precedence[quantifierToken.type];
        const expression = this.parseExpression(quantifierPrec + 1);

        return {
            type: quantifierToken.type,
            variable: variable.value,
            expression: expression,
            position: quantifierToken.position
        };
    }

    parseVariable() {
        if (!this.currentToken || this.currentToken.type !== 'VARIAVEL') {
            console.warn('Expected VARIAVEL token but got:', this.currentToken?.type);
            return null;
        }

        const varToken = this.currentToken;
        this.next();

        return {
            type: ExpressionParser.NODE_TYPES.VARIAVEL,
            name: varToken.value,
            position: varToken.position
        };
    }

    parseParenthesized() {
        const leftParen = this.expect('LPARENTESE');
        if (!leftParen) return null;

        const content = [];

        // Parse everything inside parentheses
        while (this.currentToken && this.currentToken.type !== 'RPARENTESE') {
            const statement = this.parseExpression();
            if (statement) {
                content.push(statement);
            }
        }

        this.expect('RPARENTESE');

        return {
            type: ExpressionParser.NODE_TYPES.PARENTHESIZED,
            content: content,
            position: leftParen.position
        };
    }

    
}