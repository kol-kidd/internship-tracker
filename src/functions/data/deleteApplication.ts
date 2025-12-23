import { supabase } from "@/config/supabaseClient";

export async function deleteApplication(userId: string, applicationId: number) {
  console.log("Deleting application:", {
    userId,
    applicationId,
    typeOfId: typeof applicationId,
  });

  const { data: existingUser, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (checkError && checkError.code !== "PGRST116") {
    return {
      data: null,
      error: checkError,
    };
  }

  if (!existingUser) {
    return {
      data: null,
      error: {
        message: "User not found",
        status: 400,
        name: "AuthApiError",
      },
    };
  }

  const { data: appData, error: appError } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", userId)
    .select();

  if (appError) {
    console.error("Application delete error: ", appError.message);
    return {
      data: null,
      error: appError,
    };
  }

  return {
    data: appData,
    error: null,
  };
}
