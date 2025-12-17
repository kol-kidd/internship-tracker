import TextField from "@mui/material/TextField";

type CustomInputProps = {
  id?: string;
  variant: "outlined" | "filled" | "standard";
  label: string;
  type: "text" | "password" | "email";
  value: string;
  onChange: (e: any) => void;
};

export default function CustomInput({
  id,
  variant = "standard",
  label,
  type = "text",
  value,
  onChange,
}: CustomInputProps) {
  return (
    <TextField
      id={id}
      label={label}
      variant={variant}
      type={type}
      value={value}
      size="small"
      className="w-full"
      onChange={onChange}
    />
  );
}
