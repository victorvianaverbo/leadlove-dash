import { Clock, CheckCircle2, AlertTriangle, Info, ShieldAlert, HelpCircle, ExternalLink, Play, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
        <h1 className="text-3xl font-bold mb-4">Como Obter sua API Key da Kiwify</h1>
        <p className="text-muted-foreground mb-6">
          Documentação Oficial MetrikaPRO • Última atualização: 17 de Janeiro de 2026
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
                    <span>6 passos simples</span>
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
        <p className="text-muted-foreground leading-relaxed">
          A API Key da Kiwify permite que o MetrikaPRO sincronize automaticamente suas vendas, 
          comissões e dados de produtos. Este tutorial mostra o passo a passo completo para 
          obter sua chave de API diretamente no painel da Kiwify.
        </p>
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
          <h2 className="text-xl font-semibold">Navegar até a Seção de Apps</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Após fazer login, você será direcionado ao dashboard principal da Kiwify. 
            No menu lateral esquerdo, localize e clique na opção <strong>"Apps"</strong> (geralmente é o último item do menu).
          </p>
          <p className="text-muted-foreground mb-4">
            A seção de Apps exibe todas as integrações disponíveis na Kiwify, incluindo:
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {['Webhooks', 'API', 'Hotzapp', 'Enotas', 'Notazz', 'LeadLovers', 'Mailchimp', 'MemberKit', 'MailingBoss', 'Tiny', 'Voxluy', 'Notificações Inteligentes', 'Zapier'].map((app) => (
              <span 
                key={app} 
                className={`px-2 py-1 rounded text-xs ${app === 'API' ? 'bg-primary text-primary-foreground font-medium' : 'bg-muted'}`}
              >
                {app}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Step 3 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            3
          </div>
          <h2 className="text-xl font-semibold">Acessar a Seção de API</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground">
            Na página de Apps, localize o card <strong>"API"</strong> (geralmente aparece no topo da página, ao lado de "Webhooks"). 
            Clique nele para acessar a área de gerenciamento de chaves de API.
          </p>
        </div>
      </section>

      {/* Step 4 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            4
          </div>
          <h2 className="text-xl font-semibold">Criar uma Nova API Key</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Você será direcionado para a página de gerenciamento de API Keys. Nesta tela você verá:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
            <li>Uma lista de todas as API Keys criadas anteriormente (se houver)</li>
            <li>Um botão <strong>"Criar API Key"</strong> no canto superior direito (em roxo)</li>
          </ul>
          <p className="text-muted-foreground mb-4">Para criar uma nova chave:</p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2">
            <li>Clique no botão <strong>"Criar API Key"</strong></li>
            <li>Um modal será aberto solicitando um nome para identificar esta chave</li>
            <li>Digite um nome descritivo, por exemplo: <code className="bg-muted px-1.5 py-0.5 rounded text-sm">MetrikaPRO</code> ou <code className="bg-muted px-1.5 py-0.5 rounded text-sm">Dashboard Analytics</code></li>
            <li>Clique em "Criar" ou "Confirmar"</li>
          </ol>
        </div>
      </section>

      {/* Step 5 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            5
          </div>
          <h2 className="text-xl font-semibold">Copiar sua API Key</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Após criar a chave, ela aparecerá na lista com as seguintes informações:
          </p>
          
          <div className="overflow-x-auto mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coluna</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Nome</TableCell>
                  <TableCell>O nome que você definiu (ex: "metrikapro")</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">API Key</TableCell>
                  <TableCell>A chave propriamente dita (aparece parcialmente oculta como ******oj31)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Criada em</TableCell>
                  <TableCell>Data e hora de criação (ex: "01/12/2025 09:38")</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Último uso</TableCell>
                  <TableCell>Data do último acesso via API</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Ações</TableCell>
                  <TableCell>Menu com opções (ícone de três pontos)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <p className="text-muted-foreground mb-4">
            <strong>Para copiar a chave:</strong> Quando você cria uma nova API Key, a Kiwify exibe 3 campos separados 
            com partes da chave. Você precisa copiar os três campos:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-2">
            <li>Clique no primeiro campo para copiar a primeira parte da chave</li>
            <li>Clique no segundo campo para copiar a segunda parte</li>
            <li>Clique no terceiro campo para copiar a terceira parte</li>
          </ol>

          <ImportantCard>
            Guarde os três valores em local seguro. A Kiwify exibe os campos completos apenas no momento da criação. 
            Depois, eles aparecem parcialmente ocultos. Se você perder qualquer uma das partes, será necessário criar uma nova API Key.
          </ImportantCard>
        </div>
      </section>

      {/* Step 6 */}
      <section>
        <div className="flex gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
            6
          </div>
          <h2 className="text-xl font-semibold">Configurar no MetrikaPRO</h2>
        </div>
        <div className="ml-12">
          <p className="text-muted-foreground mb-4">
            Agora que você tem sua API Key da Kiwify, siga estes passos para configurá-la no MetrikaPRO:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2">
            <li>Acesse o MetrikaPRO em metrikapro.com.br</li>
            <li>Faça login na sua conta</li>
            <li>Vá para Configurações → Integrações → Kiwify</li>
            <li>Cole sua API Key nos campos correspondentes</li>
            <li>Clique em "Salvar" e aguarde a sincronização</li>
          </ol>
        </div>
      </section>

      {/* API Key Management */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Gerenciamento de API Keys</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Visualizar Chaves Existentes</h3>
            <p className="text-muted-foreground mb-3">
              Na página de API Keys, você pode visualizar todas as chaves criadas, incluindo:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Nome da chave</li>
              <li>Data de criação</li>
              <li>Data do último uso (útil para identificar chaves inativas)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Revogar uma API Key</h3>
            <p className="text-muted-foreground mb-3">
              Se você suspeitar que uma chave foi comprometida ou não está mais em uso:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-2">
              <li>Localize a chave na lista</li>
              <li>Clique no menu de ações (⋮)</li>
              <li>Selecione "Revogar" ou "Excluir"</li>
              <li>Confirme a ação</li>
            </ol>
            <WarningCard>
              Ao revogar uma chave, todas as integrações que a utilizam deixarão de funcionar imediatamente. 
              Certifique-se de atualizar suas integrações com uma nova chave antes de revogar a antiga.
            </WarningCard>
          </div>
        </div>
      </section>

      {/* Security Best Practices */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Boas Práticas de Segurança</h2>
        <ol className="list-decimal list-inside text-muted-foreground space-y-3">
          <li><strong>Nunca compartilhe</strong> sua API Key com terceiros ou em locais públicos (fóruns, redes sociais, etc.)</li>
          <li><strong>Use nomes descritivos</strong> para identificar facilmente onde cada chave está sendo usada</li>
          <li><strong>Revogue chaves não utilizadas</strong> para minimizar riscos de segurança</li>
          <li><strong>Monitore o "Último uso"</strong> para detectar acessos não autorizados</li>
          <li><strong>Crie chaves separadas</strong> para cada integração (uma para MetrikaPRO, outra para Zapier, etc.)</li>
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
                <li>A chave foi copiada incorretamente (espaços extras, caracteres faltando)</li>
                <li>A chave foi revogada no painel da Kiwify</li>
                <li>A chave expirou (verifique se há políticas de expiração na sua conta)</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Volte ao painel da Kiwify</li>
                <li>Verifique se a chave ainda está ativa</li>
                <li>Copie novamente a chave (ou crie uma nova)</li>
                <li>Cole no MetrikaPRO sem espaços extras</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Erro: "Sem Permissão para Acessar Dados"</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possível causa:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4">
                <li>Sua conta Kiwify não tem permissões suficientes (conta de colaborador com acesso limitado)</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Entre em contato com o administrador da conta Kiwify</li>
                <li>Solicite permissões de "Administrador" ou "Desenvolvedor"</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Dados Não Estão Sincronizando</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4 space-y-1">
                <li>A API Key está correta, mas há um problema temporário de conexão</li>
                <li>Você não tem vendas recentes para sincronizar</li>
                <li>A Kiwify está passando por manutenção</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Aguarde 5-10 minutos e tente novamente</li>
                <li>Verifique se há vendas registradas no painel da Kiwify</li>
                <li>Entre em contato com o suporte do MetrikaPRO se o problema persistir</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes (FAQ)</h2>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Quantas API Keys posso criar?</AccordionTrigger>
            <AccordionContent>
              A Kiwify não impõe limite no número de chaves que você pode criar. 
              Recomendamos criar uma chave diferente para cada integração para facilitar o gerenciamento.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>A API Key expira?</AccordionTrigger>
            <AccordionContent>
              Não, as API Keys da Kiwify não expiram automaticamente. 
              Elas permanecem ativas até que você as revogue manualmente.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>Posso usar a mesma API Key em múltiplas integrações?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Tecnicamente sim, mas não é recomendado. Use chaves separadas para cada integração para:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Facilitar o rastreamento de uso</li>
                <li>Revogar acesso de forma granular se necessário</li>
                <li>Identificar rapidamente qual integração está causando problemas</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger>O que acontece se eu excluir uma API Key por engano?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Se você excluir uma chave por engano, não é possível recuperá-la. Você precisará:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Criar uma nova API Key</li>
                <li>Atualizar todas as integrações que usavam a chave antiga</li>
                <li>Testar para garantir que tudo voltou a funcionar</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger>A Kiwify cobra pelo uso da API?</AccordionTrigger>
            <AccordionContent>
              Não, o acesso à API da Kiwify é gratuito para todos os usuários. 
              Não há limites de requisições ou taxas adicionais.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-6">
            <AccordionTrigger>Posso ver o histórico de acessos da minha API Key?</AccordionTrigger>
            <AccordionContent>
              A Kiwify exibe apenas a data do último uso de cada chave. 
              Para logs detalhados de acesso, entre em contato com o suporte da Kiwify.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Support */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Suporte</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Suporte Kiwify</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>
                  <strong>Central de Ajuda:</strong>{' '}
                  <a href="https://ajuda.kiwify.com.br" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    ajuda.kiwify.com.br
                  </a>
                </li>
                <li><strong>E-mail:</strong> suporte@kiwify.com.br</li>
                <li><strong>Chat ao vivo:</strong> Disponível no canto inferior direito do dashboard</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Suporte MetrikaPRO</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li><strong>E-mail:</strong> suporte@metrikapro.com.br</li>
                <li><strong>WhatsApp:</strong> Disponível para clientes pagantes</li>
                <li>
                  <strong>Base de conhecimento:</strong>{' '}
                  <a href="https://metrikapro.com.br/docs" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    metrikapro.com.br/docs
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Conclusion */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-4">Conclusão</h2>
        <p className="text-muted-foreground mb-6">
          Obter sua API Key da Kiwify é um processo simples e rápido que leva apenas alguns minutos. 
          Com a chave configurada no MetrikaPRO, você terá acesso a análises detalhadas de suas vendas, 
          comissões e desempenho de produtos em tempo real.
        </p>
        
        <div className="bg-gradient-soft rounded-lg p-6">
          <h3 className="font-semibold mb-3">Próximos passos recomendados:</h3>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2">
            <li>Configure outras integrações (Hotmart, Guru) para análise consolidada</li>
            <li>Explore os relatórios de vendas no MetrikaPRO</li>
            <li>Configure alertas para acompanhar suas métricas em tempo real</li>
          </ol>
        </div>
      </section>
    </article>
  );
}

// Helper components for styled cards
function TipCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary-soft border-l-4 border-primary p-4 rounded-r-lg flex gap-3">
      <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
      <p className="text-sm text-primary">{children}</p>
    </div>
  );
}

function ImportantCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-yellow-500 p-4 rounded-r-lg flex gap-3">
      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">IMPORTANTE</p>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">{children}</p>
      </div>
    </div>
  );
}

function WarningCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-r-lg flex gap-3">
      <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">ATENÇÃO</p>
        <p className="text-sm text-red-700 dark:text-red-300">{children}</p>
      </div>
    </div>
  );
}
