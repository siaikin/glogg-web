import { css, html, LitElement, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "./global-styles";
import { componentNameJoinPrefix } from "./config/prefix";
import {
  BlobReaderFactory,
  BlobReaderFactoryOptions,
  LineByLineBlobReader,
} from "@glogg-web/file-operator";

export const LOG_RENDER_COMPONENT_NAME = componentNameJoinPrefix("log-render");

@customElement(LOG_RENDER_COMPONENT_NAME)
export class LogRenderComponent extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
        white-space: nowrap;
        height: 100%;
        width: 100%;
      }
      .wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: auto;
      }
      .content-wrapper {
        margin-block-start: 0;
        margin-block-end: 0;
        line-height: 1em;
      }
      .spacer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        z-index: -1;
      }
    `,
  ];

  @property()
  source!: Blob;

  @state()
  blobReader?: LineByLineBlobReader;

  protected override async firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);

    this.blobReader = BlobReaderFactory.getInstance(
      new BlobReaderFactoryOptions({
        baseUrl:
          "../../node_modules/@glogg-web/file-operator/dist/esm/worker/bundle",
      })
    ).getReader(this.source);
  }

  override render() {
    return html`<glogg-virtual-scroll
      .blobReader="${this.blobReader}"
    ></glogg-virtual-scroll>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [LOG_RENDER_COMPONENT_NAME]: LogRenderComponent;
  }
}
