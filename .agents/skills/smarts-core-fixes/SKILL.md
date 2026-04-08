---
name: SmartS Core Fixes & Debugging Patterns
description: Padrões essenciais para Expo Router, NativeWind Types, Supabase Adapter e Navegação baseados no que já foi resolvido.
---

# SmartS Core Fixes & Debugging Patterns

Esta skill documenta todas as soluções fundamentais aplicadas à arquitetura do SmartS, para serem reutilizadas sempre que necessário.

> [!TIP]
> Para suporte a infraestrutura avançada de isolamento de dados e performance de larga escala, consulte a skill: **[SmartS Senior Architecture & Security Patterns](file:///c:/Users/miran/Desktop/SmartS/.agents/skills/smarts-senior-architect/SKILL.md)**.

## 1. Expo Router: Histórico de Navegação Global (Back Button)
Por defeito, o componente `<Tabs>` do Expo Router ignora o histórico de empilhamento de páginas e volta sempre ao ecrã inicial (`initialRoute`).
- **A Solução:** Garantir sempre a propriedade `backBehavior="history"` no `app/(app)/_layout.tsx`. Isto faz o `router.back()` respeitar a verdadeira navegação e histórico do utilizador.

## 2. Erros de TypeScript no NativeWind (FlatList / ScrollView)
O TypeScript aborta a compilação ao ver `contentContainerClassName` numa `FlatList` com NativeWind v4 e React Native 0.72+.
- **A Solução:** NUNCA force `//@ts-ignore` e não complique o código com `StyleSheet`. A correção definitiva está documentada globalmente no ficheiro **`app.d.ts`** da raiz, declarando um "module augmentation" no `react-native` para `FlatListProps` e `ScrollViewProps`.

## 3. Adaptador de Autenticação do Supabase (Expo SecureStore)
Para evitar falhas de sessão não sincronizada e *Promises* perdidas na inicialização do auth do Supabase:
- **A Solução:** No adaptador customizado em `src/services/supabase.ts`, as funções assíncronas `setItem` e `removeItem` **precisam sempre da palavra-chave `return`** antes da chamada ao `SecureStore`.

## 4. O Sistema "UI do Input" (Palavras-Passe)
O componente global `src/components/ui/Input.tsx` é inteligente e robusto:
- **A Regra:** Nunca construa ícones de olho (Eye/EyeOff) manualmente noutros ecrãs. Basta injectar `secureTextEntry={true}` em qualquer Input e o componente gerirá todo o estado visual da password dinamicamente. Usa propriedades nativas de acessibilidade (`aria-invalid`) para melhor suporte atualizado do Expo SDK.

## 5. ERRO: TypeError "Network request failed"
Falhas massivas de Rede da App relacionadas com o Supabase num Emulador nunca são bugs do código JS per-se.
- **O Check-List a seguir:**
  1. Foi adicionada/alterada uma variável `.env` (ex: `EXPO_PUBLIC_SUPABASE_URL`)? Faça parar o servidor e corra obrigatoriamente **`npx expo start -c`** (a cache do metro NUNCA deteta novos ficheiros `.env`).
  2. O URL copiado do dashboard do Supabase existe na Cloud (sem falhas de digitação) e não foi apagado/suspenso? O DNS rebenta imediatamente se não existir.

## 6. Sincronização SQLite vs Supabase Parity
A BD Offline tem que ser reflexo em espelho da BD Online.
- Se usar os Repositórios (`history`, `invoices`, `notifications`, `companies`), então os métodos *Upsert* do sistema `syncData.ts` vão lançar erros se a tabela não tiver sido manualmente criada primeiro no Supabase SQL Editor. As bases estão completamente mapeadas em `professional_supabase_schema.sql`.

## 7. Layout da UI: Espaçamento abaixo do Cabeçalho (Header)
Em telas que usam o layout de ecrã inteiro `<Screen padHorizontal={false}>` e incluem o componente `<Header>`, os elementos colocados imediatamente a seguir (como as Barras de Pesquisa `Input`) sofrem um colapso visual do topo e "colam" no limite do cabeçalho.
## 8. Arquitetura de Notificações Centralizada
Para evitar conflitos de re-renderização e loops infinitos no arranque da app:
- **A Solução:** NUNCA registe `setNotificationHandler` ou listeners pesados no `app/(app)/_layout.tsx` ou em múltiplos hooks. Use o `notificationService` centralizado em `src/features/notifications` e ative a monitorização através de um único hook `useAutoAlerts` no Root Layout.

## 9. Proteção Contra Overflow em Cards Financeiros
Valores monetários elevados (milhões de MT) podem quebrar o layout de cards pequenos.
- **A Solução:** Em todos os componentes `<Text>` que exibem saldos ou totais, use obrigatoriamente `adjustsFontSizeToFit` e `numberOfLines={1}`. Combine com `flex-1` e `text-right` para garantir que o valor escala para baixo antes de empurrar outros elementos da interface.
## 10. Diálogos de Confirmação Globais (ConfirmDialog)
Para operações destrutivas (logout, delete, processamento), NUNCA use `Alert.alert` nativo.
- **A Solução:** Use o ecrã global `ConfirmDialog` acionado via Zustand: `useConfirmStore.getState().show({ title, message, onConfirm })`. Isto garante consistência visual premium e total compatibilidade com o tema dark/light da app.

## 11. Ecrãs Jurídicos e Privacidade (Legal Flow)
A aplicação deve incluir transparência legal e direitos de autor.
- **A Regra:** Novas telas de legal (`privacy.tsx`, `terms.tsx`) devem ser criadas em `app/(app)/settings/` e explicitamente ocultadas da barra de separadores no `app/(app)/_layout.tsx` usando `options={{ href: null }}`.
- **Copyright:** Todos os documentos legais devem mencionar **Miranda Ricardo Maunze** como detentor dos direitos.
## 12. UI Imersiva e Animações (Edge-to-Edge)
Para ecrãs de Onboarding ou Dashboards que necessitem de um visual premium ocupando 100% da área do dispositivo:
- **Barra de Sistema (Android/iOS):**
  1. Use `<StatusBar translucent backgroundColor="transparent" style="light" />` para desenhar conteúdo por baixo da barra de status.
  2. No Android, instale e use `expo-navigation-bar`: `setBackgroundColorAsync('transparent')` e `setPositionAsync('absolute')` num `useEffect` para tornar a barra inferior (Home/Voltar) invisível.
- **Dimensões Reais:** Use `Dimensions.get('screen')` em vez de `window`. No Android, o `window` ignora as barras de sistema, o que causaria fundos brancos ou faixas claras no topo/base da tela.
- **Performance de Animação:** Sempre aplique `scrollEventThrottle={16}` em listas animadas (FlatList) para garantir que as interpolações baseadas em scroll sejam processadas a 60fps sem atrasos visuais.

## 13. Expo Router: Ocultar Abas Indesejadas (Infiltrados)
O Expo Router, ao usar o layout `<Tabs>`, tenta auto-gerar abas para cada ficheiro ou pasta que encontra no diretório `app/(app)`. Isto inclui rotas dinâmicas como `[id].tsx` e sub-ecrãs como `create.tsx`.
- **O Problema:** Ecrãs de detalhe ou criação aparecem como abas vazias ou com nomes técnicos na barra inferior (ex: `notes/[id]`).
- **A Solução:** No ficheiro `app/(app)/_layout.tsx`, deve-se declarar explicitamente cada uma destas rotas dentro do componente `<Tabs>` e definir `options={{ href: null }}`.
- **Atenção Especial:** É obrigatório listar rotas dinâmicas individualmente (ex: `orders/[id]`, `notes/[id]`), pois o Expo Router não as oculta automaticamente apenas por ocultar a pasta raiz (`orders/index`).

## 14. Expo SDK Experimental (v54/v55+) e Canary
Ao utilizar versões experimentais do Expo (como o SDK 54 Canary), o ambiente torna-se extremamente sensível a versões de React e React Native.
- **O Problema:** O Expo Go pode fechar sozinho ou dar erro de "incompatibilidade" se o `package.json` tiver versões de React (ex: v19) que o SDK ainda não suporta totalmente ou que exigem builds nativas (`npx expo run:android`).
- **A Solução:** Alinhar sempre com os resultados do `npx expo-doctor`. Se o Doctor exigir React 19 e RN 0.81.5, use exatamente essas versões e force a instalação com `npm install --force`.

## 15. Assets e Imagens (PNG vs JPG)
O Expo Go e os processos de build (`prebuild`) são rigorosos com o formato dos ícones e splash screens.
- **O Erro:** `Field: icon - field 'icon' should point to .png image but the file has type jpg`.
- **A Regra:** Nunca renomeie um `.jpg` para `.png` manualmente. Isso não muda os "magic bytes" do ficheiro e fará a App crashar no arranque. Use ferramentas de conversão reais (como Jimp ou Sharp) para garantir que o ficheiro é um PNG verdadeiro. Se a App não abrir mesmo com o servidor a correr, verifique os assets no `app.json`.

## 16. RLS: Erro de Recursão Infinita (Infinite Recursion)
Ao criar políticas RLS que consultam a própria tabela de utilizadores (ex: para verificar se alguém é `admin`), o PostgreSQL entra em loop infinito.
- **A Solução:** Criar uma função auxiliar com `SECURITY DEFINER` (que ignora o RLS) para fazer a verificação de privilégios:
  ```sql
  CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS BOOLEAN AS $$
  BEGIN
    RETURN (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin') 
            OR auth.jwt() ->> 'email' = 'admin@example.com');
  END; $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
- **Uso:** Utilize `USING (public.is_super_admin())` nas políticas das outras tabelas.

## 17. Sincronização Delta (updated_at)
O motor de sincronização (`syncData.ts`) utiliza a técnica de *Delta Sync* para performance, procurando apenas registos alterados desde o último "pull".
- **A Regra:** **Todas** as tabelas sincronizadas (Categorias, Fornecedores, Clientes, Histórico, etc.) DEVEM ter obrigatoriamente a coluna `updated_at TIMESTAMPTZ DEFAULT now()`. Sem esta coluna, a consulta de sincronização falhará com o erro `column "updated_at" does not exist`.
