

# Plano: Atualizar Landing Page - Nova Copy, Ícones de IA e Dobra do Dashboard

## Resumo das Mudanças

1. **Nova copy do hero** - Foco na transformação e nas 3 ações prioritárias
2. **Ícones mais "IA"** - Trocar ícones genéricos por ícones que remetem a inteligência artificial
3. **Nova dobra do Dashboard** - Seção destacando o dashboard em tempo real

---

## 1. Nova Copy do Hero

### Headline Principal
**Antes:** "Sua IA analista de performance 24/7"

**Depois:** "O sistema de IA que analisa seu funil enquanto você dorme"

### Subtítulo
**Antes:** "Dashboard com ROAS em tempo real + análises diárias com IA..."

**Depois:** "De 'não sei onde está o problema' para 'sei exatamente o que fazer' em 5 minutos. A IA escaneia 100% do seu funil, compara com benchmarks do seu nicho e entrega as 3 ações prioritárias para aumentar seu ROAS hoje."

---

## 2. Novos Ícones com Cara de IA

| Local | Icone Atual | Novo Icone | Conceito |
|-------|-------------|------------|----------|
| Features - Card 1 | `Sparkles` | `ScanSearch` | IA escaneando/analisando |
| Features - Card 2 | `LineChart` | `Target` | Foco nos resultados |
| Features - Card 3 | `Users` | `Share2` | Compartilhamento |
| How AI Works - Badge | `Brain` | `BrainCircuit` | Cerebro com circuitos |
| Social Proof | `Zap` | `Cpu` | Processamento automatico |

---

## 3. Nova Dobra: Dashboard em Tempo Real

### Posicionamento
Inserir **entre a seção Features e a seção "Como Funciona a IA"**

### Estrutura da Seção

```text
+----------------------------------------------------------+
|                    DASHBOARD EM TEMPO REAL               |
|                                                          |
|  "Veja seu ROAS atualizado a cada minuto"               |
|  "Chega de esperar relatórios mensais..."               |
|                                                          |
|  +----------------+  +----------------+  +---------------+
|  | Faturamento    |  | Investimento   |  | ROAS         |
|  | Em tempo real  |  | Meta Ads sync  |  | Automatico   |
|  +----------------+  +----------------+  +---------------+
|                                                          |
|  +----------------+  +----------------+  +---------------+
|  | Vendas         |  | CPA            |  | Dashboard    |
|  | Por plataforma |  | Calculado      |  | Publico      |
|  +----------------+  +----------------+  +---------------+
|                                                          |
+----------------------------------------------------------+
```

### Copy da Nova Dobra

**Badge:** "Dashboard em Tempo Real"
**Titulo:** "Acompanhe seus resultados minuto a minuto"
**Subtitulo:** "Chega de esperar relatorios mensais ou calcular ROAS na planilha. Todas as metricas que importam, atualizadas automaticamente."

**6 Metricas Destacadas (grid 3x2 ou 2x3):**

| Metrica | Descricao |
|---------|-----------|
| Faturamento | Vendas de todas as plataformas somadas em tempo real |
| Investimento | Gastos do Meta Ads sincronizados automaticamente |
| ROAS | Calculado automaticamente: faturamento / investimento |
| Vendas | Total de vendas por periodo, com detalhamento por dia |
| CPA | Custo por aquisicao calculado sem planilhas |
| Dashboard Publico | Compartilhe resultados com clientes via link |

---

## Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|------------|
| `src/pages/Index.tsx` | Nova copy hero + troca de icones + nova secao Dashboard |

---

## Ordem Final das Secoes

1. Header
2. Hero (nova copy)
3. Features - "Por que usar o MetrikaPRO?" (novos icones)
4. **Dashboard - "Acompanhe seus resultados minuto a minuto"** (NOVA)
5. How AI Works - "Como Funciona a IA" (novos icones)
6. Pricing
7. Footer

