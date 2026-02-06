import { Clock, CheckCircle2, AlertTriangle, Info, ExternalLink, Key, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function EduzzTutorial() {
  return (
    <article className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-4">Como Obter suas Credenciais da Eduzz</h1>
        <p className="text-muted-foreground mb-6">
          Documentação Oficial MetrikaPRO • Última atualização: 06 de Fevereiro de 2026
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
        <p className="text-muted-foreground leading-relaxed">
          O MetrikaPRO utiliza a API da Eduzz para listar seus produtos e sincronizar vendas. 
          Para isso, você precisa do <strong>Client ID</strong> e do <strong>Access Token</strong> gerados no{' '}
          <strong>Console Eduzz</strong> (<code className="bg-muted px-1.5 py-0.5 rounded text-sm">console.eduzz.com</code>).
        </p>
      </section>

      {/* Method: Personal Token */}
      <section className="pt-6 border-t">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Key className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Token Pessoal do Console</h2>
            <p className="text-sm text-muted-foreground">Via Console Eduzz</p>
          </div>
          <Badge variant="default" className="ml-auto">Recomendado</Badge>
        </div>

        <div className="space-y-6">
          <StepSection step={1} title="Acessar o Console Eduzz">
            <p className="text-muted-foreground mb-4">
              Acesse o Console Eduzz através do endereço{' '}
              <a href="https://console.eduzz.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                console.eduzz.com
                <ExternalLink className="h-3 w-3" />
              </a>{' '}
              e faça login com suas credenciais da Eduzz.
            </p>
          </StepSection>

          <StepSection step={2} title="Criar um Novo Aplicativo">
            <ol className="list-decimal list-inside text-muted-foreground space-y-2">
              <li>No menu, clique em <strong>"Meus Aplicativos"</strong></li>
              <li>Clique em <strong>"+ Novo Aplicativo"</strong></li>
              <li>Preencha os campos:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Nome:</strong> MetrikaPRO</li>
                  <li><strong>Site:</strong> https://metrikapro.com.br</li>
                </ul>
              </li>
              <li>Selecione as <strong>permissões (escopos)</strong> necessárias:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-sm">myeduzz_products_read</code> — listar produtos</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-sm">myeduzz_sales_read</code> — sincronizar vendas</li>
                </ul>
              </li>
              <li>Clique em <strong>"Salvar"</strong></li>
            </ol>
          </StepSection>

          <StepSection step={3} title="Copiar Client ID e Access Token">
            <p className="text-muted-foreground mb-4">
              Após criar o aplicativo:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>Na lista de aplicativos, localize o app que você acabou de criar</li>
              <li>Clique nos <strong>três pontos (⋯)</strong> do app</li>
              <li>Clique em <strong>"Copiar Client ID"</strong> e guarde</li>
              <li>Clique em <strong>"Copiar Access Token"</strong> e guarde</li>
            </ol>
            <InfoCard>
              O Token Pessoal <strong>não expira</strong>, diferente de tokens OAuth2 temporários. 
              Ele permanece válido até que você o revogue manualmente.
            </InfoCard>
          </StepSection>

          <StepSection step={4} title="Configurar no MetrikaPRO">
            <ol className="list-decimal list-inside text-muted-foreground space-y-2">
              <li>Acesse o MetrikaPRO e vá para seu projeto</li>
              <li>Clique em <strong>"Editar"</strong></li>
              <li>Na seção <strong>"Integrações de Vendas"</strong>, expanda <strong>"Eduzz"</strong></li>
              <li>Cole o <strong>Client ID</strong> e o <strong>Access Token</strong> nos campos correspondentes</li>
              <li>Clique em <strong>"Salvar Integração"</strong></li>
            </ol>
          </StepSection>
        </div>
      </section>

      {/* Security */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Boas Práticas de Segurança</h2>
        <ol className="list-decimal list-inside text-muted-foreground space-y-3">
          <li><strong>Nunca compartilhe</strong> seu Token Pessoal em locais públicos (fóruns, redes sociais, etc.)</li>
          <li><strong>Revogue o token</strong> imediatamente se suspeitar que foi comprometido</li>
          <li><strong>Use escopos mínimos:</strong> selecione apenas as permissões necessárias ao criar o aplicativo</li>
          <li><strong>Guarde o token</strong> em um gerenciador de senhas ou local seguro</li>
        </ol>
      </section>

      {/* Troubleshooting */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Solução de Problemas</h2>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Erro: "Sem Produtos Encontrados"</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4">
                <li>O aplicativo no Console não tem o escopo <code className="bg-muted px-1 py-0.5 rounded text-xs">myeduzz_products_read</code></li>
                <li>Você ainda não tem produtos publicados na Eduzz</li>
                <li>Os produtos estão em outra conta</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Verifique os escopos do aplicativo no Console Eduzz</li>
                <li>Confirme que tem produtos ativos na Eduzz</li>
                <li>Confirme que está usando o token da conta correta</li>
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
            <h3 className="font-semibold mb-2">O Token Pessoal expira?</h3>
            <p className="text-muted-foreground text-sm">
              Não, o Token Pessoal do Console Eduzz não expira. Ele permanece válido até 
              que você o revogue manualmente no Console.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Quais escopos devo selecionar?</h3>
            <p className="text-muted-foreground text-sm">
              Para o MetrikaPRO, selecione <code className="bg-muted px-1 py-0.5 rounded text-xs">myeduzz_products_read</code> e{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">myeduzz_sales_read</code>. 
              Esses são os escopos mínimos necessários.
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

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-muted/50 border rounded-lg">
      <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
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
