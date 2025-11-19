
import { supabase } from './supabaseClient';
import { GenerationJob } from '../types';

export const createJob = async (jobData: Partial<GenerationJob>): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('generation_jobs')
            .insert([{
                ...jobData,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select('id')
            .single();

        if (error) {
            console.error("Error creating generation job:", error);
            return null;
        }
        return data.id;
    } catch (e) {
        console.error("Exception creating job:", e);
        return null;
    }
};

export const updateJobStatus = async (jobId: string, status: 'pending' | 'processing' | 'completed' | 'failed', resultUrl?: string, errorMessage?: string) => {
    try {
        const updates: any = {
            status,
            updated_at: new Date().toISOString()
        };

        if (resultUrl) updates.result_url = resultUrl;
        if (errorMessage) updates.error_message = errorMessage;

        const { error } = await supabase
            .from('generation_jobs')
            .update(updates)
            .eq('id', jobId);

        if (error) {
            console.error(`Error updating job ${jobId}:`, error);
        }
    } catch (e) {
        console.error(`Exception updating job ${jobId}:`, e);
    }
};
