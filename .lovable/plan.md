

# Limpar Vendas Incorretas do MEMORIMED

## Diagnóstico

As 6 vendas que aparecem no projeto MEMORIMED são **dados corrompidos** de uma sincronização anterior:

| Evidência | Valor |
|-----------|-------|
| Total de vendas | 6 (3 paid + 3 refunded) |
| Valor de todas | R$ 0,00 |
| Data de todas | 2026-02-05 12:23:28 (timestamp da sync, não da venda real) |
| Syncs recentes | Retornam 0 vendas do Guru |

### O que aconteceu

1. Uma sincronização às 12:23 importou 6 transações do Guru
2. O `convertTimestampToISO()` falhou na conversão de datas
3. A função usou `new Date().toISOString()` como fallback (hora atual)
4. Todas as vendas ficaram com a mesma data incorreta
5. Após o fix, sincronizações novas retornam 0 vendas (filtro de datas correto)

---

## Solução

Executar SQL para deletar as vendas corrompidas do projeto MEMORIMED:

```sql
DELETE FROM sales 
WHERE project_id = '7c109c12-bdc1-462a-a5c3-ad8ddd385ac5'
  AND source = 'guru'
  AND amount = 0;
```

Isso irá remover as 6 vendas incorretas (3 paid + 3 refunded).

---

## Alternativa

Se o usuário preferir manter histórico para análise, podemos:
1. Atualizar o status para `canceled` ao invés de deletar
2. Ou apenas marcar com um campo de flag

---

## Pós-Execução

Após a limpeza:
- O dashboard mostrará 0 vendas (correto)
- Futuras sincronizações não trarão vendas duplicadas

