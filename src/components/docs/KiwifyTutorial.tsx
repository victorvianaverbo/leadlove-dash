import { Clock, CheckCircle2, AlertTriangle, Info, ShieldCheck, ExternalLink, Play, FileText, Key } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export function KiwifyTutorial() {
  const scrollToIntroduction = () => {
    const element = document.getElementById('kiwify-introduction');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <article className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-4">Como Obter suas Credenciais da Kiwify</h1>
        <p className="text-muted-foreground mb-6">
          Documentação Oficial MetrikaPRO • Última atualização: 26 de Janeiro de 2026
        </p>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>2-3 minutos</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-full">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Conta ativa na Kiwify</span>
          </div>
        </div>
      </div>

      {/* Choose How to Learn */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-primary/20">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          🎬 Escolha Como Configurar
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Video Option */}
          <Card className="border-2 border-primary/30 hover:border-primary/60 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Tutorial em Vídeo</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Assista ao passo a passo completo em vídeo (recomendado)
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Clock className="h-3 w-3" />
                    <span>~3 minutos</span>
                  </div>
                  <Button asChild className="w-full">
                    <a 
                      href="https://www.loom.com/share/cc878e7fab3e4702abfc7d22cedca34e" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Assistir Vídeo
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Option */}
          <Card className="border hover:border-muted-foreground/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Tutorial Escrito</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Leia o guia detalhado com instruções passo a passo
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <FileText className="h-3 w-3" />
                    <span>5 passos simples</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={scrollToIntroduction}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Continuar Lendo ↓
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Introduction */}
      <section id="kiwify-introduction">
        <h2 className="text-xl font-semibold mb-3">Introdução</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          A Kiwify utiliza o protocolo <strong>OAuth 2.0</strong> para autenticação de integrações. 
          O MetrikaPRO precisa das suas credenciais de desenvolvedor para sincronizar automaticamente 
          suas vendas, comissões e dados de produtos.
        </p>
        <InfoCard>
          Você precisará obter 2 credenciais: <strong>Client ID</strong> e <strong>Client Secret</strong>.
        </InfoCard>
      </section>

      {/* Step 1 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            1
          </div>
          <h2 className="text-xl font-semibold">Acessar sua Conta Kiwify</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Acesse o painel da Kiwify através do endereço{' '}
            <a href="https://dashboard.kiwify.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              dashboard.kiwify.com
              <ExternalLink className="h-3 w-3" />
            </a>{' '}
            e faça login com suas credenciais (e-mail e senha).
          </p>
          <TipCard>
            Se você esqueceu sua senha, clique em "Esqueceu a senha?" para recuperá-la.
          </TipCard>
        </div>
      </section>

      {/* Step 2 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            2
          </div>
          <h2 className="text-xl font-semibold">Navegar até a Seção de API</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Após fazer login, navegue até as configurações de API:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>No menu lateral esquerdo, clique em <strong>"Configurações"</strong></li>
            <li>Selecione <strong>"API"</strong> ou <strong>"Integrações"</strong></li>
          </ol>
          <p className="text-muted-foreground mb-4">
            Alternativamente, acesse o menu <strong>"Apps"</strong> e clique no card <strong>"API"</strong>.
          </p>
        </div>
      </section>

      {/* Step 3 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            3
          </div>
          <h2 className="text-xl font-semibold">Criar Nova Integração de API</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Na página de gerenciamento de API:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>Clique no botão <strong>"Criar Integração"</strong> ou <strong>"Nova API Key"</strong></li>
            <li>Digite um nome descritivo, por exemplo: <code className="bg-muted px-1.5 py-0.5 rounded text-sm">MetrikaPRO</code></li>
            <li>Clique em <strong>"Criar"</strong> ou <strong>"Confirmar"</strong></li>
          </ol>
        </div>
      </section>

      {/* Step 4 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            4
          </div>
          <h2 className="text-xl font-semibold">Copiar as Credenciais</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Após criar a integração, a Kiwify exibirá suas credenciais OAuth:
          </p>
          
          <div className="overflow-x-auto mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credencial</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Exemplo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Client ID</TableCell>
                  <TableCell>Identificador único da sua integração</TableCell>
                  <TableCell><code className="bg-muted px-1.5 py-0.5 rounded text-xs">be161f42-1d05-4949-8736-...</code></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Client Secret</TableCell>
                  <TableCell>Chave secreta para autenticação</TableCell>
                  <TableCell><code className="bg-muted px-1.5 py-0.5 rounded text-xs">a12b34c56d78e90f1234...</code></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <ImportantCard>
            <strong>Copie e guarde ambas as credenciais em local seguro!</strong> O Client Secret 
            pode ser exibido apenas uma vez. Se você perdê-lo, precisará gerar novas credenciais.
          </ImportantCard>
        </div>
      </section>

      {/* Step 5 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            5
          </div>
          <h2 className="text-xl font-semibold">Configurar no MetrikaPRO</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Agora que você tem suas credenciais OAuth, configure no MetrikaPRO:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2">
            <li>Acesse o MetrikaPRO e vá para seu projeto</li>
            <li>Clique em <strong>"Editar"</strong></li>
            <li>Na seção <strong>"Integrações de Vendas"</strong>, expanda <strong>"Kiwify"</strong></li>
            <li>Cole o <strong>Client ID</strong> no campo correspondente</li>
            <li>Cole o <strong>Client Secret</strong> no campo correspondente</li>
            <li>Clique em <strong>"Salvar Integração"</strong></li>
          </ol>
        </div>
      </section>

      {/* How It Works */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Como Funciona a Autenticação</h2>
        <p className="text-muted-foreground mb-4">
          O MetrikaPRO utiliza o fluxo OAuth 2.0 da Kiwify da seguinte forma:
        </p>
        <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
          <li>Envia uma requisição <code className="bg-muted px-1.5 py-0.5 rounded text-sm">POST</code> para o endpoint de autenticação</li>
          <li>Usa o Client ID e Client Secret para obter um <code className="bg-muted px-1.5 py-0.5 rounded text-sm">access_token</code></li>
          <li>O token tem validade de 24 horas e é renovado automaticamente</li>
          <li>Utiliza o token para consultar vendas, produtos e estatísticas</li>
        </ol>
        <TipCard>
          O MetrikaPRO gerencia automaticamente a renovação de tokens. 
          Você só precisa configurar as credenciais uma vez!
        </TipCard>
      </section>

      {/* Permissions */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Permissões Disponíveis</h2>
        <p className="text-muted-foreground mb-4">
          A API da Kiwify fornece acesso aos seguintes dados:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {['Estatísticas', 'Produtos', 'Eventos', 'Vendas', 'Reembolsos', 'Financeiro', 'Afiliados', 'Webhooks'].map((scope) => (
            <span key={scope} className="px-3 py-2 bg-muted rounded-lg text-sm text-center">
              {scope}
            </span>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Boas Práticas de Segurança</h2>
        <ol className="list-decimal list-inside text-muted-foreground space-y-3">
          <li><strong>Nunca compartilhe</strong> suas credenciais em locais públicos (fóruns, redes sociais, etc.)</li>
          <li><strong>Use nomes descritivos</strong> para identificar facilmente onde cada integração está sendo usada</li>
          <li><strong>Revogue credenciais antigas</strong> que não estão mais em uso</li>
          <li><strong>Crie credenciais separadas</strong> para cada integração (uma para MetrikaPRO, outra para outros serviços)</li>
        </ol>
      </section>

      {/* Troubleshooting */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Solução de Problemas</h2>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Erro: "Credenciais Inválidas"</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4 space-y-1">
                <li>O Client ID ou Client Secret foi copiado incorretamente</li>
                <li>A integração foi revogada no painel da Kiwify</li>
                <li>Espaços extras ou caracteres faltando nas credenciais</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Volte ao painel da Kiwify</li>
                <li>Verifique se a integração ainda está ativa</li>
                <li>Copie novamente as credenciais (ou crie uma nova integração)</li>
                <li>Cole no MetrikaPRO sem espaços extras</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Erro: "Nenhum Produto Encontrado"</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4">
                <li>Você ainda não tem produtos cadastrados na Kiwify</li>
                <li>Os produtos estão em modo rascunho (não publicados)</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Verifique se você tem produtos publicados na Kiwify</li>
                <li>Aguarde alguns minutos e tente sincronizar novamente</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Erro: "Token Expirado"</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possível causa:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4">
                <li>Problema temporário na renovação automática do token</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Clique em "Sincronizar" no MetrikaPRO para forçar uma nova autenticação</li>
                <li>Se persistir, verifique se as credenciais ainda são válidas na Kiwify</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">As credenciais expiram?</h3>
            <p className="text-muted-foreground text-sm">
              Não, o Client ID e Client Secret não expiram. O que expira é o access_token gerado 
              a partir deles (a cada 24 horas), mas o MetrikaPRO renova automaticamente.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Posso usar as mesmas credenciais em vários projetos?</h3>
            <p className="text-muted-foreground text-sm">
              Sim, você pode usar as mesmas credenciais em múltiplos projetos do MetrikaPRO. 
              No entanto, recomendamos criar credenciais separadas para melhor rastreabilidade.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Como revogar uma integração?</h3>
            <p className="text-muted-foreground text-sm">
              Acesse <strong>Configurações → API</strong> no painel da Kiwify, localize a integração 
              e clique em <strong>"Revogar"</strong> ou <strong>"Excluir"</strong>.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}

// Reusable components
function TipCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-800 dark:text-blue-200">{children}</p>
    </div>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-muted/50 border rounded-lg">
      <Key className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function WarningCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800 dark:text-amber-200">{children}</p>
    </div>
  );
}

function ImportantCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
      <ShieldCheck className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-800 dark:text-red-200">{children}</p>
    </div>
  );
}