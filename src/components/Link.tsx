"use client";

import NextLink, { type LinkProps } from "next/link";
import { forwardRef } from "react";

/**
 * Client wrapper for next/link so MUI `component={Link}` works under Next.js 16.
 */
const Link = forwardRef<HTMLAnchorElement, LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  function Link(props, ref) {
    return <NextLink ref={ref} {...props} />;
  },
);

export default Link;
