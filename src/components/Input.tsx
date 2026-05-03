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
    />
  );
}
