import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "error";
  const message = searchParams.get("message") || "";
  const isSuccess = status === "success";

  useEffect(() => {
    // Notify opener window
    if (window.opener) {
      const msgType = isSuccess ? "meta-oauth-success" : "meta-oauth-error";
      window.opener.postMessage(
        { type: msgType, ...(message ? { message } : {}) },
        "*"
      );
    }
    // Try to auto-close after a short delay
    const timer = setTimeout(() => window.close(), 150);
    return () => clearTimeout(timer);
  }, [isSuccess, message]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8 max-w-md">
        {isSuccess ? (
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-white" />
          </div>
        )}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {isSuccess ? "Conta conectada com sucesso!" : "Erro na conexão"}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {isSuccess
            ? "Pode fechar esta janela e atualizar com F5."
            : `${message || "Ocorreu um erro."} Tente novamente.`}
        </p>
        <Button onClick={() => window.close()}>Fechar janela</Button>
      </div>
    </div>
  );
};

export default OAuthCallback;
