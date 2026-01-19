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
    >
      {text}
    </Button>
  );
}
