import { Clock, CheckCircle2, AlertTriangle, Info, ExternalLink, Key, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function EduzzTutorial() {
  return (
    <article className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-4">Como Obter suas Credenciais da Eduzz</h1>
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
            <span>Conta ativa na Eduzz</span>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Introdução</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          A Eduzz oferece duas formas de integração: <strong>API Key</strong> (método simples) e 
          <strong> OAuth 2.0</strong> (método avançado via Console). O MetrikaPRO suporta ambos os métodos, 
          mas recomendamos o método de API Key por ser mais simples e direto.
        </p>
        <InfoCard>
          Neste tutorial, mostraremos como obter a <strong>API Key</strong> diretamente no painel Órbita da Eduzz.
        </InfoCard>
      </section>

      {/* Method Comparison */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Comparativo de Métodos</h2>
        
        <div className="overflow-x-auto mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Característica</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    API Key
                    <Badge variant="default" className="text-xs">Recomendado</Badge>
                  </div>
                </TableHead>
                <TableHead>OAuth 2.0 (Console)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Complexidade</TableCell>
                <TableCell className="text-green-600">Simples ✓</TableCell>
                <TableCell className="text-amber-600">Moderada</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Credenciais</TableCell>
                <TableCell>1 (API Key)</TableCell>
                <TableCell>2 (Client ID + Secret)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Onde obter</TableCell>
                <TableCell>Órbita → Avançado → API</TableCell>
                <TableCell>Console Eduzz</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Ideal para</TableCell>
                <TableCell>Maioria dos casos</TableCell>
                <TableCell>Integrações complexas</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Method 1: API Key */}
      <section className="pt-6 border-t">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Key className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Método 1: API Key (Recomendado)</h2>
            <p className="text-sm text-muted-foreground">Via painel Órbita</p>
          </div>
          <Badge variant="default" className="ml-auto">Recomendado</Badge>
        </div>

        {/* Step 1.1 */}
        <div className="space-y-6">
          <StepSection step={1} title="Acessar o Painel Órbita">
            <p className="text-muted-foreground mb-4">
              Acesse o painel Órbita da Eduzz através do endereço{' '}
              <a href="https://orbita.eduzz.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                orbita.eduzz.com
                <ExternalLink className="h-3 w-3" />
              </a>{' '}
              e faça login com suas credenciais.
            </p>
          </StepSection>

          {/* Step 1.2 */}
          <StepSection step={2} title="Navegar até Configurações da API">
            <p className="text-muted-foreground mb-4">
              Após fazer login:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>No menu lateral, clique em <strong>"Avançado"</strong></li>
              <li>Selecione <strong>"Configurações da API"</strong></li>
            </ol>
            <p className="text-muted-foreground">
              Ou acesse diretamente:{' '}
              <a href="https://orbita.eduzz.com/producer/config-api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                orbita.eduzz.com/producer/config-api
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </StepSection>

          {/* Step 1.3 */}
          <StepSection step={3} title="Gerar a API Key">
            <p className="text-muted-foreground mb-4">
              Na página de Configurações da API:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>Se você ainda não tem uma API Key, clique em <strong>"Gerar Nova API KEY"</strong></li>
              <li>A chave será exibida na tela <strong>apenas uma vez</strong></li>
              <li>Copie a API Key completa imediatamente</li>
              <li>Guarde em local seguro</li>
            </ol>
            <WarningCard>
              <strong>Atenção!</strong> A API Key completa é exibida apenas no momento da criação. 
              Depois, ela aparece de forma parcial (apenas a terminação). Se você perder a chave, 
              precisará gerar uma nova.
            </WarningCard>
          </StepSection>

          {/* Step 1.4 */}
          <StepSection step={4} title="Configurar no MetrikaPRO">
            <p className="text-muted-foreground mb-4">
              Com a API Key em mãos:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2">
              <li>Acesse o MetrikaPRO e vá para seu projeto</li>
              <li>Clique em <strong>"Editar"</strong></li>
              <li>Na seção <strong>"Integrações de Vendas"</strong>, expanda <strong>"Eduzz"</strong></li>
              <li>Cole a <strong>API Key</strong> no campo correspondente</li>
              <li>Clique em <strong>"Salvar Integração"</strong></li>
            </ol>
          </StepSection>
        </div>
      </section>

      {/* Method 2: OAuth 2.0 */}
      <section className="pt-6 border-t">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Método 2: OAuth 2.0 (Avançado)</h2>
            <p className="text-sm text-muted-foreground">Via Console Eduzz</p>
          </div>
        </div>

        <p className="text-muted-foreground mb-6">
          Este método é mais complexo e recomendado apenas para integrações que precisam de 
          permissões específicas (escopos como <code className="bg-muted px-1.5 py-0.5 rounded text-sm">webhook_read</code>).
        </p>

        <div className="space-y-6">
          <StepSection step={1} title="Acessar o Console Eduzz">
            <p className="text-muted-foreground mb-4">
              Acesse o Console Eduzz através do endereço{' '}
              <a href="https://console.eduzz.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                console.eduzz.com
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </StepSection>

          <StepSection step={2} title="Criar um Novo Aplicativo">
            <ol className="list-decimal list-inside text-muted-foreground space-y-2">
              <li>Clique em <strong>"Meus Aplicativos"</strong></li>
              <li>Clique em <strong>"+ Novo Aplicativo"</strong></li>
              <li>Preencha os campos:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Nome:</strong> MetrikaPRO</li>
                  <li><strong>Site:</strong> https://metrikapro.com.br</li>
                  <li><strong>Permissões:</strong> Selecione os escopos necessários</li>
                </ul>
              </li>
              <li>Clique em <strong>"Salvar"</strong></li>
            </ol>
          </StepSection>

          <StepSection step={3} title="Revelar as Credenciais">
            <ol className="list-decimal list-inside text-muted-foreground space-y-2">
              <li>Após criar o aplicativo, clique em <strong>"Revelar Credenciais"</strong></li>
              <li>Copie o <strong>Client ID</strong></li>
              <li>Copie o <strong>Client Secret</strong></li>
              <li>Guarde ambos em local seguro</li>
            </ol>
          </StepSection>
        </div>
      </section>

      {/* Security */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Boas Práticas de Segurança</h2>
        <ol className="list-decimal list-inside text-muted-foreground space-y-3">
          <li><strong>Nunca compartilhe</strong> sua API Key em locais públicos (fóruns, redes sociais, etc.)</li>
          <li><strong>Gere uma nova API Key</strong> se suspeitar que a atual foi comprometida</li>
          <li><strong>Lembre-se:</strong> Ao gerar uma nova API Key, a antiga deixa de funcionar imediatamente</li>
          <li><strong>Guarde a chave</strong> em um gerenciador de senhas ou local seguro</li>
        </ol>
      </section>

      {/* Troubleshooting */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Solução de Problemas</h2>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Erro: "API Key Inválida"</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4 space-y-1">
                <li>A API Key foi copiada incorretamente ou de forma parcial</li>
                <li>Você gerou uma nova API Key e a antiga parou de funcionar</li>
                <li>A chave expirou ou foi revogada</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Acesse <strong>Avançado → Configurações da API</strong> no Órbita</li>
                <li>Gere uma <strong>nova API Key</strong></li>
                <li>Copie a chave completa no momento da criação</li>
                <li>Atualize no MetrikaPRO</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Erro: "Sem Produtos Encontrados"</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4">
                <li>Você ainda não tem produtos publicados na Eduzz</li>
                <li>Os produtos estão em outra conta</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Verifique se você tem produtos ativos no Órbita</li>
                <li>Confirme que está usando a API Key da conta correta</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Perdi minha API Key, o que faço?</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <p className="text-sm text-muted-foreground mb-4">
                Como a API Key completa é exibida apenas uma vez, você precisará gerar uma nova:
              </p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Acesse <strong>Avançado → Configurações da API</strong> no Órbita</li>
                <li>Clique em <strong>"Gerar Nova API KEY"</strong></li>
                <li>Confirme a ação (a antiga será invalidada)</li>
                <li>Copie e guarde a nova chave imediatamente</li>
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
            <h3 className="font-semibold mb-2">A API Key expira?</h3>
            <p className="text-muted-foreground text-sm">
              Não, a API Key da Eduzz não expira automaticamente. Ela permanece válida até 
              que você gere uma nova (o que invalida a anterior).
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Posso ter mais de uma API Key?</h3>
            <p className="text-muted-foreground text-sm">
              Não, a Eduzz permite apenas uma API Key ativa por conta. Ao gerar uma nova, 
              a anterior é automaticamente invalidada.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Qual método devo escolher?</h3>
            <p className="text-muted-foreground text-sm">
              Para a maioria dos casos, o <strong>Método 1 (API Key)</strong> é suficiente e mais simples. 
              Use o Método 2 (OAuth) apenas se precisar de permissões específicas ou estiver 
              desenvolvendo integrações mais complexas.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}

// Reusable components
function StepSection({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex gap-4 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
          {step}
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <div className="ml-12">{children}</div>
    </section>
  );
}

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