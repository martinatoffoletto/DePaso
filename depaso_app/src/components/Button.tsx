import React from "react";
import {
  Button as PaperButton,
  ButtonProps as PaperButtonProps,
} from "react-native-paper";

interface CustomButtonProps extends Omit<PaperButtonProps, "mode"> {
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
}

export const Button: React.FC<CustomButtonProps> = ({
  variant = "primary",
  size = "medium",
  children,
  className,
  ...props
}) => {
  const getModeAndStyle = () => {
    if (variant === "primary") {
      return { mode: "contained" as const };
    } else if (variant === "secondary") {
      return { mode: "outlined" as const };
    } else {
      return { mode: "text" as const };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return { labelStyle: { fontSize: 12 } };
      case "large":
        return { labelStyle: { fontSize: 16 } };
      default:
        return { labelStyle: { fontSize: 14 } };
    }
  };

  return (
    <PaperButton {...getModeAndStyle()} {...getSizeStyle()} {...props}>
      {children}
    </PaperButton>
  );
};
