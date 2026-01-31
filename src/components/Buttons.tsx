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
        bgcolor: variant === "contained" ? "#c4946e" : undefined,
        color: variant === "contained" ? "white" : "#c4946e",
        borderColor: variant === "outlined" ? "#c4946e" : undefined,
        "&:hover": {
          bgcolor: variant === "contained" ? "#b8855e" : "#e8d4c4",
          borderColor: variant === "outlined" ? "#b8855e" : undefined,
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
