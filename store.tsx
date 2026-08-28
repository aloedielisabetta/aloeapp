
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AppData, Patient, Product, Order, Recipe,
  CityFolder, ModifierGroup, Salesperson,
  GeneralCost, Workspace, WorkspaceUser, UserRole, RawMaterial, LaborRecord
} from './types';
import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

interface AppContextType extends AppData {
  currentWorkspace: Workspace | null;
  currentUser: { role: UserRole; id?: string; name?: string; salespersonId?: string } | null;
  setCurrentWorkspace: (w: Workspace | null) => void;
  setCurrentUser: (u: { role: UserRole; id?: string; name?: string; salespersonId?: string } | null) => void;
  isLoadingProfile: boolean;

  addPatient: (p: Omit<Patient, 'id' | 'workspaceId'>) => Promise<void>;
  updatePatient: (p: Patient) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;

  addOrder: (o: Omit<Order, 'id' | 'workspaceId'>) => Promise<void>;
  updateOrder: (o: Order) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;

  addProduct: (p: Omit<Product, 'id' | 'workspaceId'>) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addRecipe: (r: Omit<Recipe, 'id' | 'workspaceId'>) => Promise<void>;
  updateRecipe: (r: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;

  addCity: (name: string) => Promise<void>;
  deleteCity: (id: string) => Promise<void>;

  addSalesperson: (name: string) => Promise<void>;
  updateSalesperson: (s: Salesperson) => Promise<void>;
  deleteSalesperson: (id: string) => Promise<void>;

  addGeneralCost: (c: Omit<GeneralCost, 'id' | 'workspaceId'>) => Promise<void>;
  deleteGeneralCost: (id: string) => Promise<void>;

  addLaborRecord: (r: Omit<LaborRecord, 'id' | 'workspaceId'>) => Promise<void>;
  deleteLaborRecord: (id: string) => Promise<void>;

  addWorkspaceUser: (u: Omit<WorkspaceUser, 'id' | 'workspaceId'> & { password?: string }) => Promise<void>;
  updateWorkspaceUser: (u: WorkspaceUser) => Promise<void>;
  deleteWorkspaceUser: (id: string) => Promise<void>;
  setWorkspaceUsers: React.Dispatch<React.SetStateAction<WorkspaceUser[]>>;

  addModifierGroup: (g: Omit<ModifierGroup, 'id' | 'workspaceId'>) => Promise<void>;
  updateModifierGroup: (g: ModifierGroup) => Promise<void>;
  deleteModifierGroup: (id: string) => Promise<void>;

  addRawMaterial: (rm: Omit<RawMaterial, 'id' | 'workspaceId'>) => Promise<void>;
  updateRawMaterial: (rm: RawMaterial) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;

  createWorkspace: (name: string, password?: string) => Promise<Workspace>;
  updateWorkspace: (ws: Workspace) => Promise<void>;
  deleteCurrentWorkspace: () => Promise<void>;

  workspaces: Workspace[];
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;

  isSyncing: boolean;
  syncData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toSnake = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toSnake);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      // Skip UUID keys (e.g. selectedModifiers keys are group UUIDs)
      const snakeKey = UUID_RE.test(key) ? key : key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      let val = obj[key];
      // Convert empty strings for UUID columns to null so Postgres doesn't throw 'invalid input syntax for type uuid: ""'
      if (val === '' && (
        snakeKey === 'user_id' || 
        snakeKey === 'salesperson_id' || 
        snakeKey === 'patient_id' || 
        snakeKey === 'workspace_id' || 
        snakeKey === 'product_id' || 
        snakeKey === 'id'
      )) {
        val = null;
      }
      acc[snakeKey] = toSnake(val);
      return acc;
    }, {} as any);
  }
  return obj;
};

const toCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      // Skip UUID keys (e.g. selectedModifiers keys are group UUIDs)
      const camelKey = UUID_RE.test(key) ? key : key.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      acc[camelKey] = toCamel(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentUser, setCurrentUser] = useState<{ role: UserRole; id?: string; name?: string; salespersonId?: string } | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  // Starts true — prevents ProtectedRoute from redirecting before we know who the user is
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  // Track which user ID we've already loaded — prevents tab-switch reloads caused by token refresh
  const loadedUserIdRef = React.useRef<string | null>(null);

  // App Data Collections
  const [patients, setPatients] = useState<Patient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cities, setCities] = useState<CityFolder[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [generalCosts, setGeneralCosts] = useState<GeneralCost[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [laborRecords, setLaborRecords] = useState<LaborRecord[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // If no session at all, we're done loading
      if (!session) setIsLoadingProfile(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth Change] Event:", event, "Session present:", !!session);
      if (event === 'TOKEN_REFRESHED') return;

      if (session) {
        if (loadedUserIdRef.current !== session.user.id) {
          setIsLoadingProfile(true);
        }
        setSession(session);
      } else {
        // Double-check with getSession before clearing user state to ignore stale null session events
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          console.log("[Auth Change] Stale null session event ignored; active session present.");
          setSession(currentSession);
          return;
        }

        setCurrentUser(null);
        setCurrentWorkspace(null);
        loadedUserIdRef.current = null;
        setIsLoadingProfile(false);
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load User Data based on Session
  useEffect(() => {
    const loadUserData = async () => {
      if (!session?.user) {
        setIsLoadingProfile(false);
        return;
      }

      // If we already loaded data for this exact user, don't reload.
      if (loadedUserIdRef.current === session.user.id && currentUser) {
        setIsLoadingProfile(false);
        return;
      }

      console.log("Loading profile for:", session.user.email);
      setIsLoadingProfile(true);

      try {
        // 1. Try Admin Check First (Owner) - Most common for the owner
        const { data: ownedWs, error: wsError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', session.user.id);

        if (wsError) console.error("Workspace error:", wsError);

        if (ownedWs && ownedWs.length > 0) {
          console.log("Admin role detected");
          const ws = toCamel(ownedWs[0]);
          setWorkspaces(ownedWs.map(toCamel));
          setCurrentWorkspace(ws);
          setCurrentUser({
            role: 'admin',
            id: session.user.id,
            name: session.user.email || 'Amministratore'
          });
          loadedUserIdRef.current = session.user.id; // mark as loaded
          return;
        }

        // 2. Try Collaborator Check
        const { data: memberUser, error: memberError } = await supabase
          .from('workspace_users')
          .select('*, workspaces(*)')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (memberError) console.error("Collaborator error:", memberError);

        if (memberUser && memberUser.workspaces) {
          console.log("Collaborator role detected");
          const ws = toCamel(memberUser.workspaces);
          setWorkspaces([ws]);
          setCurrentWorkspace(ws);
          setCurrentUser({
            role: 'collaborator',
            id: memberUser.id,
            name: memberUser.username,
            salespersonId: memberUser.salesperson_id
          });
          loadedUserIdRef.current = session.user.id; // mark as loaded
          return;
        }

        console.warn("User authenticated but no workspace profile found.");
        // If we reach here, the user exists in Auth but has no data.
        // We'll leave currentUser null to keep them at login.
      } catch (e) {
        console.error("Critical identity load error:", e);
      } finally {
        setIsSyncing(false);
        // Always mark profile loading as done, regardless of outcome
        setIsLoadingProfile(false);
      }
    };

    loadUserData();
  }, [session]);

  const syncData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setIsSyncing(true);
    console.log("Syncing data for workspace:", currentWorkspace.id);

    try {
      const fetchT = async (t: string) => {
        const { data, error } = await supabase.from(t).select('*').eq('workspace_id', currentWorkspace.id);
        if (error) {
          console.error(`Sync error for table ${t}:`, error);
          return [];
        }
        return (data || []).map(toCamel);
      };

      const [p, pr, o, r, c, m, s, g, u, rm, lr] = await Promise.all([
        fetchT('patients'), fetchT('products'), fetchT('orders'), fetchT('recipes'),
        fetchT('city_folders'), fetchT('modifier_groups'), fetchT('salespersons'),
        fetchT('general_costs'), fetchT('workspace_users'), fetchT('raw_materials'),
        fetchT('labor_records')
      ]);

      // Sanitize orders: ensure items is always an array, and each item has selectedModifiers as string[]
      // We also repair any corrupted modifier keys (e.g. from prior camel/snake conversion) by matching against the modifier groups list (m)
      const sanitizedOrders = o.map((order: any) => ({
        ...order,
        isHome: !!order.isHome,
        isLab: !!order.isLab,
        isDelivery: !!order.isDelivery,
        isShipping: !!order.isShipping,
        items: (order.items || []).map((item: any) => {
          const repairedModifiers: Record<string, string[]> = {};
          Object.entries(item.selectedModifiers || {}).forEach(([k, v]) => {
            const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            const matchingGroup = m.find((group: any) => group.id.toLowerCase().replace(/[^a-z0-9]/g, '') === normK);
            const targetKey = matchingGroup ? matchingGroup.id : k;
            repairedModifiers[targetKey] = Array.isArray(v) ? v : (v && v !== '' ? [v] : []);
          });
          return {
            ...item,
            selectedModifiers: repairedModifiers
          };
        }),
      }));

      // Sanitize recipes: ensure ingredients is always an array
      const sanitizedRecipes = r.map((recipe: any) => ({
        ...recipe,
        ingredients: recipe.ingredients || [],
      }));

      // Sanitize products: ensure modifierGroupIds is always an array
      const sanitizedProducts = pr.map((product: any) => ({
        ...product,
        modifierGroupIds: product.modifierGroupIds || [],
      }));

      // Sanitize patients: ensure journal is always an array
      const sanitizedPatients = p.map((patient: any) => ({
        ...patient,
        journal: patient.journal || [],
      }));

      setPatients(sanitizedPatients); setProducts(sanitizedProducts); setOrders(sanitizedOrders);
      setRecipes(sanitizedRecipes); setCities(c);
      setModifierGroups(m); setSalespersons(s); setGeneralCosts(g); setWorkspaceUsers(u); setRawMaterials(rm);
      setLaborRecords(lr || []);
      console.log("Sync completed successfully.");
    } catch (e) {
      console.error("Global sync exception:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => { if (currentWorkspace?.id) syncData(); }, [syncData, currentWorkspace?.id]);

  const addPatient = async (p: Omit<Patient, 'id' | 'workspaceId'>) => {
    if (!currentWorkspace) return;
    const patientData = {
      ...p,
      id: crypto.randomUUID(),
      workspaceId: currentWorkspace.id,
      salespersonId: p.salespersonId || currentUser?.salespersonId // Auto-tag if collaborator, or use selected
    };
    const { error } = await supabase.from('patients').insert(toSnake(patientData));
    if (error) throw error;
    setPatients(prev => [...prev, patientData as Patient]);
  };

  const updatePatient = async (p: Patient) => {
    const { error } = await supabase.from('patients').update(toSnake(p)).eq('id', p.id);
    if (error) throw error;
    setPatients(prev => prev.map(item => item.id === p.id ? p : item));
  };

  const deletePatient = async (id: string) => {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) throw error;
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  const addProduct = async (p: Omit<Product, 'id' | 'workspaceId'>) => {
    if (!currentWorkspace) return;
    const newP = { ...p, id: crypto.randomUUID(), workspaceId: currentWorkspace.id };
    const { error } = await supabase.from('products').insert(toSnake(newP));
    if (error) throw error;
    setProducts(prev => [...prev, newP as Product]);
  };

  const updateProduct = async (p: Product) => {
    const { error } = await supabase.from('products').update(toSnake(p)).eq('id', p.id);
    if (error) throw error;
    setProducts(prev => prev.map(item => item.id === p.id ? p : item));
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    setProducts(prev => prev.filter(p => p.id !== id));
    setRecipes(prev => prev.filter(r => r.productId !== id));
  };

  const addOrder = async (o: Omit<Order, 'id' | 'workspaceId'>) => {
    if (!currentWorkspace) return;
    const newO = { ...o, id: crypto.randomUUID(), workspaceId: currentWorkspace.id };
    const { error } = await supabase.from('orders').insert(toSnake(newO));
    if (error) throw error;
    setOrders(prev => [newO as Order, ...prev]);
  };

  const updateOrder = async (o: Order) => {
    const { error } = await supabase.from('orders').update(toSnake(o)).eq('id', o.id);
    if (error) throw error;
    setOrders(prev => prev.map(item => item.id === o.id ? o : item));
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const addRecipe = async (r: Omit<Recipe, 'id' | 'workspaceId'>) => {
    if (!currentWorkspace) return;
    const newR = { ...r, id: crypto.randomUUID(), workspaceId: currentWorkspace.id };
    const { error } = await supabase.from('recipes').insert(toSnake(newR));
    if (error) throw error;
    setRecipes(prev => [...prev, newR as Recipe]);
  };

  const updateRecipe = async (r: Recipe) => {
    const { error } = await supabase.from('recipes').update(toSnake(r)).eq('id', r.id);
    if (error) throw error;
    setRecipes(prev => prev.map(item => item.id === r.id ? r : item));
  };

  const deleteRecipe = async (id: string) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw error;
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const addCity = async (name: string) => {
    if (!currentWorkspace) return;
    const newC = { id: crypto.randomUUID(), workspaceId: currentWorkspace.id, name };
    const { error } = await supabase.from('city_folders').insert(toSnake(newC));
    if (error) throw error;
    setCities(prev => [...prev, newC]);
  };

  const deleteCity = async (id: string) => {
    const { error } = await supabase.from('city_folders').delete().eq('id', id);
    if (error) throw error;
    setCities(prev => prev.filter(c => c.id !== id));
  };

  const addSalesperson = async (name: string) => {
    if (!currentWorkspace) return;
    const newS = { id: crypto.randomUUID(), workspaceId: currentWorkspace.id, name, isHidden: false };
    const { error } = await supabase.from('salespersons').insert(toSnake(newS));
    if (error) throw error;
    setSalespersons(prev => [...prev, newS]);
  };

  const updateSalesperson = async (s: Salesperson) => {
    const { error } = await supabase.from('salespersons').update(toSnake(s)).eq('id', s.id);
    if (error) throw error;
    setSalespersons(prev => prev.map(item => item.id === s.id ? s : item));
  };

  const deleteSalesperson = async (id: string) => {
    const { error } = await supabase.from('salespersons').delete().eq('id', id);
    if (error) throw error;
    setSalespersons(prev => prev.filter(s => s.id !== id));
    setWorkspaceUsers(prev => prev.filter(u => u.salespersonId !== id));
  };

  const addGeneralCost = async (c: Omit<GeneralCost, 'id' | 'workspaceId'>) => {
    if (!currentWorkspace) return;
    const newC = { ...c, id: crypto.randomUUID(), workspaceId: currentWorkspace.id, date: c.date || new Date().toISOString() };
    const { error } = await supabase.from('general_costs').insert(toSnake(newC));
    if (error) throw error;
    setGeneralCosts(prev => [...prev, newC as GeneralCost]);
  };

  const deleteGeneralCost = async (id: string) => {
    const { error } = await supabase.from('general_costs').delete().eq('id', id);
    if (error) throw error;
    setGeneralCosts(prev => prev.filter(c => c.id !== id));
  };

  const addLaborRecord = async (r: Omit<LaborRecord, 'id' | 'workspaceId'>) => {
    if (!currentWorkspace) return;
    const newR = { ...r, id: crypto.randomUUID(), workspaceId: currentWorkspace.id, date: r.date || new Date().toISOString() };
    const { error } = await supabase.from('labor_records').insert(toSnake(newR));
    if (error) throw error;
    setLaborRecords(prev => [...prev, newR as LaborRecord]);
  };

  const deleteLaborRecord = async (id: string) => {
    const { error } = await supabase.from('labor_records').delete().eq('id', id);
    if (error) throw error;
    setLaborRecords(prev => prev.filter(r => r.id !== id));
  };

  const addWorkspaceUser = async (u: Omit<WorkspaceUser, 'id' | 'workspaceId'> & { password?: string }) => {
    if (!currentWorkspace) return;

    // Generate a simple 6-character magic code
    const magicCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const formattedUsername = u.username.trim().toLowerCase().replace(/\s+/g, '');
    const authEmail = `${formattedUsername}@aloe.system`;

    // Pre-create Auth user with magicCode as initial temporary password using isolated temp client
    const tempClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    let userId: string | null = null;
    const { data: authData, error: signUpError } = await tempClient.auth.signUp({
      email: authEmail,
      password: magicCode,
    });

    if (authData?.user?.id) {
      userId = authData.user.id;
    } else if (signUpError) {
      console.log("Auth user already exists during signUp:", signUpError.message);
      // 1. Try logging in with the newly generated magicCode (if account already has it)
      let { data: signInData } = await tempClient.auth.signInWithPassword({
        email: authEmail,
        password: magicCode
      });
      
      if (!signInData?.user) {
        // 2. Try logging in with previous stored magicCode/password if known
        const existingUserRecord = workspaceUsers.find(wu => wu.username.trim().toLowerCase() === formattedUsername);
        const previousPwd = existingUserRecord?.magicCode || existingUserRecord?.password;
        if (previousPwd) {
          const res = await tempClient.auth.signInWithPassword({
            email: authEmail,
            password: previousPwd
          });
          signInData = res.data;
        }
      }

      if (signInData?.user) {
        userId = signInData.user.id;
        // Ensure Auth password matches the new magicCode
        await tempClient.auth.updateUser({ password: magicCode });
      }
    }

    const existingIndex = workspaceUsers.findIndex(wu => wu.username.trim().toLowerCase() === formattedUsername);

    if (existingIndex >= 0) {
      const existingUser = workspaceUsers[existingIndex];
      const updatedU = {
        ...existingUser,
        ...u,
        userId: userId || existingUser.userId || null,
        salespersonId: u.salespersonId || existingUser.salespersonId || null,
        magicCode,
        password: magicCode,
        inviteStatus: 'pending'
      };
      const { error } = await supabase.from('workspace_users').update(toSnake(updatedU)).eq('id', existingUser.id);
      if (error) throw error;
      setWorkspaceUsers(prev => prev.map((item, idx) => idx === existingIndex ? (updatedU as WorkspaceUser) : item));
    } else {
      const newU = {
        ...u,
        id: crypto.randomUUID(),
        workspaceId: currentWorkspace.id,
        userId: userId || null,
        salespersonId: u.salespersonId || null,
        magicCode,
        inviteStatus: 'pending'
      };

      const { error } = await supabase.from('workspace_users').insert(toSnake(newU));
      if (error) throw error;

      setWorkspaceUsers(prev => [...prev, newU as WorkspaceUser]);
    }
  };

  const deleteWorkspaceUser = async (id: string) => {
    const { error } = await supabase.from('workspace_users').delete().eq('id', id);
    if (error) throw error;
    setWorkspaceUsers(prev => prev.filter(u => u.id !== id));
  };

  const updateWorkspaceUser = async (u: WorkspaceUser) => {
    const updatedU = {
      ...u,
      userId: u.userId || null,
      salespersonId: u.salespersonId || null
    };
    const { error } = await supabase.from('workspace_users').update(toSnake(updatedU)).eq('id', u.id);
    if (error) throw error;
    setWorkspaceUsers(prev => prev.map(item => item.id === u.id ? u : item));
    // If it's the current user, update the state as well
    if (currentUser?.id === u.id) {
      setCurrentUser({ ...currentUser, email: u.email });
    }
  };

  const addModifierGroup = async (g: Omit<ModifierGroup, 'id' | 'workspaceId'>) => {
    if (!currentWorkspace) return;
    const newG = { ...g, id: crypto.randomUUID(), workspaceId: currentWorkspace.id };
    const { error } = await supabase.from('modifier_groups').insert(toSnake(newG));
    if (error) throw error;
    setModifierGroups(prev => [...prev, newG as ModifierGroup]);
  };

  const updateModifierGroup = async (g: ModifierGroup) => {
    const { error } = await supabase.from('modifier_groups').update(toSnake(g)).eq('id', g.id);
    if (error) throw error;
    setModifierGroups(prev => prev.map(item => item.id === g.id ? g : item));
  };

  const deleteModifierGroup = async (id: string) => {
    const { error } = await supabase.from('modifier_groups').delete().eq('id', id);
    if (error) throw error;
    setModifierGroups(prev => prev.filter(g => g.id !== id));
    setRecipes(prev => prev.filter(r => r.modifierGroupId !== id));
  };

  const addRawMaterial = async (rm: Omit<RawMaterial, 'id' | 'workspaceId'>) => {
    if (!currentWorkspace) return;
    const newRM = { ...rm, id: crypto.randomUUID(), workspaceId: currentWorkspace.id };
    const { error } = await supabase.from('raw_materials').insert(toSnake(newRM));
    if (error) throw error;
    setRawMaterials(prev => [...prev, newRM as RawMaterial]);
  };

  const updateRawMaterial = async (rm: RawMaterial) => {
    const { error } = await supabase.from('raw_materials').update(toSnake(rm)).eq('id', rm.id);
    if (error) throw error;
    setRawMaterials(prev => prev.map(item => item.id === rm.id ? rm : item));
  };

  const deleteRawMaterial = async (id: string) => {
    const { error } = await supabase.from('raw_materials').delete().eq('id', id);
    if (error) throw error;
    setRawMaterials(prev => prev.filter(rm => rm.id !== id));
  };

  const createWorkspace = async (name: string, password?: string) => {
    if (!session?.user?.id) throw new Error('Not authenticated');
    // We still keep adminPassword for now if used for other things, but rely on ownerId for auth
    const newWs = { id: crypto.randomUUID(), name, adminPassword: password, ownerId: session.user.id, ownerEmail: session.user.email };
    const { error } = await supabase.from('workspaces').insert(toSnake(newWs));
    if (error) throw error;
    setWorkspaces(prev => [...prev, newWs]);
    // Do NOT auto-login/select here anymore per user request. 
    // The component handles the next steps (sign out / redirect).
    return newWs;
  };

  const updateWorkspace = async (ws: Workspace) => {
    const { error } = await supabase.from('workspaces').update(toSnake(ws)).eq('id', ws.id);
    if (error) throw error;
    setCurrentWorkspace(ws);
    setWorkspaces(prev => prev.map(item => item.id === ws.id ? ws : item));
  };

  const deleteCurrentWorkspace = async () => {
    if (!currentWorkspace?.id) return;
    await supabase.from('workspaces').delete().eq('id', currentWorkspace.id);
    setCurrentWorkspace(null);
    setCurrentUser(null);
    // Optional: stay logged in but no workspace, or reload
    window.location.reload();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUser(null);
    setCurrentWorkspace(null);
    loadedUserIdRef.current = null;
  };

  return (
    <AppContext.Provider value={{
      patients, products, orders, recipes, cities, modifierGroups, salespersons, generalCosts, workspaceUsers, rawMaterials, laborRecords,
      addPatient, updatePatient, deletePatient, addOrder, updateOrder, deleteOrder, addProduct, updateProduct, deleteProduct,
      addRecipe, updateRecipe, deleteRecipe, addCity, deleteCity, addSalesperson, updateSalesperson, deleteSalesperson, addGeneralCost, deleteGeneralCost,
      addLaborRecord, deleteLaborRecord,
      addWorkspaceUser, updateWorkspaceUser, deleteWorkspaceUser, setWorkspaceUsers, addModifierGroup, updateModifierGroup, deleteModifierGroup, addRawMaterial, updateRawMaterial, deleteRawMaterial,
      createWorkspace, updateWorkspace, deleteCurrentWorkspace, currentWorkspace, setCurrentWorkspace, currentUser, setCurrentUser, workspaces, setWorkspaces, isSyncing, syncData, signOut, isLoadingProfile
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
