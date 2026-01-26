import { Clock, CheckCircle2, AlertTriangle, Info, ExternalLink, Key, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function HotmartTutorial() {
  return (
    <article className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-4">Como Obter suas Credenciais da Hotmart</h1>
        <p className="text-muted-foreground mb-6">
          Documentação Oficial MetrikaPRO • Última atualização: 26 de Janeiro de 2026
        </p>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>3-5 minutos</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-full">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Conta ativa na Hotmart</span>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Introdução</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          A Hotmart utiliza o protocolo <strong>OAuth 2.0</strong> para autenticação de integrações. 
          O MetrikaPRO precisa das suas credenciais de desenvolvedor para sincronizar automaticamente 
          suas vendas, comissões e dados de produtos.
        </p>
        <InfoCard>
          Você precisará obter 3 credenciais: <strong>Client ID</strong>, <strong>Client Secret</strong> e <strong>Basic Token</strong>.
        </InfoCard>
      </section>

      {/* Step 1 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            1
          </div>
          <h2 className="text-xl font-semibold">Acessar a Plataforma Hotmart</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Acesse a plataforma Hotmart através do endereço{' '}
            <a href="https://app-vlc.hotmart.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              app-vlc.hotmart.com
              <ExternalLink className="h-3 w-3" />
            </a>{' '}
            e faça login com suas credenciais.
          </p>
        </div>
      </section>

      {/* Step 2 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            2
          </div>
          <h2 className="text-xl font-semibold">Acessar Credenciais de Desenvolvedor</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Após fazer login, navegue até a seção de credenciais:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>No menu lateral, clique em <strong>"Ferramentas"</strong></li>
            <li>Selecione <strong>"Credenciais de Desenvolvedor"</strong></li>
          </ol>
          <p className="text-muted-foreground mb-4">
            Ou acesse diretamente:{' '}
            <a href="https://app-vlc.hotmart.com/tools/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              app-vlc.hotmart.com/tools/credentials
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </section>

      {/* Step 3 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            3
          </div>
          <h2 className="text-xl font-semibold">Criar Nova Credencial</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Na página de Credenciais de Desenvolvedor:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>Clique no botão <strong>"Criar Credencial"</strong></li>
            <li>Digite um nome descritivo, por exemplo: <code className="bg-muted px-1.5 py-0.5 rounded text-sm">MetrikaPRO</code></li>
            <li>Deixe o campo <strong>"Tipo"</strong> como <strong>Produção</strong> (não marque sandbox)</li>
            <li>Clique em <strong>"Confirmar"</strong></li>
          </ol>
          <WarningCard>
            Se for usar em ambiente de testes, marque a opção <strong>"sandbox"</strong>. 
            Uma vez criada, não é possível alterar o tipo da credencial.
          </WarningCard>
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
            Após criar a credencial, a Hotmart exibirá 3 informações importantes:
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
                  <TableCell>Identificador único do seu app</TableCell>
                  <TableCell><code className="bg-muted px-1.5 py-0.5 rounded text-xs">abc123def456...</code></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Client Secret</TableCell>
                  <TableCell>Chave secreta para autenticação</TableCell>
                  <TableCell><code className="bg-muted px-1.5 py-0.5 rounded text-xs">xyz789ghi012...</code></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Basic Token</TableCell>
                  <TableCell>Token pré-codificado em Base64</TableCell>
                  <TableCell><code className="bg-muted px-1.5 py-0.5 rounded text-xs">dXNlcm5hbWU6...</code></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <ImportantCard>
            <strong>Copie e guarde as 3 credenciais em local seguro!</strong> O Client Secret e o Basic Token 
            são exibidos apenas uma vez. Se você perdê-los, precisará criar novas credenciais.
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
            Com as credenciais em mãos, configure no MetrikaPRO:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2">
            <li>Acesse o MetrikaPRO e vá para seu projeto</li>
            <li>Clique em <strong>"Editar"</strong></li>
            <li>Na seção <strong>"Integrações de Vendas"</strong>, expanda <strong>"Hotmart"</strong></li>
            <li>Cole o <strong>Client ID</strong> no campo correspondente</li>
            <li>Cole o <strong>Client Secret</strong> no campo correspondente</li>
            <li>Cole o <strong>Basic Token</strong> no campo correspondente</li>
            <li>Clique em <strong>"Salvar Integração"</strong></li>
          </ol>
        </div>
      </section>

      {/* How It Works */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Como Funciona a Autenticação</h2>
        <p className="text-muted-foreground mb-4">
          O MetrikaPRO utiliza o fluxo OAuth 2.0 da Hotmart da seguinte forma:
        </p>
        <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
          <li>Envia uma requisição <code className="bg-muted px-1.5 py-0.5 rounded text-sm">POST</code> para o endpoint de autenticação</li>
          <li>Usa o Basic Token no header <code className="bg-muted px-1.5 py-0.5 rounded text-sm">Authorization</code></li>
          <li>Recebe um <code className="bg-muted px-1.5 py-0.5 rounded text-sm">access_token</code> válido para consultas</li>
          <li>Renova o token automaticamente quando necessário</li>
        </ol>
        <TipCard>
          O MetrikaPRO gerencia automaticamente a renovação de tokens. 
          Você só precisa configurar as credenciais uma vez!
        </TipCard>
      </section>

      {/* Security */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Boas Práticas de Segurança</h2>
        <ol className="list-decimal list-inside text-muted-foreground space-y-3">
          <li><strong>Nunca compartilhe</strong> suas credenciais em locais públicos ou com terceiros</li>
          <li><strong>Use credenciais separadas</strong> para cada integração (uma para MetrikaPRO, outra para outros serviços)</li>
          <li><strong>Revogue credenciais antigas</strong> que não estão mais em uso</li>
          <li><strong>Monitore o uso</strong> das suas credenciais no painel da Hotmart</li>
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
                <li>A credencial foi revogada no painel da Hotmart</li>
                <li>Você está usando credenciais de sandbox em ambiente de produção</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Verifique se as credenciais foram copiadas corretamente (sem espaços)</li>
                <li>Confirme que a credencial está ativa no painel da Hotmart</li>
                <li>Se necessário, crie uma nova credencial</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Erro: "Nenhum Produto Encontrado"</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4">
                <li>Você ainda não tem produtos cadastrados na Hotmart</li>
                <li>A conta utilizada não tem permissão para acessar os produtos</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Verifique se você tem produtos publicados na Hotmart</li>
                <li>Confirme que está usando a conta correta</li>
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
              Não, as credenciais (Client ID, Client Secret e Basic Token) não expiram. 
              O MetrikaPRO gera e renova automaticamente o access_token quando necessário.
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
            <h3 className="font-semibold mb-2">Como revogar uma credencial?</h3>
            <p className="text-muted-foreground text-sm">
              Acesse <strong>Ferramentas → Credenciais de Desenvolvedor</strong>, localize a credencial 
              e clique em <strong>"Excluir"</strong>. Lembre-se de atualizar as integrações que a utilizam.
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