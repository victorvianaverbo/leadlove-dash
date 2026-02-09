
# Adicionar Instrucoes do Elementor Pro ao TrackingScriptCard

## O que sera feito

Adicionar instrucoes detalhadas de instalacao via Elementor Pro no componente `TrackingScriptCard`, junto com as instrucoes ja existentes de WordPress.

## Mudanca tecnica

**Arquivo:** `src/components/tracking/TrackingScriptCard.tsx`

Adicionar um novo paragrafo na secao de instrucoes (linha 54-57) com o passo a passo do Elementor Pro:

```
📌 Elementor Pro: Va em Elementor > Codigo Personalizado > Adicionar Novo, cole o script.
   Localizacao: </body> - End | Prioridade: padrao (10) | Publicar normalmente.
```

A instrucao sera inserida entre a instrucao do WordPress e a descricao do funcionamento do script, mantendo o mesmo estilo visual (texto pequeno com emoji e negrito).
