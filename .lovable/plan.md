

## Simplificar documentacao Eduzz: remover mencoes ao Orbita

### Problema
O tutorial da Eduzz ainda menciona o Orbita em varios lugares (avisos, troubleshooting, FAQ), o que confunde os usuarios. O usuario quer que o tutorial mostre **apenas** o metodo do Console Eduzz, sem referencias ao Orbita.

### Alteracoes no arquivo `src/components/docs/EduzzTutorial.tsx`

1. **Remover o WarningCard** na introducao que menciona "A API Key do painel Orbita nao funciona"
2. **Remover o card de troubleshooting** "Token invalido ou expirado" que fala sobre Orbita como causa
3. **Remover a pergunta FAQ** "Posso usar a API Key do Orbita?" 
4. **Simplificar a introducao** para focar apenas no Token Pessoal do Console, sem mencionar alternativas que nao funcionam
5. Manter o tutorial limpo com apenas os 4 passos do Console Eduzz

### Resultado
Tutorial direto e limpo, mostrando apenas o caminho correto: Console Eduzz > Meus Aplicativos > Token Pessoal. Sem confusao com Orbita.

