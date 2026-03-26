---
name: SmartS Senior Architecture & Security Patterns
description: Padrões avançados de Multi-tenancy, Isolamento de Dados, Hardening de Auditoria e Paginação SQL para escalabilidade.
---

# SmartS Senior Architecture & Security Patterns

Esta skill documenta os padrões de arquitetura de nível sénior implementados para garantir que o SmartS é uma plataforma SaaS segura, privada e de alta performance.

## 1. Multi-tenant Absolute Isolation (Prevenção de IDOR)
O sistema foi blindado para que os dados de uma empresa nunca sejam visíveis por outra, mesmo que um utilizador malintencionado tente adivinhar IDs (Insecure Direct Object Reference).

- **Regra de Ouro:** Todos os métodos `getAll`, `getById`, `update` e `delete` nos Repositórios **DEVEM** aceitar um `companyId: string` como primeiro ou segundo argumento.
- **SQL Seguro:** Nunca faça `SELECT * FROM table`. Use sempre `WHERE company_id = ?`.
- **Camada de Serviço:** O `Service` é responsável por extrair o `activeCompanyId` do `useCompanyStore.getState()` e passá-lo obrigatoriamente para o `Repository`.

## 2. Paginação SQL & Performance (Lazy Loading)
Para suportar milhares de produtos e pedidos sem travar a interface:

- **Repositórios:** Os métodos `getAll` devem suportar `limit` e `offset`.
  ```sql
  SELECT * FROM table WHERE company_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
  ```
- **Hooks (useInfiniteScroll):** Os hooks de UI (`useProducts`, `useOrders`, etc.) devem manter o estado da `page` e `hasMore`. Devem expor uma função `loadMore` que incrementa o offset e concatena os novos dados aos existentes.
- **UI (FlatList):** Use sempre `onEndReached` e `onEndReachedThreshold={0.5}`. Adicione um `ActivityIndicator` no `ListFooterComponent` quando `hasMore` for verdadeiro.

## 3. Auditoria & Integridade (History Logs)
Cada ação destrutiva ou de alteração de dados sensíveis (Preços, Stock, Clientes) deve ser registada no histórico.

- **Padrão:** O `service` deve chamar `historyRepository.log(companyId, action, table, recordId, userId, data)` após uma operação bem-sucedida.
- **Transações:** Para operações complexas (ex: Criar Pedido + Baixar Stock), use `db.runSync('BEGIN TRANSACTION')` e `COMMIT/ROLLBACK` para garantir que a base de dados nunca fique em estado inconsistente.

## 4. Infraestrutura Multi-tenant (Sync & Notifications)
Até as tabelas de suporte técnico devem ser isoladas por empresa no SQLite local:

- **Migração 019:** Garante que `sync_queue` e `notifications` têm a coluna `company_id`.
- **Privacidade em Dispositivos Partilhados:** Se dois utilizadores de empresas diferentes usarem o mesmo tablet (ex: troca de turno), a lógica de `notificationStore` garante que as notificações carregadas pertencem apenas à `activeCompanyId` atual.

## 5. TypeScript Strictness (Zero Errors)
Para garantir builds estáveis em CI/CD (EAS Build):

- **NUNCA** use `any`.
- Se um parâmetro for opcional (ex: `limit`), defina um valor por defeito.
- Mantenha os tipos em `@/types/index.ts` sincronizados com o esquema SQLite.

## 6. Biometria e Segurança de Dispositivo
- **Detecção:** Use o hook `useBiometrics` para verificar `isSupported` antes de exibir opções de segurança.
- **Enforcement:** O bloqueio global deve ser gerido no `AppLayout` (`_layout.tsx`) usando `AppState` para re-autenticar o utilizador sempre que a aplicação volta do background (foregrounding).
- **Persistência de Estado:** Use o middleware `persist` do Zustand para garantir que flags de segurança crítica não se percam em crashes ou reboots.

---
**Status:** ✅ NÍVEL SÉNIOR ATIVADO
