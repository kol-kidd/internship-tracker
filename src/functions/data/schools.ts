import { api } from "@/functions/data/apiClient";

export interface School {
  id: number;
  name: string;
}

/** List all schools for dropdown selection. */
export async function listSchools(): Promise<School[]> {
  const { data } = await api.get<{ schools: School[] }>("/schools");
  return data.schools;
}

/** Search schools by partial name or alias (min 2 chars). */
export async function searchSchools(q: string): Promise<School[]> {
  const { data } = await api.get<{ schools: School[] }>("/schools/search", {
    params: { q },
  });
  return data.schools;
}

/** Create a new school by canonical name (or return existing). */
export async function createSchool(name: string): Promise<School> {
  const { data } = await api.post<{ school: School }>("/schools", { name });
  return data.school;
}

/** Add an alias to a school (e.g. abbreviation). */
export async function addSchoolAlias(
  schoolId: number,
  alias: string,
): Promise<void> {
  await api.post(`/schools/${schoolId}/aliases`, { alias });
}
