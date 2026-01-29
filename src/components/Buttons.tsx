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
        bgcolor: variant === "contained" ? "#7C3AED" : undefined,
        color: variant === "contained" ? "white" : "#7C3AED",
        borderColor: variant === "outlined" ? "#7C3AED" : undefined,
        "&:hover": {
          bgcolor: variant === "contained" ? "#6D28D9" : "#DDD6FE",
          borderColor: variant === "outlined" ? "#6D28D9" : undefined,
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
