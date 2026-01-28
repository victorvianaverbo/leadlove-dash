
# Adicionar URLs de Privacy/Terms no Meta Ads + Botão "Ver Tutorial"

## Objetivo

Inserir as URLs de **Privacy Policy** e **Terms of Service** em dois lugares:
1. Na documentação do Meta Ads (tutorial)
2. No card de integração Meta Ads (página de edição de projeto)

Também adicionar um botão "Ver Tutorial" no card de integração que leva para a documentação.

## URLs a serem usadas

| Página | URL Publicada |
|--------|---------------|
| Privacy Policy | `https://leadlove-dash.lovable.app/privacy` |
| Terms of Service | `https://leadlove-dash.lovable.app/terms` |

## Alterações

### 1. MetaAdsTutorial.tsx - Adicionar seção de URLs para App Meta

Adicionar uma nova seção após o Step 2 (Criar ou Selecionar um App) com as URLs necessárias para configurar o app no Meta Developers:

```text
+-------------------------------------------+
| 📋 URLs para Configuração do App Meta     |
|                                           |
| Ao criar seu app no Meta Developers,      |
| você precisará informar estas URLs:       |
|                                           |
| Privacy Policy URL:                       |
| [https://leadlove-dash.lovable.app/privacy] 📋
|                                           |
| Terms of Service URL:                     |
| [https://leadlove-dash.lovable.app/terms] 📋
|                                           |
| (Botões para copiar cada URL)             |
+-------------------------------------------+
```

### 2. MetaAdsIntegrationCard.tsx - Adicionar helper box + botão tutorial

Adicionar no topo do card (antes do formulário de credenciais):

```text
+-------------------------------------------+
| 📖 Precisa de ajuda para conectar?        |
|                                           |
| [Ver Tutorial Completo] →                 |
|                                           |
| URLs para configurar seu App Meta:        |
| Privacy: leadlove-dash.lovable.app/privacy|
| Terms: leadlove-dash.lovable.app/terms    |
+-------------------------------------------+
```

## Arquivos a Modificar

### `src/components/docs/MetaAdsTutorial.tsx`
- Adicionar nova seção "URLs para Configuração" entre Step 2 e Step 3
- Criar componente de card com botões de copiar para cada URL
- Importar ícone `Copy` do lucide-react

### `src/components/integrations/MetaAdsIntegrationCard.tsx`
- Importar `Link` do react-router-dom e ícone `BookOpen` do lucide-react
- Adicionar box informativo no início do `CollapsibleContent`
- Incluir botão "Ver Tutorial" que navega para `/documentacao` com hash `#meta-ads`
- Mostrar URLs de Privacy/Terms com opção de copiar

## Detalhes Técnicos

### Componente de copiar URL (reutilizável)

```tsx
function CopyableUrl({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{label}:</span>
      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{url}</code>
      <Button variant="ghost" size="sm" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
```

### Navegação para documentação

O botão "Ver Tutorial" usará o react-router-dom Link para navegar internamente:

```tsx
<Link to="/documentacao?tutorial=meta-ads">
  <Button variant="outline" size="sm">
    <BookOpen className="h-4 w-4 mr-1" />
    Ver Tutorial
  </Button>
</Link>
```

## Estimativa

| Tarefa | Tempo |
|--------|-------|
| Seção de URLs no tutorial | 15 min |
| Helper box no card | 15 min |
| Botão copiar URL | 10 min |
| Testes | 5 min |
| **Total** | **~45 min** |
