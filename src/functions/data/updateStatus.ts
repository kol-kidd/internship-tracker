import { supabase } from "@/config/supabaseClient";

export async function updateAppStatus(userId: string, appId: number, status: string) {
     const { data: existingUser, error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

    if(checkError && checkError.code != "PGRST116"){
        return {
            data: { user: null, session: null},
            error: checkError
        };
    }

    if(!existingUser) {
        return {
            // data: { user: null, session: null},
            error: {
                message: "User not found",
                status: 400,
                name: "AuthApiError"
            }
        };
    }


    const {data: appData, error: appError} = await supabase
    .from("applications")
    .update({
        status,
        updated_at: new Date().toISOString(),
    })
    .eq('id', appId)
    .eq("user_id", userId)
    .select();

    if(appError) console.error("Application status update error: ", appError.message);
    return appData;
}