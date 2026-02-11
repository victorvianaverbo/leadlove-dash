

## Plano: Adicionar telefone de suporte, aviso de ajuda no Meta Ads e restaurar tutorial

### 1. Telefone de suporte na pagina de vendas (Index.tsx)
- Adicionar no footer da landing page o numero de WhatsApp formatado: (31) 99161-8745
- Link clicavel para `https://wa.me/5531991618745`

### 2. Telefone de suporte dentro do app (Dashboard.tsx)
- Adicionar um link de suporte via WhatsApp no header ou footer do dashboard, visivel para usuarios logados
- Mesmo link: `https://wa.me/5531991618745`

### 3. Aviso de ajuda na configuracao do Meta Ads
- No componente `MetaAdsIntegrationCard.tsx`, adicionar um alerta/card visivel com mensagem do tipo:
  - "Teve dificuldade para configurar o Meta Ads? Chama no WhatsApp que te ajudo!"
  - Com botao/link direto para o WhatsApp: `https://wa.me/5531991618745`
- Tambem adicionar esse aviso no tutorial `MetaAdsTutorial.tsx` na secao de solucao de problemas

### 4. Restaurar tutorial do Meta Ads para fluxo "Criar App"
- Reverter o `MetaAdsTutorial.tsx` para incluir novamente as instrucoes de criacao de app no Facebook Developers / Graph API Explorer / geracao manual de token
- Manter o fluxo OAuth como opcao principal mas re-adicionar a secao legada como alternativa para quem precisar

---

### Detalhes tecnicos

**Arquivos a modificar:**

1. **`src/pages/Index.tsx`** (footer, ~linha 448-468)
   - Adicionar linha com icone de WhatsApp e numero formatado com link

2. **`src/pages/Dashboard.tsx`** (header area)
   - Adicionar link de suporte WhatsApp no cabecalho do dashboard

3. **`src/components/integrations/MetaAdsIntegrationCard.tsx`**
   - Adicionar card de aviso com link WhatsApp para ajuda na configuracao

4. **`src/components/docs/MetaAdsTutorial.tsx`**
   - Adicionar aviso de suporte WhatsApp na secao de solucao de problemas
   - Re-adicionar secoes sobre criacao de app e geracao manual de token como metodo alternativo

