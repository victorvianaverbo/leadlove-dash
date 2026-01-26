import { Clock, CheckCircle2, AlertTriangle, Info, ExternalLink, Key, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function GuruTutorial() {
  return (
    <article className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-4">Como Obter suas Credenciais da Guru</h1>
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
            <span>Conta ativa na Guru</span>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Introdução</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          A Digital Manager Guru (Guru DMG) utiliza autenticação <strong>Basic Auth</strong> para suas integrações. 
          O MetrikaPRO precisa da sua <strong>API Key</strong> e do <strong>Access Token</strong> para sincronizar 
          automaticamente suas vendas e dados de produtos.
        </p>
        <InfoCard>
          Você precisará de 2 credenciais: <strong>API Key</strong> (senha) e <strong>Access Token</strong> (identificador do administrador).
        </InfoCard>
      </section>

      {/* Step 1 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            1
          </div>
          <h2 className="text-xl font-semibold">Acessar a Plataforma Guru</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Acesse a plataforma Digital Manager Guru através do endereço{' '}
            <a href="https://digitalmanager.guru" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              digitalmanager.guru
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
          <h2 className="text-xl font-semibold">Acessar Credenciais da API</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Após fazer login, navegue até a seção de credenciais:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>No menu lateral, clique em <strong>"Configurações"</strong> (ícone de engrenagem)</li>
            <li>Selecione <strong>"API"</strong> ou <strong>"Credenciais API"</strong></li>
          </ol>
          <TipCard>
            Se você não encontrar a opção "API" no menu, verifique se sua conta tem permissões de administrador.
          </TipCard>
        </div>
      </section>

      {/* Step 3 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            3
          </div>
          <h2 className="text-xl font-semibold">Copiar a API Key</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Na página de Credenciais API, você verá a <strong>API Key</strong> da sua conta:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>Localize o campo <strong>"API Key"</strong></li>
            <li>Clique no botão <strong>"Copiar"</strong> ao lado do campo</li>
            <li>Guarde a API Key em local seguro</li>
          </ol>
          
          <div className="overflow-x-auto mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">API Key</TableCell>
                  <TableCell>Chave secreta da sua conta</TableCell>
                  <TableCell>Funciona como "senha" na autenticação Basic</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Step 4 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            4
          </div>
          <h2 className="text-xl font-semibold">Gerar o Access Token</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            O Access Token identifica qual administrador está fazendo as requisições:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>Na mesma página de Credenciais API, localize a seção de <strong>"Access Token"</strong></li>
            <li>Selecione um <strong>administrador</strong> no dropdown (geralmente você mesmo)</li>
            <li>O Access Token será gerado e exibido na tela</li>
            <li>Clique em <strong>"Copiar"</strong> para copiar o token</li>
          </ol>

          <div className="overflow-x-auto mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Access Token</TableCell>
                  <TableCell>Identificador do administrador</TableCell>
                  <TableCell>Funciona como "usuário" na autenticação Basic</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <ImportantCard>
            <strong>Guarde o Access Token em local seguro!</strong> Essa é uma informação sensível. 
            Evite compartilhar com terceiros.
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
            <li>Na seção <strong>"Integrações de Vendas"</strong>, expanda <strong>"Guru (DMG)"</strong></li>
            <li>Cole a <strong>API Key</strong> no campo correspondente</li>
            <li>Cole o <strong>Access Token</strong> no campo correspondente</li>
            <li>Clique em <strong>"Salvar Integração"</strong></li>
          </ol>
        </div>
      </section>

      {/* How It Works */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Como Funciona a Autenticação</h2>
        <p className="text-muted-foreground mb-4">
          O MetrikaPRO utiliza a autenticação Basic Auth da Guru da seguinte forma:
        </p>
        <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
          <li><strong>Usuário:</strong> Access Token (ID do Administrador)</li>
          <li><strong>Senha:</strong> API Key</li>
          <li>As credenciais são codificadas em Base64</li>
          <li>Enviadas no header <code className="bg-muted px-1.5 py-0.5 rounded text-sm">Authorization: Basic [base64]</code></li>
        </ol>
        <TipCard>
          O MetrikaPRO faz toda essa codificação automaticamente. 
          Você só precisa inserir as credenciais nos campos correspondentes!
        </TipCard>
      </section>

      {/* Security */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Boas Práticas de Segurança</h2>
        <ol className="list-decimal list-inside text-muted-foreground space-y-3">
          <li><strong>Nunca compartilhe</strong> sua API Key ou Access Token em locais públicos</li>
          <li><strong>Evite enviar</strong> as credenciais por e-mail ou mensagens não criptografadas</li>
          <li><strong>Regenere as credenciais</strong> periodicamente para maior segurança</li>
          <li><strong>Revogue tokens antigos</strong> que não estão mais em uso</li>
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
                <li>A API Key ou Access Token foi copiada incorretamente</li>
                <li>As credenciais foram regeneradas no painel da Guru</li>
                <li>O administrador selecionado não tem permissões adequadas</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Acesse novamente a página de Credenciais API da Guru</li>
                <li>Copie as credenciais novamente (sem espaços)</li>
                <li>Atualize no MetrikaPRO</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Erro: "Sem Permissão"</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4">
                <li>Sua conta não tem permissão de administrador</li>
                <li>O Access Token foi gerado para outro administrador</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Verifique se você está logado como administrador</li>
                <li>Gere um novo Access Token selecionando seu próprio usuário</li>
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
              Não, as credenciais da Guru não expiram automaticamente. No entanto, você pode 
              regenerá-las a qualquer momento no painel da plataforma.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Posso usar o mesmo Access Token em vários projetos?</h3>
            <p className="text-muted-foreground text-sm">
              Sim, você pode usar as mesmas credenciais em múltiplos projetos do MetrikaPRO.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">O que acontece se eu regenerar a API Key?</h3>
            <p className="text-muted-foreground text-sm">
              A API Key antiga deixará de funcionar imediatamente. Você precisará atualizar 
              a nova chave em todas as integrações que a utilizam.
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