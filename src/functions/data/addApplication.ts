import { supabase } from "@/config/supabaseClient";

/* 
    table for internship
    id,
    user_id,
    company_name,
    company_address,
    status,
*/

export async function addApplication(userId: string, dateApplied: Date, companyName: string, companyAddress: string, status: string) {
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
    .upsert({
        user_id: userId,
        date_applied: dateApplied,
        company_name: companyName,
        company_address: companyAddress,
        status,
    })
    .select()
    .single();

    if(appError) console.error("Application upsert error: ", appError.message);
    return appData;
}