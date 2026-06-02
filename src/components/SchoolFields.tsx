import { useEffect, useMemo, useState } from "react";
import { COURSE_SUGGESTIONS, PROGRAM_SUGGESTIONS } from "@/lib/academicPresets";
import { createSchool, listSchools, type School } from "@/functions/data/schools";

export interface AcademicInfo {
  school: string;       // display name (free text)
  school_id: number | null; // resolved canonical id
  course: string;
  program: string;
}

interface SchoolFieldsProps {
  value: AcademicInfo;
  onChange: (next: AcademicInfo) => void;
  /** Hide field labels (used in compact contexts). */
  compact?: boolean;
}

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-border bg-canvas text-text text-sm placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

const CUSTOM_SCHOOL_VALUE = "__custom_school__";

/**
 * School field backed by the schools DB.
 * Resolves free-text input to a canonical school_id so leaderboards
 * can group users even when they type different variants of the same name.
 * Course / program remain free-text with generic datalist suggestions.
 */
export default function SchoolFields({
  value,
  onChange,
  compact = false,
}: SchoolFieldsProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolsError, setSchoolsError] = useState(false);
  const [customSchoolMode, setCustomSchoolMode] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSchools = async () => {
      setSchoolsLoading(true);
      setSchoolsError(false);

      try {
        const results = await listSchools();
        if (active) setSchools(results);
      } catch {
        if (active) setSchoolsError(true);
      } finally {
        if (active) setSchoolsLoading(false);
      }
    };

    loadSchools();

    return () => {
      active = false;
    };
  }, []);

  const schoolOptions = useMemo(() => {
    if (!value.school_id || !value.school.trim()) return schools;

    const selectedExists = schools.some((school) => school.id === value.school_id);
    if (selectedExists) return schools;

    return [...schools, { id: value.school_id, name: value.school }].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [schools, value.school, value.school_id]);

  const showCustomSchool =
    schoolsError || customSchoolMode || (!value.school_id && value.school.trim().length > 0);

  const selectedSchoolValue = showCustomSchool
    ? CUSTOM_SCHOOL_VALUE
    : value.school_id
      ? String(value.school_id)
      : "";

  const handleSchoolSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;

    if (!selected) {
      setCustomSchoolMode(false);
      onChange({ ...value, school: "", school_id: null });
      return;
    }

    if (selected === CUSTOM_SCHOOL_VALUE) {
      setCustomSchoolMode(true);
      onChange({ ...value, school: "", school_id: null });
      return;
    }

    const school = schoolOptions.find((item) => item.id === Number(selected));
    if (!school) return;

    setCustomSchoolMode(false);
    onChange({ ...value, school: school.name, school_id: school.id });
  };

  const handleCustomSchoolInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, school: e.target.value, school_id: null });
  };

  const handleCustomSchoolBlur = async () => {
    const school = value.school.trim();
    if (!school || value.school_id) return;

    try {
      const created = await createSchool(school);
      setSchools((current) => {
        if (current.some((item) => item.id === created.id)) return current;

        return [...current, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setCustomSchoolMode(false);
      onChange({ ...value, school: created.name, school_id: created.id });
    } catch {
      // Leave as free-text; school_id stays null.
    }
  };

  const field =
    (key: "course" | "program") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, [key]: e.target.value });

  return (
    <div className="space-y-4">
      <div>
        {!compact && (
          <label className="block text-sm font-medium text-text mb-2">
            School / University
          </label>
        )}
        <select
          className={inputClass}
          value={selectedSchoolValue}
          onChange={handleSchoolSelect}
          disabled={schoolsLoading && schoolOptions.length === 0}
        >
          <option value="">
            {schoolsLoading ? "Loading schools..." : "Select your school / university"}
          </option>
          {schoolOptions.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
          <option value={CUSTOM_SCHOOL_VALUE}>Other / Not listed</option>
        </select>
        {schoolsError && (
          <p className="mt-2 text-xs text-text-muted">
            School list unavailable. Enter your school manually.
          </p>
        )}
        {showCustomSchool && (
          <input
            type="text"
            className={`${inputClass} mt-3`}
            placeholder="Enter your school / university"
            value={value.school}
            onChange={handleCustomSchoolInput}
            onBlur={handleCustomSchoolBlur}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          {!compact && (
            <label className="block text-sm font-medium text-text mb-2">
              Course / Program of Study
            </label>
          )}
          <input
            type="text"
            list="course-suggestions"
            className={inputClass}
            placeholder="e.g. Information Technology"
            value={value.course}
            onChange={field("course")}
          />
          <datalist id="course-suggestions">
            {COURSE_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          {!compact && (
            <label className="block text-sm font-medium text-text mb-2">
              Internship Program
            </label>
          )}
          <input
            type="text"
            list="program-suggestions"
            className={inputClass}
            placeholder="e.g. On-the-Job Training (OJT)"
            value={value.program}
            onChange={field("program")}
          />
          <datalist id="program-suggestions">
            {PROGRAM_SUGGESTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
}
