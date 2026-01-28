import { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Info, ExternalLink, Key, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function MetaAdsTutorial() {
  return (
    <article className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-4">Como Configurar o Meta Ads</h1>
        <p className="text-muted-foreground mb-6">
          Documentação Oficial MetrikaPRO • Última atualização: 26 de Janeiro de 2026
        </p>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>5-10 minutos</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-full">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Conta no Facebook Business</span>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Introdução</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          O Access Token do Meta Ads permite que o MetrikaPRO sincronize automaticamente seus gastos com anúncios, 
          métricas de campanhas e dados de desempenho do Facebook e Instagram.
        </p>
        <InfoCard>
          <strong>O token gerado via Graph API Explorer tem validade de aproximadamente 60 dias.</strong>{' '}
          Você precisará renová-lo periodicamente para manter a sincronização funcionando.
        </InfoCard>
      </section>

      {/* Step 1 */}
      <section>
        <StepSection step={1} title="Acessar o Facebook Developers">
          <p className="text-muted-foreground mb-4">
            Acesse o portal de desenvolvedores do Facebook através do endereço{' '}
            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              developers.facebook.com
              <ExternalLink className="h-3 w-3" />
            </a>{' '}
            e faça login com sua conta do Facebook.
          </p>
        </StepSection>
      </section>

      {/* Step 2 */}
      <section>
        <StepSection step={2} title="Criar ou Selecionar um App">
          <p className="text-muted-foreground mb-4">
            Após fazer login:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>Clique em <strong>"Meus Apps"</strong> no menu superior</li>
            <li>Se já tiver um app, selecione-o. Caso contrário, clique em <strong>"Criar App"</strong></li>
            <li>Escolha o tipo <strong>"Business"</strong> ou <strong>"Nenhum"</strong></li>
            <li>Dê um nome ao app (ex: "MetrikaPRO Integration")</li>
            <li>Clique em <strong>"Criar App"</strong></li>
          </ol>
        </StepSection>

        {/* URLs for Meta App Configuration */}
        <div className="ml-12 mt-6 p-4 bg-muted/50 border border-border rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Copy className="h-4 w-4" />
            URLs para Configuração do App Meta
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ao criar seu app no Meta Developers, você precisará informar estas URLs:
          </p>
          <div className="space-y-3">
            <CopyableUrl label="Privacy Policy URL" url="https://leadlove-dash.lovable.app/privacy" />
            <CopyableUrl label="Terms of Service URL" url="https://leadlove-dash.lovable.app/terms" />
          </div>
        </div>
      </section>

      {/* Step 3 */}
      <section>
        <StepSection step={3} title="Acessar o Graph API Explorer">
          <p className="text-muted-foreground mb-4">
            O Graph API Explorer é a ferramenta oficial para gerar tokens. Acesse em:{' '}
            <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              developers.facebook.com/tools/explorer
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2">
            <li>No canto superior direito, selecione seu <strong>App</strong> no dropdown</li>
            <li>Certifique-se de que o campo "User or Page" está configurado como <strong>"User Token"</strong></li>
          </ol>
        </StepSection>
      </section>

      {/* Step 4 */}
      <section>
        <StepSection step={4} title="Gerar o Access Token">
          <p className="text-muted-foreground mb-4">
            Para gerar o token com as permissões necessárias:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>Clique em <strong>"Add a Permission"</strong></li>
            <li>Na categoria <strong>"Ads Management"</strong>, selecione:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><code className="bg-muted px-1.5 py-0.5 rounded text-sm">ads_read</code></li>
                <li><code className="bg-muted px-1.5 py-0.5 rounded text-sm">read_insights</code></li>
              </ul>
            </li>
            <li>Clique em <strong>"Generate Access Token"</strong></li>
            <li>Autorize o app quando solicitado</li>
            <li>Copie o token gerado</li>
          </ol>
          <WarningCard>
            Este token tem validade de apenas <strong>1-2 horas</strong>. Você precisa estendê-lo no próximo passo.
          </WarningCard>
        </StepSection>
      </section>

      {/* Step 5 */}
      <section>
        <StepSection step={5} title="Estender a Validade do Token">
          <p className="text-muted-foreground mb-4">
            Para estender o token para aproximadamente 60 dias:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>Acesse{' '}
              <a href="https://developers.facebook.com/tools/accesstoken" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                developers.facebook.com/tools/accesstoken
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Cole o token de curta duração no campo apropriado</li>
            <li>Clique em <strong>"Depurar"</strong> ou <strong>"Debug"</strong></li>
            <li>Procure a opção <strong>"Estender Token de Acesso"</strong> ou <strong>"Extend Access Token"</strong></li>
            <li>Copie o novo token de longa duração</li>
          </ol>
          <TipCard>
            Anote a data de validade! O token expirará em aproximadamente 60 dias e você precisará repetir este processo.
          </TipCard>
        </StepSection>
      </section>

      {/* Step 6 */}
      <section>
        <StepSection step={6} title="Configurar no MetrikaPRO">
          <p className="text-muted-foreground mb-4">
            Com o token estendido em mãos:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2">
            <li>Acesse o MetrikaPRO e vá para seu projeto</li>
            <li>Clique em <strong>"Editar"</strong></li>
            <li>Na seção <strong>"Meta Ads"</strong>, cole o token no campo <strong>"Access Token"</strong></li>
            <li>Adicione também o <strong>"Ad Account ID"</strong> (formato: <code className="bg-muted px-1.5 py-0.5 rounded text-sm">act_123456789</code>)</li>
            <li>Clique em <strong>"Salvar Integração"</strong></li>
          </ol>
        </StepSection>
      </section>

      {/* How to Find Ad Account ID */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Como Encontrar o Ad Account ID</h2>
        
        <p className="text-muted-foreground mb-4">
          O Ad Account ID é um identificador único da sua conta de anúncios. Ele começa com <code className="bg-muted px-1.5 py-0.5 rounded text-sm">act_</code>.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Método 1: Via Business Manager</h3>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>Acesse <a href="https://business.facebook.com/settings/ad-accounts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">business.facebook.com/settings/ad-accounts</a></li>
              <li>Clique na conta de anúncios desejada</li>
              <li>O ID aparece no topo da página ou na URL</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Método 2: Via Gerenciador de Anúncios</h3>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>Acesse o <a href="https://www.facebook.com/adsmanager" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Gerenciador de Anúncios</a></li>
              <li>O ID da conta aparece na URL após <code className="bg-muted px-1.5 py-0.5 rounded text-sm">act=</code></li>
              <li>Exemplo: Se a URL for <code className="bg-muted px-1.5 py-0.5 rounded text-sm">...?act=123456789</code>, seu ID é <code className="bg-muted px-1.5 py-0.5 rounded text-sm">act_123456789</code></li>
            </ol>
          </div>
        </div>
      </section>

      {/* Token Renewal Reminder */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Lembrete de Renovação</h2>
        
        <WarningCard>
          <strong>Importante:</strong> O token do Meta Ads expira em aproximadamente 60 dias. 
          Você receberá um aviso no MetrikaPRO quando o token estiver prestes a expirar. 
          Repita os passos 3-6 para gerar um novo token.
        </WarningCard>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Como saber se o token expirou?</h3>
          <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
            <li>A sincronização para de funcionar</li>
            <li>Você vê erro "Token Expirado" ou "Invalid Token" no MetrikaPRO</li>
            <li>Os dados de gastos param de ser atualizados</li>
          </ul>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Solução de Problemas</h2>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left">
              <span className="text-destructive">Erro: "Token Inválido" ou "Invalid Token"</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4 space-y-1">
                <li>O token foi copiado incorretamente (espaços extras, caracteres faltando)</li>
                <li>O token expirou (passou dos 60 dias)</li>
                <li>O token foi revogado no Facebook</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Verifique se copiou o token completo</li>
                <li>Gere um novo token seguindo os passos acima</li>
                <li>Lembre-se de estender a validade antes de usar</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left">
              <span className="text-destructive">Erro: "Permissões Insuficientes"</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4 space-y-1">
                <li>Faltam as permissões <code className="bg-muted px-1 py-0.5 rounded text-xs">ads_read</code> ou <code className="bg-muted px-1 py-0.5 rounded text-xs">read_insights</code></li>
                <li>Você não tem acesso à conta de anúncios especificada</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Gere um novo token com as permissões corretas</li>
                <li>Verifique se você tem acesso à conta de anúncios no Business Manager</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left">
              <span className="text-destructive">Erro: "Conta de Anúncios Não Encontrada"</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4 space-y-1">
                <li>O Ad Account ID foi digitado incorretamente</li>
                <li>Você não tem permissão para acessar esta conta de anúncios</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Verifique se o ID começa com <code className="bg-muted px-1 py-0.5 rounded text-xs">act_</code></li>
                <li>Confirme que você tem acesso à conta no Business Manager</li>
                <li>Tente copiar o ID diretamente da URL do Gerenciador de Anúncios</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left">
              <span className="text-destructive">Dados não estão atualizando</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4 space-y-1">
                <li>O token expirou</li>
                <li>Há um atraso no processamento de dados do Meta</li>
                <li>Você não tem campanhas ativas no período selecionado</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Clique em "Sincronizar" no MetrikaPRO para forçar atualização</li>
                <li>Verifique se o token ainda está válido</li>
                <li>Aguarde alguns minutos e tente novamente</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* FAQ */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Preciso renovar o token manualmente?</h3>
            <p className="text-muted-foreground text-sm">
              Sim, o token do Meta Ads expira em aproximadamente 60 dias. Você precisará 
              gerar um novo token e atualizá-lo no MetrikaPRO.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Posso usar o mesmo token em vários projetos?</h3>
            <p className="text-muted-foreground text-sm">
              Sim, desde que o token tenha acesso a todas as contas de anúncios que você 
              deseja monitorar. Cada projeto pode usar um Ad Account ID diferente.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">O que acontece se eu trocar a senha do Facebook?</h3>
            <p className="text-muted-foreground text-sm">
              Por segurança, o Meta pode invalidar tokens ativos quando você altera a senha. 
              Se isso acontecer, gere um novo token.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Meus dados do Meta Ads estão seguros?</h3>
            <p className="text-muted-foreground text-sm">
              Sim! O MetrikaPRO utiliza apenas permissões de leitura (<code className="bg-muted px-1 py-0.5 rounded text-xs">ads_read</code>). 
              Não temos capacidade de criar, editar ou excluir suas campanhas.
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
    <div>
      <div className="flex gap-4 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
          {step}
        </div>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="ml-12">{children}</div>
    </div>
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

function CopyableUrl({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium min-w-[140px]">{label}:</span>
      <code className="text-xs bg-background px-2 py-1.5 rounded border flex-1 truncate">{url}</code>
      <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 w-8 p-0">
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}