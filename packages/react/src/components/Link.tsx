import React from "react";
import { navigate } from "../utils/navigate";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}
export const Link: React.FC<LinkProps> = ({ href, children, onClick, ...props }) => {
  return React.createElement(
    "a",
    {
      href,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (onClick) onClick(e);
        navigate(href);
      },
      ...props,
    },
    children
  );
};