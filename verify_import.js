
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gmhyucystwoxiinyptwx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2gExbZoCjh1NBCAJO0ZPWA_Ek2M86xG';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log('--- Deep Check ---');
    // Check workspaces with owner info
    const { data: ws, error: e1 } = await supabase.from('workspaces').select('*');
    console.log('Workspaces:', ws || e1?.message);

    if (ws && ws.length > 0) {
        const wsId = ws[0].id;
        console.log('Using Workspace ID:', wsId);

        const { count: pc } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('workspace_id', wsId);
        console.log('Patient Count:', pc);

        const { count: sc } = await supabase.from('salespersons').select('*', { count: 'exact', head: true }).eq('workspace_id', wsId);
        console.log('Salespersons Count:', sc);

        const { count: uc } = await supabase.from('workspace_users').select('*', { count: 'exact', head: true }).eq('workspace_id', wsId);
        console.log('Workspace Users Count:', uc);
    }
}

check();
