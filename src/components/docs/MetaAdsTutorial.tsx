import { Clock, CheckCircle2, AlertTriangle, Info, ShieldCheck, ExternalLink, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function MetaAdsTutorial() {
  return (
    <article className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-4">Como Configurar o Meta Ads</h1>
        <p className="text-muted-foreground mb-6">
          Documentação Oficial MetrikaPRO • Última atualização: 19 de Janeiro de 2026
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
        <p className="text-muted-foreground leading-relaxed">
          Existem <strong>dois tipos de token</strong> que você pode gerar:
        </p>
      </section>

      {/* Token Types Comparison */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Comparativo: Token Comum vs Token Permanente</h2>
        
        <div className="overflow-x-auto mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Característica</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Token Comum
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    System User Token
                    <Badge variant="default" className="text-xs">Recomendado</Badge>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Validade</TableCell>
                <TableCell className="text-amber-600">~60 dias</TableCell>
                <TableCell className="text-green-600">Permanente ✓</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Renovação</TableCell>
                <TableCell>Manual (a cada 2 meses)</TableCell>
                <TableCell>Não necessária</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Complexidade</TableCell>
                <TableCell>Simples</TableCell>
                <TableCell>Moderada</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Ideal para</TableCell>
                <TableCell>Testes rápidos</TableCell>
                <TableCell>Produção / Uso contínuo</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Requisitos</TableCell>
                <TableCell>Conta Facebook</TableCell>
                <TableCell>Meta Business Manager</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <RecommendationCard>
          <strong>Recomendação:</strong> Para uso em produção, sempre opte pelo <strong>System User Token</strong> (token permanente). 
          Ele evita que você precise renovar credenciais a cada 60 dias e garante sincronização contínua sem interrupções.
        </RecommendationCard>
      </section>

      {/* PART 1: Common Token */}
      <section className="pt-6 border-t">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Parte 1: Token Comum</h2>
            <p className="text-sm text-muted-foreground">Expira em aproximadamente 60 dias</p>
          </div>
        </div>

        {/* Step 1.1 */}
        <div className="space-y-6">
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

          {/* Step 1.2 */}
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

          {/* Step 1.3 */}
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

          {/* Step 1.4 */}
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

          {/* Step 1.5 */}
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

          {/* Step 1.6 */}
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
        </div>
      </section>

      {/* PART 2: Permanent Token */}
      <section className="pt-6 border-t">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Parte 2: Token Permanente (System User)</h2>
            <p className="text-sm text-muted-foreground">Não expira - Recomendado para produção</p>
          </div>
          <Badge variant="default" className="ml-auto">Recomendado</Badge>
        </div>

        <div className="space-y-6">
          {/* Step 2.1 */}
          <StepSection step={1} title="Acessar o Meta Business Manager">
            <p className="text-muted-foreground mb-4">
              Acesse as configurações do Business Manager através do endereço:{' '}
              <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                business.facebook.com/settings
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <ImportantCard>
              Você precisa ter <strong>permissão de Administrador</strong> no Business Manager para criar System Users.
            </ImportantCard>
          </StepSection>

          {/* Step 2.2 */}
          <StepSection step={2} title="Navegar até Usuários do Sistema">
            <p className="text-muted-foreground mb-4">
              No menu lateral esquerdo, encontre a seção <strong>"Usuários"</strong> e clique em{' '}
              <strong>"Usuários do Sistema"</strong> (System Users).
            </p>
            <p className="text-muted-foreground">
              Ou acesse diretamente:{' '}
              <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                business.facebook.com/settings/system-users
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </StepSection>

          {/* Step 2.3 */}
          <StepSection step={3} title="Criar um System User">
            <p className="text-muted-foreground mb-4">
              Para criar um novo usuário do sistema:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>Clique no botão <strong>"Adicionar"</strong></li>
              <li>Digite um nome descritivo, por exemplo: <code className="bg-muted px-1.5 py-0.5 rounded text-sm">MetrikaPRO Integration</code></li>
              <li>Selecione a função:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Admin</strong> - Acesso total (recomendado)</li>
                  <li><strong>Funcionário</strong> - Acesso limitado</li>
                </ul>
              </li>
              <li>Clique em <strong>"Criar usuário do sistema"</strong></li>
            </ol>
          </StepSection>

          {/* Step 2.4 */}
          <StepSection step={4} title="Atribuir Ativos (Contas de Anúncio)">
            <p className="text-muted-foreground mb-4">
              Após criar o System User, você precisa dar acesso às contas de anúncio:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>Clique no System User que você acabou de criar</li>
              <li>Clique em <strong>"Atribuir ativos"</strong></li>
              <li>Selecione <strong>"Contas de anúncios"</strong></li>
              <li>Marque as contas de anúncio que deseja monitorar</li>
              <li>Defina a permissão:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>"Gerenciar campanhas"</strong> - Acesso completo</li>
                  <li><strong>"Ver desempenho"</strong> - Apenas leitura (suficiente para o MetrikaPRO)</li>
                </ul>
              </li>
              <li>Clique em <strong>"Salvar alterações"</strong></li>
            </ol>
          </StepSection>

          {/* Step 2.5 */}
          <StepSection step={5} title="Gerar o Token Permanente">
            <p className="text-muted-foreground mb-4">
              Agora vamos gerar o token que <strong>nunca expira</strong>:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>Na página do System User, clique em <strong>"Gerar novo token"</strong></li>
              <li>Selecione o <strong>App</strong> que você criou anteriormente (ou crie um novo)</li>
              <li>Marque as permissões necessárias:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-sm">ads_read</code> ✓</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-sm">read_insights</code> ✓</li>
                </ul>
              </li>
              <li>Clique em <strong>"Gerar token"</strong></li>
              <li><strong>COPIE O TOKEN IMEDIATAMENTE!</strong></li>
            </ol>
            <WarningCard>
              <strong>ATENÇÃO CRÍTICA:</strong> O token só é exibido UMA VEZ! Se você fechar a janela sem copiar, 
              precisará gerar um novo token. Guarde-o em local seguro!
            </WarningCard>
          </StepSection>

          {/* Step 2.6 */}
          <StepSection step={6} title="Configurar no MetrikaPRO">
            <p className="text-muted-foreground mb-4">
              Com o token permanente em mãos:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2">
              <li>Acesse o MetrikaPRO e vá para seu projeto</li>
              <li>Clique em <strong>"Editar"</strong></li>
              <li>Na seção <strong>"Meta Ads"</strong>, cole o token no campo <strong>"Access Token"</strong></li>
              <li>Adicione o <strong>"Ad Account ID"</strong> (formato: <code className="bg-muted px-1.5 py-0.5 rounded text-sm">act_123456789</code>)</li>
              <li>Clique em <strong>"Salvar Integração"</strong></li>
            </ol>
            <SuccessCard>
              Pronto! Este token <strong>não expira</strong>. Sua integração funcionará indefinidamente, 
              a menos que você revogue o token manualmente no Business Manager.
            </SuccessCard>
          </StepSection>
        </div>
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
              <li>Olhe na URL do navegador</li>
              <li>O ID está no parâmetro <code className="bg-muted px-1.5 py-0.5 rounded text-sm">act=</code> (ex: act=123456789)</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Solução de Problemas</h2>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Erro: "API access blocked"</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Causa:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4">
                <li>O token expirou (tokens comuns expiram em ~60 dias)</li>
                <li>O token foi revogado manualmente</li>
                <li>O app foi desativado no Facebook Developers</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Gere um novo token seguindo os passos acima</li>
                <li>De preferência, use um System User Token (permanente)</li>
                <li>Atualize o token na edição do projeto</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Erro: "Permission denied" ou "Insufficient permissions"</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Causa:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4">
                <li>O token não tem as permissões <code className="bg-muted px-1 rounded">ads_read</code> e <code className="bg-muted px-1 rounded">read_insights</code></li>
                <li>O System User não tem acesso à conta de anúncios</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1">
                <li>Gere um novo token com as permissões corretas</li>
                <li>No caso de System User, atribua os ativos (contas de anúncio) corretamente</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Erro: "Invalid Ad Account ID"</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Causa:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4">
                <li>O ID da conta foi digitado incorretamente</li>
                <li>Falta o prefixo <code className="bg-muted px-1 rounded">act_</code></li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Verifique se o ID está no formato correto: <code className="bg-muted px-1 rounded">act_123456789</code></li>
                <li>Copie o ID diretamente do Business Manager</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3 text-destructive">Campanhas não aparecem</h3>
              <p className="text-sm text-muted-foreground mb-3"><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm mb-4">
                <li>Nenhuma campanha ativa nos últimos 90 dias</li>
                <li>Campanhas estão em outro Ad Account</li>
                <li>O token não tem acesso ao Ad Account correto</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-3"><strong>Solução:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Verifique se há campanhas ativas no Gerenciador de Anúncios</li>
                <li>Confirme que o Ad Account ID está correto</li>
                <li>Para System Users, verifique se o ativo foi atribuído</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes (FAQ)</h2>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Preciso criar um App no Facebook Developers?</AccordionTrigger>
            <AccordionContent>
              Sim, para ambos os métodos você precisa de um App. Ele serve como intermediário entre o MetrikaPRO e a API do Facebook.
              O app pode ser do tipo "Business" e não precisa ser publicado.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>Posso usar o mesmo token em vários projetos?</AccordionTrigger>
            <AccordionContent>
              Sim, desde que todas as contas de anúncio estejam vinculadas ao mesmo token. 
              Se você gerencia múltiplos clientes com Business Managers diferentes, precisará de tokens separados.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>O token permanente pode parar de funcionar?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">O System User Token só para de funcionar se:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Você revogá-lo manualmente no Business Manager</li>
                <li>O System User for excluído</li>
                <li>O App for desativado</li>
                <li>A conta de anúncios for removida do Business Manager</li>
              </ul>
              <p className="mt-2">Em condições normais, ele funciona indefinidamente.</p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger>Como sei se meu token ainda está válido?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Você pode verificar a validade do token usando o Access Token Debugger:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Acesse <a href="https://developers.facebook.com/tools/debug/accesstoken" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developers.facebook.com/tools/debug/accesstoken</a></li>
                <li>Cole seu token e clique em "Depurar"</li>
                <li>Verifique o campo "Expira" (Data/Hora Expires) - tokens permanentes mostram "Never"</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>Qual a diferença entre App Token e User Token?</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                <li><strong>User Token:</strong> Representa um usuário real do Facebook. Expira e precisa de renovação.</li>
                <li><strong>System User Token:</strong> Representa um usuário de sistema (não humano). Não expira e é ideal para integrações.</li>
                <li><strong>App Token:</strong> Representa o app em si, mas não tem acesso a dados de anúncios. Não serve para o MetrikaPRO.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Summary */}
      <section className="pt-4 border-t">
        <h2 className="text-2xl font-bold mb-6">Resumo</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold">Token Comum</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Rápido de configurar</li>
                <li>✓ Bom para testes</li>
                <li>⚠ Expira em ~60 dias</li>
                <li>⚠ Precisa renovar manualmente</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">System User Token</h3>
                <Badge variant="default" className="text-xs">Recomendado</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Não expira nunca</li>
                <li>✓ Ideal para produção</li>
                <li>✓ Mais seguro</li>
                <li>✓ Sem interrupções na sincronização</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </article>
  );
}

// Helper Components
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
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
      <CardContent className="pt-4 pb-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 dark:text-blue-100">{children}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ImportantCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
      <CardContent className="pt-4 pb-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 dark:text-amber-100">{children}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function WarningCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <CardContent className="pt-4 pb-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900 dark:text-red-100">{children}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SuccessCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
      <CardContent className="pt-4 pb-4">
        <div className="flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-900 dark:text-green-100">{children}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-4 pb-4">
        <div className="flex gap-3">
          <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm">{children}</p>
        </div>
      </CardContent>
    </Card>
  );
}
