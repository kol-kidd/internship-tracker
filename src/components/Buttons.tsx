import Button from "@mui/material/Button";

type ButtonProps = {
  variant?: "text" | "outlined" | "contained";
  text: string;
  disabled?: boolean;
  onClick: () => void;
};

export default function CustomButton({
  variant = "text",
  text,
  disabled,
  onClick,
}: ButtonProps) {
  return (
    <Button
      className="w-full"
      variant={variant}
      disabled={disabled}
      onClick={onClick}
      sx={{
        bgcolor: variant === "contained" ? "var(--color-primary)" : undefined,
        color: variant === "contained" ? "white" : "var(--color-primary)",
        borderColor:
          variant === "outlined" ? "var(--color-primary)" : undefined,
        "&:hover": {
          bgcolor:
            variant === "contained"
              ? "var(--color-primary-hover)"
              : "var(--color-primary)/8",
          borderColor:
            variant === "outlined" ? "var(--color-primary-hover)" : undefined,
        },
        textTransform: "none",
        fontWeight: 500,
        py: 1.5,
        borderRadius: 2,
      }}
    >
      {text}
    </Button>
  );
}
