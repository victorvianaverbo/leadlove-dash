import { Clock, CheckCircle2, AlertTriangle, Info, Facebook } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function MetaAdsTutorial() {
  return (
    <article className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-4">Como Configurar o Meta Ads</h1>
        <p className="text-muted-foreground mb-6">
          Documentação Oficial MetrikaPRO • Última atualização: 8 de Fevereiro de 2026
        </p>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>2-3 minutos</span>
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
          métricas de campanhas e dados de desempenho do Facebook e Instagram. A conexão é feita diretamente 
          pelo Facebook Login, sem necessidade de tokens manuais.
        </p>
        <TipCard>
          <strong>Conexão simplificada!</strong> Basta clicar em "Conectar com Facebook", autorizar o acesso 
          e selecionar sua conta de anúncios. Todo o processo leva menos de 3 minutos.
        </TipCard>
      </section>

      {/* Step 1 */}
      <section>
        <StepSection step={1} title="Acessar seu Projeto">
          <p className="text-muted-foreground mb-4">
            No painel do MetrikaPRO, acesse o projeto onde deseja monitorar seus anúncios e clique em <strong>"Editar"</strong>.
          </p>
          <p className="text-muted-foreground">
            Na página de edição, role até a seção <strong>"Meta Ads"</strong> e clique para expandir.
          </p>
        </StepSection>
      </section>

      {/* Step 2 */}
      <section>
        <StepSection step={2} title='Clicar em "Conectar com Facebook"'>
          <p className="text-muted-foreground mb-4">
            Clique no botão azul <strong>"Conectar com Facebook"</strong>. Um popup do Facebook será aberto 
            para que você autorize o acesso.
          </p>
          <div className="flex items-center gap-2 p-3 bg-[#1877F2]/10 border border-[#1877F2]/20 rounded-lg">
            <Facebook className="h-5 w-5 text-[#1877F2]" />
            <span className="text-sm font-medium">Conectar com Facebook</span>
          </div>
        </StepSection>
      </section>

      {/* Step 3 */}
      <section>
        <StepSection step={3} title="Autorizar as Permissões">
          <p className="text-muted-foreground mb-4">
            No popup do Facebook, revise as permissões solicitadas e clique em <strong>"Continuar"</strong>. 
            O MetrikaPRO solicita apenas permissões de <strong>leitura</strong> — não temos capacidade de 
            criar, editar ou excluir suas campanhas.
          </p>
          <p className="text-muted-foreground mb-4">
            As permissões solicitadas são:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
            <li><code className="bg-muted px-1.5 py-0.5 rounded text-sm">ads_read</code> — Ler dados de anúncios</li>
            <li><code className="bg-muted px-1.5 py-0.5 rounded text-sm">read_insights</code> — Ler métricas de desempenho</li>
          </ul>
          <TipCard>
            Após autorizar, o popup fechará automaticamente e você verá uma confirmação na tela do MetrikaPRO.
          </TipCard>
        </StepSection>
      </section>

      {/* Step 4 */}
      <section>
        <StepSection step={4} title="Selecionar a Conta de Anúncios">
          <p className="text-muted-foreground mb-4">
            Após a conexão, um dropdown aparecerá listando todas as suas contas de anúncios vinculadas ao Facebook. 
            <strong> Selecione a conta que deseja monitorar.</strong>
          </p>
          <WarningCard>
            <strong>Passo obrigatório!</strong> Sem selecionar a conta de anúncios, o MetrikaPRO não conseguirá 
            importar seus dados. O dropdown ficará destacado em amarelo até que você faça a seleção.
          </WarningCard>
        </StepSection>
      </section>

      {/* Step 5 */}
      <section>
        <StepSection step={5} title="Selecionar as Campanhas">
          <p className="text-muted-foreground mb-4">
            Com a conta de anúncios selecionada, a lista de campanhas será carregada automaticamente. 
            Marque as campanhas que deseja monitorar no MetrikaPRO.
          </p>
          <p className="text-muted-foreground">
            Você pode usar a barra de busca para filtrar campanhas pelo nome, ou clicar em "Todas" 
            para selecionar todas de uma vez.
          </p>
        </StepSection>
      </section>

      {/* Step 6 */}
      <section>
        <StepSection step={6} title="Salvar Configurações">
          <p className="text-muted-foreground mb-4">
            Após selecionar as campanhas, clique em <strong>"Salvar Configurações"</strong> no final da página. 
            O MetrikaPRO começará a sincronizar os dados automaticamente.
          </p>
          <TipCard>
            A primeira sincronização pode levar alguns segundos. Após isso, os dados serão atualizados 
            automaticamente a cada sincronização.
          </TipCard>
        </StepSection>
      </section>

      {/* Troubleshooting */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Solução de Problemas</h2>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left">
              <span className="text-destructive">O popup do Facebook não abre</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4 space-y-1">
                <li>Bloqueador de popups ativado no navegador</li>
                <li>Extensões de ad-block impedindo o popup</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Desative o bloqueador de popups para o MetrikaPRO</li>
                <li>Desative temporariamente extensões de ad-block</li>
                <li>Tente novamente clicando em "Conectar com Facebook"</li>
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
                <li>Você não autorizou todas as permissões no popup do Facebook</li>
                <li>Sua conta não tem acesso à conta de anúncios selecionada</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Desconecte a integração e reconecte via "Conectar com Facebook"</li>
                <li>Certifique-se de autorizar todas as permissões solicitadas</li>
                <li>Verifique se você tem acesso à conta de anúncios no Business Manager do Facebook</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left">
              <span className="text-destructive">Nenhuma conta de anúncios aparece no dropdown</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4 space-y-1">
                <li>Sua conta do Facebook não está vinculada a nenhuma conta de anúncios</li>
                <li>Você não tem permissão de anunciante na conta</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Verifique se possui uma conta de anúncios ativa em <a href="https://business.facebook.com/settings/ad-accounts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">business.facebook.com</a></li>
                <li>Peça ao administrador da conta para adicioná-lo como anunciante</li>
                <li>Desconecte e reconecte via Facebook para atualizar a lista</li>
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
                <li>A conexão com o Facebook expirou</li>
                <li>Há um atraso no processamento de dados do Meta</li>
                <li>Você não tem campanhas ativas no período selecionado</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Clique em "Sincronizar" no MetrikaPRO para forçar atualização</li>
                <li>Se persistir, reconecte via "Conectar com Facebook" para renovar a conexão</li>
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
            <h3 className="font-semibold mb-2">A conexão expira?</h3>
            <p className="text-muted-foreground text-sm">
              A conexão via Facebook Login pode expirar após um período. Se isso acontecer, 
              basta clicar em "Reconectar com Facebook" na seção Meta Ads do seu projeto.
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
              Não! O MetrikaPRO utiliza apenas permissões de leitura. Não temos capacidade de 
              criar, editar ou excluir suas campanhas ou anúncios.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Preciso de um App no Facebook Developers?</h3>
            <p className="text-muted-foreground text-sm">
              Não! A conexão é feita diretamente pelo botão "Conectar com Facebook" no MetrikaPRO. 
              Não é necessário criar apps, gerar tokens ou configurar nada manualmente.
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
