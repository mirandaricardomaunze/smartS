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
