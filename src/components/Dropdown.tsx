import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import Button from "@mui/material/Button";
import type { MenuProps } from "@mui/material/Menu";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {
  ChevronDown,
  ArrowUpDown,
  CalendarArrowDown,
  CalendarArrowUp,
  ArrowDownAZ,
  ArrowUpZA,
  Check,
} from "lucide-react";

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: "rgb(55, 65, 81)",
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "4px 0",
    },
    "& .MuiMenuItem-root": {
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      "&:active": {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity
        ),
      },
    },
  },
}));

type SortByType = "date_desc" | "date_asc" | "company_asc" | "company_desc";

interface SortMenuProps {
  sortBy: SortByType;
  onSortChange: (sortBy: SortByType) => void;
}

interface SortOption {
  value: SortByType;
  label: string;
  icon: React.ReactNode;
}

const sortOptions: SortOption[] = [
  {
    value: "date_desc",
    label: "Newest First",
    icon: <CalendarArrowDown className="w-4 h-4" />,
  },
  {
    value: "date_asc",
    label: "Oldest First",
    icon: <CalendarArrowUp className="w-4 h-4" />,
  },
  {
    value: "company_asc",
    label: "Company A-Z",
    icon: <ArrowDownAZ className="w-4 h-4" />,
  },
  {
    value: "company_desc",
    label: "Company Z-A",
    icon: <ArrowUpZA className="w-4 h-4" />,
  },
];

export default function SortMenu({ sortBy, onSortChange }: SortMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSortSelect = (value: SortByType) => {
    onSortChange(value);
    handleClose();
  };

  const currentSort = sortOptions.find((option) => option.value === sortBy);

  return (
    <div>
      <Button
        id="sort-menu-button"
        aria-controls={open ? "sort-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        variant="outlined"
        disableElevation
        onClick={handleClick}
        endIcon={<ChevronDown className="w-4 h-4" />}
        startIcon={<ArrowUpDown className="w-4 h-4" />}
        sx={{
          textTransform: "none",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "rgb(55, 65, 81)",
          borderColor: "rgb(209, 213, 219)",
          "&:hover": {
            borderColor: "rgb(156, 163, 175)",
            backgroundColor: "rgb(249, 250, 251)",
          },
        }}
      >
        {currentSort?.label || "Sort"}
      </Button>
      <StyledMenu
        id="sort-menu"
        MenuListProps={{
          "aria-labelledby": "sort-menu-button",
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {sortOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleSortSelect(option.value)}
            disableRipple
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              position: "relative",
              backgroundColor:
                sortBy === option.value ? "rgba(0, 0, 0, 0.04)" : "transparent",
            }}
          >
            {option.icon}
            <span style={{ flex: 1 }}>{option.label}</span>
            {sortBy === option.value && (
              <Check className="w-4 h-4" style={{ color: "rgb(0, 0, 0)" }} />
            )}
          </MenuItem>
        ))}
      </StyledMenu>
    </div>
  );
}
