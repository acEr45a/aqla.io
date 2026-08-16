import { supabase } from '@/lib/supabase';

// Map entity PascalCase names to database table names (plural snake_case)
const TABLE_MAP = {
  AdminOtp: 'admin_otps',
  AppSettings: 'app_settings',
  Assessment: 'assessments',
  BrainDomain: 'brain_domains',
  CaptchaConfig: 'captcha_configs',
  ClinicalFlag: 'clinical_flags',
  ClinicianReview: 'clinician_reviews',
  CognitiveTest: 'cognitive_tests',
  DailyCheckIn: 'daily_check_ins',
  DevIdea: 'dev_ideas',
  DevWordbankIdea: 'dev_wordbank_ideas',
  EmailDigest: 'email_digests',
  Experiment: 'experiments',
  GameRating: 'game_ratings',
  GameSession: 'game_sessions',
  HealthProfile: 'health_profiles',
  Ingredient: 'ingredients',
  MemberRecommendation: 'member_recommendations',
  PdfArchive: 'pdf_archives',
  PdfTheme: 'pdf_themes',
  PlanReview: 'plan_reviews',
  Protocol: 'protocols',
  SiteVisit: 'site_visits',
  SuperAdminConfig: 'super_admin_configs',
  SuperAdminLog: 'super_admin_logs',
  User: 'profiles',
  UserComplaint: 'user_complaints',
};

function getTableName(entityName) {
  return TABLE_MAP[entityName] || entityName.toLowerCase() + 's';
}

function parseOrder(orderBy) {
  if (!orderBy) return null;
  const ascending = !orderBy.startsWith('-');
  const column = ascending ? orderBy : orderBy.slice(1);
  return { column, ascending };
}

function createEntityProxy(entityName) {
  const tableName = getTableName(entityName);

  return {
    async list(orderBy, limit) {
      let query = supabase.from(tableName).select('*');
      const order = parseOrder(orderBy);
      if (order) query = query.order(order.column, { ascending: order.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async filter(filterObj = {}, orderBy, limit) {
      let query = supabase.from(tableName).select('*');
      for (const [key, value] of Object.entries(filterObj)) {
        query = query.eq(key, value);
      }
      const order = parseOrder(orderBy);
      if (order) query = query.order(order.column, { ascending: order.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    async create(record) {
      const { data: userData } = await supabase.auth.getUser();
      const payload = { ...record };
      if (userData?.user?.id && !payload.created_by_id) {
        payload.created_by_id = userData.user.id;
      }
      const { data, error } = await supabase.from(tableName).insert([payload]).select().single();
      if (error) throw error;
      return data;
    },

    async update(id, patch) {
      const { data, error } = await supabase.from(tableName).update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { data, error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return data;
    },

    async deleteMany(filterObj = {}) {
      let query = supabase.from(tableName).delete();
      for (const [key, value] of Object.entries(filterObj)) {
        query = query.eq(key, value);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  };
}

export const entities = new Proxy(
  {},
  {
    get(target, prop) {
      if (typeof prop === 'string') {
        if (!target[prop]) {
          target[prop] = createEntityProxy(prop);
        }
        return target[prop];
      }
      return Reflect.get(target, prop);
    },
  }
);

export const auth = {
  async me() {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) return null;
    const user = authData.user;
    
    // Fetch user profile from public.profiles
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || '',
      role: profile?.role || 'user',
      preferences: profile?.preferences || {},
      welcome_email_sent: profile?.welcome_email_sent || false,
      admin_trusted_devices: profile?.admin_trusted_devices || [],
      ...profile,
    };
  },

  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async register({ email, password, full_name, ...metadata }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, ...metadata },
      },
    });
    if (error) throw error;
    return data;
  },

  async logout(redirectUrl = '/') {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined' && redirectUrl) {
      window.location.href = redirectUrl;
    }
  },

  async updateMe(patch) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', authData.user.id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async loginWithProvider(provider, redirectTo) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) throw error;
    return data;
  },

  async resetPassword({ email }) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  },

  async verifyOtp({ email, token, type = 'email' }) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type });
    if (error) throw error;
    return data;
  },

  async resendOtp(email) {
    const { data, error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
    return data;
  },

  setToken(token) {
    // Handled natively by Supabase client storage
  },

  isAuthenticated() {
    return !!supabase.auth.getSession();
  },
};

export const functions = {
  async invoke(functionName, payload) {
    const { data, error } = await supabase.functions.invoke(functionName, { body: payload });
    if (error) throw error;
    return data;
  },
};

export const apiClient = {
  auth,
  entities,
  functions,
};

export default apiClient;
