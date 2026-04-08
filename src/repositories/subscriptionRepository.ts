import { db } from '@/database/sqlite'
import { addToSyncQueue } from '@/utils/syncData'
import { Subscription, SyncStatus } from '@/types'

export const subscriptionRepository = {
  get(companyId: string): Subscription | null {
    return db.getFirstSync<Subscription>(
      'SELECT * FROM subscriptions WHERE company_id = ?',
      [companyId]
    ) ?? null
  },

  upsert(subscription: Subscription): void {
    db.runSync(
      `INSERT INTO subscriptions
        (company_id, trial_started_at, trial_ends_at, plan, trial_expired, onboarding_completed, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(company_id) DO UPDATE SET
        trial_started_at    = excluded.trial_started_at,
        trial_ends_at       = excluded.trial_ends_at,
        plan                = excluded.plan,
        trial_expired       = excluded.trial_expired,
        onboarding_completed = excluded.onboarding_completed,
        updated_at          = excluded.updated_at,
        synced              = excluded.synced`,
      [
        subscription.company_id,
        subscription.trial_started_at ?? null,
        subscription.trial_ends_at ?? null,
        subscription.plan,
        subscription.trial_expired,
        subscription.onboarding_completed,
        subscription.updated_at ?? new Date().toISOString(),
        subscription.synced ?? 0,
      ]
    )
    addToSyncQueue('subscriptions', 'UPDATE', subscription)
  },

  updateSyncStatus(companyId: string, status: SyncStatus): void {
    db.runSync(
      'UPDATE subscriptions SET synced = ?, updated_at = ? WHERE company_id = ?',
      [status, new Date().toISOString(), companyId]
    )
  }
}
