import { css, unsafeCSS } from "lit";
import { PRIMARY_COLOR } from "./config/css-variables";

const primary = "gray";

export const globalStyles = css`
  :host {
    ${unsafeCSS(PRIMARY_COLOR)}: ${unsafeCSS(primary)};
  }
`;
