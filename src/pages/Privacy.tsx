import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
          <p className="text-muted-foreground mb-8">Última atualização: Janeiro de 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">
              Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações 
              pessoais quando você utiliza nossa plataforma de análise de marketing e ROAS.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Informações que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Coletamos os seguintes tipos de informações:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Dados de conta:</strong> Nome, e-mail e informações de autenticação</li>
              <li><strong>Dados de campanhas publicitárias:</strong> Métricas de anúncios do Meta Ads (impressões, cliques, gastos)</li>
              <li><strong>Dados de vendas:</strong> Informações de transações da Kiwify (valores, produtos, status)</li>
              <li><strong>Dados de uso:</strong> Informações sobre como você utiliza nossa plataforma</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Como Usamos Suas Informações</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Calcular e exibir métricas de ROAS (Retorno sobre Investimento em Anúncios)</li>
              <li>Gerar relatórios e análises de desempenho de campanhas</li>
              <li>Sincronizar dados entre plataformas de anúncios e vendas</li>
              <li>Melhorar nossos serviços e experiência do usuário</li>
              <li>Enviar comunicações importantes sobre sua conta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Armazenamento e Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seus dados são armazenados em servidores seguros com criptografia. Implementamos medidas 
              técnicas e organizacionais para proteger suas informações contra acesso não autorizado, 
              alteração, divulgação ou destruição.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Não vendemos, alugamos ou compartilhamos</strong> suas informações pessoais com terceiros 
              para fins de marketing. Podemos compartilhar dados apenas nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Com provedores de serviços que nos ajudam a operar a plataforma (processamento de dados)</li>
              <li>Quando exigido por lei ou ordem judicial</li>
              <li>Para proteger nossos direitos legais ou segurança</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Integrações com Terceiros</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nossa plataforma se integra com serviços de terceiros como Meta Ads e Kiwify. Ao conectar 
              essas integrações, você autoriza o acesso aos dados necessários para o funcionamento do 
              serviço. Recomendamos revisar as políticas de privacidade desses serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Seus Direitos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Você tem o direito de:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Acessar:</strong> Solicitar uma cópia dos dados que temos sobre você</li>
              <li><strong>Corrigir:</strong> Atualizar informações incorretas ou incompletas</li>
              <li><strong>Excluir:</strong> Solicitar a exclusão dos seus dados pessoais</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li><strong>Revogar:</strong> Desconectar integrações e revogar autorizações a qualquer momento</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para fornecer 
              nossos serviços. Ao excluir sua conta, seus dados serão removidos dentro de 30 dias, 
              exceto quando exigido por lei manter registros.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas 
              por e-mail ou através de aviso na plataforma. O uso continuado após alterações constitui 
              aceitação da política atualizada.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para questões sobre esta política ou seus dados pessoais, entre em contato conosco 
              através do e-mail de suporte disponível na plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
