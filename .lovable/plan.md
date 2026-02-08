
## Remover `ads_management` do scope OAuth do Meta Ads

### O que muda
O scope `ads_management` sera removido da URL de autorizacao OAuth. Apenas `ads_read` e `read_insights` permanecerao, ja que o MetrikaPRO so precisa ler dados.

### Alteracao

**Arquivo: `src/components/integrations/MetaAdsIntegrationCard.tsx`** (linha 256)
- De: `const scope = "ads_read,ads_management,read_insights";`
- Para: `const scope = "ads_read,read_insights";`

Uma unica linha. Nenhum outro arquivo precisa ser alterado.
