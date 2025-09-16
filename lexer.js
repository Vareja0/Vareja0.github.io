class TokenLexer {
    constructor(input) {
        this.input = input;
        this.position = 0;
        this.current = input[this.position];
        this.tokens = [];
    }
    // Todos os tipos de tokens
    static TOKEN_TYPES = {
        LPARENTESE: "LPARENTESE",
        RPARENTESE: "RPARENTESE",
        PROPOSICAO: "PROPOSICAO",
        VARIAVEL: "VARIAVEL",
        CONJUNCAO: "CONJUNCAO",
        DISJUNCAO: "DISJUNCAO",
        NEGACAO: "NEGACAO",
        IMPLICA: "IMPLICA",
        BI_IMPLICA: "BI_IMPLICA",
        UNIVERSAL: "UNIVERSAL",
        EXISTENCIAL: "EXISTENCIAL"

    }

    //avancar uma posicao
    next() {
        this.position++;
        if (this.position < this.input.length) {
            this.current = this.input[this.position]
        }
        else {
            this.current = null;
        }
    }

    //verifica uma posicao desejada no array
    peek(offset) {
        const after = this.position + offset;
        if (after < this.input.length) {
            return this.input[after];
        }
        else {
            return null
        }
    }

    readCommand() {
        let comando = '';
        this.next();

        while (this.current && /[a-zA-Z]/.test(this.current)) {
            comando += this.current;
            this.next();
        }

        return comando;

    }


    /* talvez ocorra um erro aqui */
    readPrep() {
        let proposition = "";
        let variables = [];

        if (this.current && /[A-Z]/.test(this.current)) {
            proposition += this.current;
            this.next();
            
            while (this.current && /[a-z]/.test(this.current)) {
                proposition += this.current;
                this.next();
            }
        }

        if (this.current === "(") {
            proposition += this.current;
            this.next();

            while (this.current && this.current !== ")") {
                if (/[a-z]/.test(this.current)) {
                    variables.push(this.current);
                    proposition += this.current;
                } else if (this.current === "," || /\s/.test(this.current)) {
                    proposition += this.current;
                }
                else {
                    throw new Error("Erro na formacao da formula");
                }
                this.next();
            }

            // Add the closing parenthesis
            if (this.current === ")") {
                proposition += this.current;
                this.next();
            }
        }

        return [proposition, variables];
    }

    // Tira os espacos em branco
    skip_white_space() {
        while (this.current && /\s/.test(this.current)) {
            this.next();
        }
    }
    // funcao principal
    tokenize() {


        while (this.current) {
            if (/\s/.test(this.current)) {
                this.skip_white_space();
                continue;
            }
            //checa qual funcao chamar
            if (this.current === "\\") {
                const comando = this.readCommand();

                if (comando === "land" || comando === "wedge") {
                    this.tokens.push({
                        type: TokenLexer.TOKEN_TYPES.CONJUNCAO,
                        value: "\\" + comando,
                        position: this.position - comando.length - 1
                    })
                }
                else if (comando === "lor" || comando === "vee") {
                    this.tokens.push({
                        type: TokenLexer.TOKEN_TYPES.DISJUNCAO,
                        value: "\\" + comando,
                        position: this.position - comando.length - 1
                    })
                }
                else if (comando === "neg" || comando === "sim") {
                    this.tokens.push({
                        type: TokenLexer.TOKEN_TYPES.NEGACAO,
                        value: "\\" + comando,
                        position: this.position - comando.length - 1
                    })
                }
                else if (comando === "implies" || comando === "rightarrow") {
                    this.tokens.push({
                        type: TokenLexer.TOKEN_TYPES.IMPLICA,
                        value: "\\" + comando,
                        position: this.position - comando.length - 1
                    })
                }
                else if (comando === "iff" || comando === "leftrightarrow") {
                    this.tokens.push({
                        type: TokenLexer.TOKEN_TYPES.BI_IMPLICA,
                        value: "\\" + comando,
                        position: this.position - comando.length - 1
                    })
                }
                else if (comando === "forall") {
                    this.tokens.push({
                        type: TokenLexer.TOKEN_TYPES.UNIVERSAL,
                        value: "\\" + comando,
                        position: this.position - comando.length - 1
                    })
                }
                else if (comando === "exists") {
                    this.tokens.push({
                        type: TokenLexer.TOKEN_TYPES.EXISTENCIAL,
                        value: "\\" + comando,
                        position: this.position - comando.length - 1
                    })
                }
                else {
                    throw new Error("comando nao reconhecido");
                }
                continue;
            }
            //verifica se eh uma preposicao
            if ((this.current && /[A-Z]/.test(this.current))) {
                const proposition = this.readPrep();
                this.tokens.push({
                    type: TokenLexer.TOKEN_TYPES.PROPOSICAO,
                    value: proposition[0],
                    variables: proposition[1],
                    position: this.position - proposition.length - 1
                })
                continue;
            }

            //verifica se eh uma variavel 
            if (this.current && /[a-z]/.test(this.current)) {
                this.tokens.push({
                    type: TokenLexer.TOKEN_TYPES.VARIAVEL,
                    value: this.current,
                    position: this.position
                })
                this.next();
                continue
            }
            //verifica se eh um parenteses convexo a esquerda
            if (this.current == "(") {
                this.tokens.push({
                    type: TokenLexer.TOKEN_TYPES.LPARENTESE,
                    value: "(",
                    position: this.position
                })
                this.next();
                continue;
            }
            // verifica se eh um parenteses convexo a direita
            if (this.current == ")") {
                this.tokens.push({
                    type: TokenLexer.TOKEN_TYPES.RPARENTESE,
                    value: ")",
                    position: this.position
                })
                this.next();
                continue;
            }
           

            else {
                this.next();
            }
        }

        return this.tokens
    }

}


