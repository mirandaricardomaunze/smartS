import { subscriptionRepository } from '@/repositories/subscriptionRepository'
import { supabase } from './supabase'
import NetInfo from '@react-native-community/netinfo'
import { Subscription, PlanType, SubscriptionStatus } from '@/types'

export const subscriptionService = {
  async getSubscription(companyId: string): Promise<Subscription | null> {
    const local = subscriptionRepository.get(companyId)
    const netState = await NetInfo.fetch()
    
    if (netState.isConnected && netState.isInternetReachable) {
      try {
        // 1. Fetch from subscriptions (Supabase specific)
        const { data: profile, error: profileError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('company_id', companyId)
          .single()

        if (profile) {
          const sub: Subscription = {
            company_id: companyId,
            trial_started_at: profile.trial_start,
            trial_ends_at: profile.trial_end,
            plan: profile.plan as PlanType,
            trial_expired: (this.getDaysRemaining(profile.trial_end) <= 0 ? 1 : 0) as 0 | 1,
            onboarding_completed: local?.onboarding_completed || 0,
            updated_at: profile.updated_at,
            synced: 1 as const
          }
          subscriptionRepository.upsert(sub)
          return sub
        }
        
        // If neither, initialize trial
        if (!local) return await this.initializeTrial(companyId)
      } catch (e) {
        console.error('Error fetching subscription from Supabase:', e)
      }
    }
    
    return local
  },

  async checkSubscriptionStatus(userId: string, companyId?: string): Promise<SubscriptionStatus> {
    // A função SQL foi actualizada para usar company_id como identificador primário.
    // Mantemos userId no parâmetro por compatibilidade com chamadas existentes,
    // mas usamos companyId quando disponível (mais preciso para multi-empresa).
    const { data, error } = await supabase.rpc('check_subscription', {
      target_company_id: companyId ?? userId,
    })

    if (error) {
      console.error('RPC Error:', error)
      // Fallback for offline or error
      return { status: 'ACTIVE', days_left: 30, plan: 'TRIAL' }
    }

    return data as SubscriptionStatus
  },

  async activatePlan(companyId: string, plan: PlanType): Promise<void> {
    const now = new Date().toISOString()
    const sub = subscriptionRepository.get(companyId)
    
    const updated: Subscription = {
      ...(sub || { 
        company_id: companyId, 
        trial_started_at: now, 
        trial_ends_at: now, 
        trial_expired: 0, 
        onboarding_completed: 0 
      }),
      plan,
      trial_expired: 0,
      updated_at: now,
      synced: 0 as const
    }

    subscriptionRepository.upsert(updated)

    // Sync to Supabase profile
    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        plan, 
        updated_at: now 
      })
      .eq('id', companyId) // Assuming profile ID matches company ID for simplicity in this flow

    if (!error) {
      subscriptionRepository.updateSyncStatus(companyId, 1)
    }
  },

  async initializeTrial(companyId: string): Promise<Subscription> {
    const now = new Date()
    const endsAt = new Date(now)
    endsAt.setDate(now.getDate() + 30)
    
    const subscription: Subscription = {
      company_id: companyId,
      trial_started_at: now.toISOString(),
      trial_ends_at: endsAt.toISOString(),
      plan: 'TRIAL' as PlanType,
      trial_expired: 0,
      onboarding_completed: 0,
      updated_at: now.toISOString(),
      synced: 0
    }
    
    subscriptionRepository.upsert(subscription)
    
    // Attempt background sync
    this.syncWithSupabase(subscription).catch(console.error)
    
    return subscription
  },

  async syncWithSupabase(sub: Subscription): Promise<void> {
    const netState = await NetInfo.fetch()
    if (!netState.isConnected) return

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        ...sub,
        synced: 1
      }, { onConflict: 'company_id' })

    if (!error) {
      subscriptionRepository.updateSyncStatus(sub.company_id, 1)
    } else {
      console.error('Error syncing subscription to Supabase:', error)
    }
  },

  getDaysRemaining(endsAt: string | null): number {
    if (!endsAt) return 0
    const end = new Date(endsAt)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  },

  isExpired(sub: Subscription | null): boolean {
    if (!sub) return false
    if (sub.plan !== 'TRIAL') return false
    
    const days = this.getDaysRemaining(sub.trial_ends_at)
    return days <= 0
  },

  async updateOnboarding(companyId: string, completed: boolean): Promise<void> {
    const sub = subscriptionRepository.get(companyId)
    if (sub) {
      const updated = {
        ...sub,
        onboarding_completed: (completed ? 1 : 0) as 0 | 1,
        updated_at: new Date().toISOString(),
        synced: 0 as const
      }
      subscriptionRepository.upsert(updated)
      this.syncWithSupabase(updated).catch(console.error)
    }
  },

  async adminGetAllSubscriptions(): Promise<AdminSubscriptionRow[]> {
    const [subsResult, companiesResult] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('company_id, plan, trial_started_at, trial_ends_at, updated_at')
        .order('updated_at', { ascending: false }),
      supabase
        .from('companies')
        .select('id, name, email'),
    ])

    if (subsResult.error) throw new Error(`Erro ao carregar subscrições: ${subsResult.error.message}`)
    if (companiesResult.error) throw new Error(`Erro ao carregar empresas: ${companiesResult.error.message}`)

    const companyMap = new Map(
      (companiesResult.data ?? []).map((c) => [c.id, c])
    )

    return (subsResult.data ?? []).map((p) => {
      const company = companyMap.get(p.company_id)
      return {
        id: p.company_id,
        company_id: p.company_id,
        email: company?.email ?? '',
        name: company?.name ?? '',
        plan: (p.plan ?? 'TRIAL') as PlanType,
        trial_end: p.trial_ends_at ?? null,
        days_left: this.getDaysRemaining(p.trial_ends_at),
        updated_at: p.updated_at ?? '',
      }
    })
  },

  async adminActivatePlan(companyId: string, plan: PlanType): Promise<void> {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('subscriptions')
      .update({ plan, updated_at: now })
      .eq('company_id', companyId)

    if (error) throw new Error(`Falha ao ativar plano: ${error.message}`)
  },
}

export interface AdminSubscriptionRow {
  id: string
  company_id: string
  email: string
  name: string
  plan: PlanType
  trial_end: string | null
  days_left: number
  updated_at: string
}
