// Note: script.js can only be used in code execution as it couldn't be processed for text extraction

class FormulaProcessor {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const processBtn = document.getElementById('process-btn');
        const latexInput = document.getElementById('latex-input');

        processBtn.addEventListener('click', () => this.processFormula());

        latexInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.processFormula();
            }
        });
    }

    async processFormula() {
        const input = document.getElementById('latex-input').value.trim();

        if (!input) {
            this.showError('Please enter a formula');
            return;
        }

        this.resetSteps();
        this.showLoading();

        try {
            
                const lexer = new TokenLexer(input);
                const tokens = lexer.tokenize();
                console.log(tokens);
            
            console.log(tokens);
            const parser = new ExpressionParser(tokens);
            
               const ast = parser.parse(); 
               console.log(ast);
            
                console.log(tokens);
                
            

            if (ast.body.length === 0) {
                throw new Error('No valid formula found');
            }

            const formula = ast.body[0];
            const evaluator = new Evaluator(formula);

         
            this.showStep('original-content', evaluator.toString(formula));

            await this.delay(300);
            let step1 = evaluator.eliminateImplication(formula);
            this.showStep('eliminate-impl-content', evaluator.toString(step1));

            await this.delay(300);
            let step2 = evaluator.deMorgans(step1);
            this.showStep('demorgans-content', evaluator.toString(step2));

            await this.delay(300);
            let step3 = evaluator.removeDoubleNegation(step2);
            this.showStep('double-neg-content', evaluator.toString(step3));

            await this.delay(300);
            let step4 = evaluator.padronizeVariables(step3);
            this.showStep('standardize-content', evaluator.toString(step4));

            await this.delay(300);
            let step5 = evaluator.moveQuantifiersToFront(step4);
            this.showStep('prenex-content', evaluator.toString(step5));

            await this.delay(300);
            let step6 = evaluator.skolemize(step5);
            this.showStep('skolem-content', evaluator.toString(step6));

            await this.delay(300);
            let step7 = evaluator.removeQuantifiers(step6);
            this.showStep('remove-universal-content', evaluator.toString(step7));

            await this.delay(300);
            let step8 = evaluator.toFNC(step7);
            this.showStep('fnc-content', evaluator.toString(step8));

            await this.delay(300);
            const clauses = evaluator.extractClauses(step8);
            const clauseStrings = this.formatClauses(clauses, evaluator);
            this.showStep('clauses-content', clauseStrings);

            await this.delay(300);
            const fnc = evaluator.toConjunctivePrenexForm(step5);
            this.showStep('fnc2-content', evaluator.toString(fnc));

            await this.delay(300);
            const fnd = evaluator.toDisjunctivePrenexForm(step5);
            this.showStep('fnd-content', evaluator.toString(fnd));

            await this.delay(300);
            const horn = this.formatHornClauses(step8, evaluator);
            this.showStep('horn-content', horn)
            


            this.hideLoading();

        } catch (error) {
            console.error('Processing error:', error);
            this.showError(`Error processing formula: ${error.message}`);
            this.hideLoading();
        }
    }

    formatHornClauses(step8, evaluator) {
        
        const hornResults = evaluator.verifyHornClauses(step8);

        if (hornResults.totalClauses === 0) {
            return 'No clauses found for Horn analysis';
        }
    
        return hornResults.map((clause, index) => {
            return `Clausula \\hspace{0.1cm} ${index + 1}: ${clause.clause} \\\\
        É \\hspace{0.1cm} Horn: ${clause.isHorn} \\\\
            Tipo: ${clause.type} \\\\`;
        }).join('\\hspace{5mm} \\\\');

    
    }


    formatClauses(clauses, evaluator) {
        if (clauses.length === 0) {
            return 'No clauses found';
        }

        return clauses.map((clause, index) => {
            const clauseStr = evaluator.toString(clause);
            return `Clausula \\hspace{0.1cm} ${index + 1}: ${clauseStr} \\\\`;
        }).join('');
    }

    showStep(elementId, content) {
        const element = document.getElementById(elementId);
        const stepBlock = element.closest('.step-block');

        katex.render(content, element, {
            throwOnError: false
        })

        stepBlock.classList.add('active');

        stepBlock.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    showError(message) {
        const originalContent = document.getElementById('original-content');
        originalContent.textContent = `Error: ${message}`;
        originalContent.closest('.step-block').classList.add('error');
    }

    showLoading() {
        const stepBlocks = document.querySelectorAll('.step-block');
        stepBlocks.forEach(block => {
            block.classList.add('loading');
        });
    }

    hideLoading() {
        const stepBlocks = document.querySelectorAll('.step-block');
        stepBlocks.forEach(block => {
            block.classList.remove('loading');
        });
    }

    resetSteps() {
        const stepBlocks = document.querySelectorAll('.step-block');
        const stepContents = document.querySelectorAll('.step-content');

        stepBlocks.forEach(block => {
            block.classList.remove('active', 'error', 'success', 'loading');
        });

        stepContents.forEach(content => {
            if (content.id !== 'original-content') {
                content.textContent = '';
            }
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FormulaProcessor();
});

