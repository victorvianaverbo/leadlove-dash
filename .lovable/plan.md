
DNS está correto agora ✅

## Configuração atual (válida)

| Tipo | Nome | Valor | Status |
|---|---|---|---|
| A | @ | 185.158.133.1 | ✅ Lovable |
| A | www | 185.158.133.1 | ✅ Lovable |
| TXT | _lovable | lovable_verify=d4a0... | ✅ Verificação |
| TXT | @ | facebook-domain-verification=... | ✅ Neutro |
| TXT | @ | google-site-verification=... | ✅ Neutro |
| A | medsimple | 185.158.133.1 | 🧹 Outro projeto (pode remover) |
| TXT | _lovable.medsimple | lovable_verify=8ada... | 🧹 Outro projeto (pode remover) |

Os dois registros `medsimple` não atrapalham o `metrikapro.com.br`. Pode deixar ou apagar — escolha sua.

## Próximos passos para o site funcionar em produção

1. **Aguardar propagação DNS** (geralmente 5–30 min, raramente até 72h). Pode checar em https://dnschecker.org buscando `metrikapro.com.br` tipo A — deve retornar `185.158.133.1` em vários servidores globais.

2. **Conferir no Lovable** em **Project Settings → Domains**:
   - `metrikapro.com.br` deve estar listado
   - `www.metrikapro.com.br` deve estar listado
   - Ambos precisam aparecer com status **Active** (verde). Se estiver em "Verifying" ou "Setting up", aguarde mais alguns minutos.
   - Se algum não estiver lá, clique em **Connect Domain** e adicione.

3. **Definir um como Primary** (ex.: `metrikapro.com.br`) — o outro vai redirecionar para o primário automaticamente.

4. **Forçar o deploy do frontend** com as correções de auth:
   - Clicar em **Publish → Update** no canto superior direito do Lovable.
   - Sem isso, o domínio continua servindo a build antiga, mesmo com DNS certo.

5. **Testar:**
   - Acessar `https://metrikapro.com.br` em aba anônima
   - Hard refresh (Ctrl+Shift+R)
   - Tentar login → deve estabilizar e abrir o dashboard normalmente

## Se após publicar ainda não funcionar

Possíveis causas a investigar:
- Cache do navegador (testar em aba anônima ou outro navegador)
- Domínio ainda em "Verifying" no Lovable (esperar SSL ser emitido)
- Algum service worker antigo cacheado (limpar dados do site no DevTools → Application → Storage → Clear site data)

Me avise o que aparece no painel **Settings → Domains** depois da propagação e eu sigo a partir daí.
