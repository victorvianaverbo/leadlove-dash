import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Terms = () => {
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
          <h1 className="text-3xl font-bold mb-6">Termos de Uso</h1>
          <p className="text-muted-foreground mb-8">Última atualização: Janeiro de 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e utilizar nossa plataforma de análise de marketing e ROAS, você concorda em 
              cumprir estes Termos de Uso. Se você não concordar com algum termo, não utilize nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nossa plataforma oferece ferramentas para análise de retorno sobre investimento em 
              anúncios (ROAS), integrando dados de plataformas de anúncios (Meta Ads) e vendas (Kiwify) 
              para fornecer insights sobre o desempenho de campanhas de marketing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Cadastro e Conta</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Para utilizar nossos serviços, você deve:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Ter pelo menos 18 anos de idade</li>
              <li>Fornecer informações precisas e atualizadas durante o cadastro</li>
              <li>Manter a confidencialidade das suas credenciais de acesso</li>
              <li>Ser responsável por todas as atividades realizadas em sua conta</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Uso Aceitável</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Você concorda em:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Utilizar a plataforma apenas para fins legais e autorizados</li>
              <li>Não tentar acessar dados ou contas de outros usuários</li>
              <li>Não utilizar robôs, scrapers ou outros meios automatizados sem autorização</li>
              <li>Não transmitir vírus, malware ou código malicioso</li>
              <li>Não violar leis aplicáveis ou direitos de terceiros</li>
              <li>Não fazer engenharia reversa ou tentar acessar o código-fonte</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Integrações e Dados de Terceiros</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao conectar integrações com serviços de terceiros (Meta Ads, Kiwify), você declara ter 
              autorização para acessar e utilizar os dados dessas plataformas. Você é responsável por 
              cumprir os termos de uso desses serviços. Não nos responsabilizamos por alterações, 
              interrupções ou problemas causados por serviços de terceiros.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo da plataforma, incluindo design, código, logotipos e textos, é protegido 
              por direitos autorais e propriedade intelectual. Você não pode copiar, modificar, 
              distribuir ou criar obras derivadas sem nossa autorização expressa.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Seus Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você mantém a propriedade dos dados que insere na plataforma. Ao utilizar nossos serviços, 
              você nos concede uma licença limitada para processar, armazenar e exibir seus dados 
              conforme necessário para fornecer o serviço. Consulte nossa <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link> para 
              mais detalhes sobre como tratamos seus dados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O serviço é fornecido "como está". Não garantimos que será ininterrupto, livre de erros 
              ou que atenderá todas as suas necessidades. Em nenhuma circunstância seremos responsáveis 
              por danos indiretos, incidentais, especiais ou consequentes, incluindo perda de lucros, 
              dados ou oportunidades de negócio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Indenização</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você concorda em indenizar e isentar-nos de qualquer reclamação, dano ou despesa 
              (incluindo honorários advocatícios) decorrentes do seu uso da plataforma, violação 
              destes termos ou infração de direitos de terceiros.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Suspensão e Encerramento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos suspender ou encerrar seu acesso à plataforma a qualquer momento, por qualquer 
              motivo, incluindo violação destes termos. Você pode encerrar sua conta a qualquer momento 
              através das configurações da plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Alterações nos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamos o direito de modificar estes termos a qualquer momento. Alterações significativas 
              serão comunicadas por e-mail ou aviso na plataforma. O uso continuado após modificações 
              constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Lei Aplicável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes termos são regidos pelas leis do Brasil. Qualquer disputa será submetida ao 
              foro da comarca do domicílio do usuário, conforme previsto no Código de Defesa do Consumidor.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre estes termos, entre em contato através do e-mail de suporte 
              disponível na plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
