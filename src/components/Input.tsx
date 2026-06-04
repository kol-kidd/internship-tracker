import type { ChangeEventHandler } from "react";
import TextField from "@mui/material/TextField";

type CustomInputProps = {
  id?: string;
  variant: "outlined" | "filled" | "standard";
  label: string;
  type: "text" | "password" | "email";
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  size?: "small" | "medium";
};

export default function CustomInput({
  id,
  variant = "standard",
  label,
  type = "text",
  value,
  size = "medium",
  onChange,
}: CustomInputProps) {
  return (
    <TextField
      id={id}
      label={label}
      variant={variant}
      type={type}
      value={value}
      size={size}
      className="w-full"
      onChange={onChange}
      sx={{
        "& .MuiInputBase-root": {
          color: "var(--color-text)",
          backgroundColor: "var(--color-surface)",
          borderRadius: "0.75rem",
        },
        "& .MuiInputBase-input": {
          color: "var(--color-text)",
        },
        "& .MuiInputBase-input::placeholder": {
          color: "var(--color-text-muted)",
          opacity: 1,
        },
        "& .MuiInputLabel-root": {
          color: "var(--color-text-muted)",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: "var(--color-primary)",
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--color-border)",
        },
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--color-primary)",
        },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--color-primary)",
          borderWidth: "1px",
        },
      }}
    />
  );
}
