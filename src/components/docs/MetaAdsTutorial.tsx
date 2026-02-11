import { Clock, CheckCircle2, AlertTriangle, Info, Facebook, ExternalLink } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function MetaAdsTutorial() {
  return (
    <article className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-4">Como Configurar o Meta Ads</h1>
        <p className="text-muted-foreground mb-6">
          Documentação Oficial MetrikaPRO • Última atualização: 11 de Fevereiro de 2026
        </p>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>5-10 minutos</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-full">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Conta no Facebook com anúncios</span>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Introdução</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          A integração com o Meta Ads permite que o MetrikaPRO sincronize automaticamente seus gastos com anúncios, 
          métricas de campanhas e dados de desempenho do Facebook e Instagram.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Existem duas formas de conectar:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
          <li><strong>Facebook Login (OAuth)</strong> — em breve disponível, conexão com 1 clique</li>
          <li><strong>Método Manual</strong> — crie um App no Facebook Developers, gere um token e cole no MetrikaPRO</li>
        </ul>
        <TipCard>
          O método manual é o recomendado atualmente. Siga o passo a passo abaixo para configurar.
        </TipCard>
      </section>

      {/* Manual Flow */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Método Manual (Recomendado)</h2>

        <StepSection step={1} title="Criar um App no Facebook Developers">
          <p className="text-muted-foreground mb-4">
            Acesse o <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Facebook Developers <ExternalLink className="h-3 w-3" /></a> e 
            clique em <strong>"Criar App"</strong>.
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>Selecione <strong>"Outro"</strong> como tipo de app</li>
            <li>Escolha <strong>"Empresa"</strong> como tipo</li>
            <li>Dê um nome ao app (ex: "MetrikaPRO Integração")</li>
            <li>Selecione sua conta do Business Manager</li>
            <li>Clique em <strong>"Criar App"</strong></li>
          </ol>
          <TipCard>
            Você precisa ter uma conta no Business Manager do Facebook. Se não tiver, crie em{' '}
            <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">business.facebook.com</a>.
          </TipCard>
        </StepSection>
      </section>

      <section>
        <StepSection step={2} title="Adicionar o produto Marketing API">
          <p className="text-muted-foreground mb-4">
            Dentro do seu app no Facebook Developers:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>No menu lateral, clique em <strong>"Adicionar produto"</strong></li>
            <li>Encontre <strong>"Marketing API"</strong> e clique em <strong>"Configurar"</strong></li>
          </ol>
        </StepSection>
      </section>

      <section>
        <StepSection step={3} title="Gerar o Access Token no Graph API Explorer">
          <p className="text-muted-foreground mb-4">
            Acesse o <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Graph API Explorer <ExternalLink className="h-3 w-3" /></a>.
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>No dropdown <strong>"Meta App"</strong>, selecione o app que você criou</li>
            <li>Clique em <strong>"Gerar Token de Acesso"</strong></li>
            <li>Marque as permissões: <code className="bg-muted px-1.5 py-0.5 rounded text-sm">ads_read</code> e <code className="bg-muted px-1.5 py-0.5 rounded text-sm">read_insights</code></li>
            <li>Clique em <strong>"Gerar Token"</strong> e faça login com sua conta do Facebook</li>
            <li>Copie o token gerado</li>
          </ol>
          <WarningCard>
            <strong>Atenção!</strong> O token gerado no Graph API Explorer expira em aproximadamente 1-2 horas. 
            Para um token de longa duração, use o{' '}
            <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noopener noreferrer" className="underline">Access Token Debugger</a>{' '}
            para estender ou gere um token de longa duração via API.
          </WarningCard>
        </StepSection>
      </section>

      <section>
        <StepSection step={4} title="Encontrar seu Ad Account ID">
          <p className="text-muted-foreground mb-4">
            Você precisa do ID da sua conta de anúncios. Para encontrá-lo:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>Acesse o <a href="https://business.facebook.com/settings/ad-accounts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Business Manager <ExternalLink className="h-3 w-3" /></a></li>
            <li>Clique em <strong>"Contas de Anúncios"</strong> no menu lateral</li>
            <li>Copie o ID numérico da conta (ex: <code className="bg-muted px-1.5 py-0.5 rounded text-sm">123456789</code>)</li>
          </ol>
          <TipCard>
            O ID da conta de anúncios é diferente do ID do seu perfil pessoal ou página. 
            Ele começa com <code className="bg-muted px-1.5 py-0.5 rounded text-sm">act_</code> (o MetrikaPRO adiciona esse prefixo automaticamente).
          </TipCard>
        </StepSection>
      </section>

      <section>
        <StepSection step={5} title="Colar no MetrikaPRO">
          <p className="text-muted-foreground mb-4">
            No MetrikaPRO, acesse seu projeto → <strong>Editar</strong> → seção <strong>Meta Ads</strong>:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>Cole o <strong>Access Token</strong> no campo correspondente</li>
            <li>Cole o <strong>Ad Account ID</strong> (sem o prefixo act_)</li>
            <li>Clique em <strong>"Salvar Meta Ads"</strong></li>
          </ol>
          <TipCard>
            Após salvar, o MetrikaPRO validará suas credenciais e carregará automaticamente a lista de campanhas disponíveis. 
            Selecione quais campanhas deseja monitorar.
          </TipCard>
        </StepSection>
      </section>

      {/* OAuth Flow (Em Breve) */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          Conexão via Facebook Login
          <span className="text-xs font-normal bg-muted text-muted-foreground px-2 py-1 rounded-full">Em breve</span>
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Em breve, será possível conectar diretamente pelo botão <strong>"Conectar com Facebook"</strong>, 
          sem necessidade de criar apps ou gerar tokens manualmente. A conexão será feita em menos de 2 minutos.
        </p>
        <div className="flex items-center gap-2 p-3 bg-[#1877F2]/10 border border-[#1877F2]/20 rounded-lg opacity-60">
          <Facebook className="h-5 w-5 text-[#1877F2]" />
          <span className="text-sm font-medium">Conectar com Facebook</span>
          <span className="text-xs text-muted-foreground ml-auto">Em breve</span>
        </div>
      </section>

      {/* WhatsApp Support */}
      <section className="pt-4 border-t">
        <div className="p-5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl">
          <div className="flex items-start gap-4">
            <span className="text-2xl flex-shrink-0">💬</span>
            <div className="space-y-2">
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Precisa de ajuda para configurar?
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Se teve qualquer dificuldade, chama no WhatsApp que te ajudo a configurar o Meta Ads no seu projeto!
              </p>
              <a
                href="https://wa.me/5531991618745"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                📱 Chamar no WhatsApp — (31) 99161-8745
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Solução de Problemas</h2>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left">
              <span className="text-destructive">O token expirou rapidamente</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-3"><strong>Causa:</strong> Tokens do Graph API Explorer expiram em 1-2 horas.</p>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Acesse o <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Access Token Debugger</a></li>
                <li>Cole seu token e clique em "Estender Token de Acesso"</li>
                <li>Copie o novo token de longa duração (dura ~60 dias)</li>
                <li>Atualize no MetrikaPRO</li>
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
                <li>Faltou marcar <code className="bg-muted px-1.5 py-0.5 rounded text-sm">ads_read</code> ou <code className="bg-muted px-1.5 py-0.5 rounded text-sm">read_insights</code> no Graph API Explorer</li>
                <li>Sua conta não tem acesso à conta de anúncios</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Volte ao Graph API Explorer e gere um novo token com ambas as permissões</li>
                <li>Verifique no Business Manager se você tem acesso à conta de anúncios</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left">
              <span className="text-destructive">Nenhuma campanha aparece após conectar</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4 space-y-1">
                <li>O Ad Account ID está incorreto</li>
                <li>Sua conta não tem campanhas criadas</li>
                <li>O token não tem as permissões corretas</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Confira se o Ad Account ID está correto (apenas números, sem "act_")</li>
                <li>Verifique se possui campanhas em <a href="https://adsmanager.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Gerenciador de Anúncios</a></li>
                <li>Gere um novo token com as permissões corretas</li>
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
                <li>Gere um novo token se o atual expirou</li>
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
            <h3 className="font-semibold mb-2">O token expira?</h3>
            <p className="text-muted-foreground text-sm">
              Sim. Tokens do Graph API Explorer expiram em 1-2 horas. Tokens de longa duração duram ~60 dias. 
              Use o Access Token Debugger para estender seu token.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Posso monitorar várias contas de anúncios?</h3>
            <p className="text-muted-foreground text-sm">
              Cada projeto monitora uma conta de anúncios por vez. Para monitorar contas diferentes, 
              crie projetos separados no MetrikaPRO.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">O MetrikaPRO pode alterar minhas campanhas?</h3>
            <p className="text-muted-foreground text-sm">
              Não! O MetrikaPRO utiliza apenas permissões de leitura (<code className="bg-muted px-1.5 py-0.5 rounded text-sm">ads_read</code> e <code className="bg-muted px-1.5 py-0.5 rounded text-sm">read_insights</code>). 
              Não temos capacidade de criar, editar ou excluir suas campanhas ou anúncios.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Preciso de um App no Facebook Developers?</h3>
            <p className="text-muted-foreground text-sm">
              Sim, pelo método manual. Você precisa criar um app para gerar o Access Token via Graph API Explorer. 
              Quando o Facebook Login estiver disponível, não será mais necessário.
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

function WarningCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800 dark:text-amber-200">{children}</p>
    </div>
  );
}
