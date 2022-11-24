import { LitElement, css } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { html, unsafeStatic } from "lit/static-html.js";
import { globalStyles } from "./global-styles";
import { componentNameJoinPrefix, domIdJoinPrefix } from "./config/prefix";
import { LOG_RENDER_COMPONENT_NAME } from "./log-render";
import { repeat } from "lit/directives/repeat.js";
import { notUAN } from "@siaikin/utils";

const COMPONENT_NAME = componentNameJoinPrefix("view");

@customElement(COMPONENT_NAME)
export class GloggViewComponent extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        font-size: 14px;
      }
      .log-render-wrapper {
        flex: 1 1 auto;
        overflow: hidden;
      }
    `,
  ];

  @query(`#${domIdJoinPrefix("file-select")}`)
  fileSelect!: HTMLInputElement;

  @state()
  selectedFileList: Array<File> = [];

  override async connectedCallback() {
    super.connectedCallback();
  }

  override render() {
    return html`
      <input
        id="${domIdJoinPrefix("file-select")}"
        type="file"
        multiple
        style="flex: 0 0 auto"
        @change="${this.handleFileSelected}"
      />
      <div class="log-render-wrapper">
        ${repeat(
          this.selectedFileList,
          (file) => file.name,
          (file) => html`
          <${unsafeStatic(
            LOG_RENDER_COMPONENT_NAME
          )} .source="${file}" class="log-render">
          </${unsafeStatic(LOG_RENDER_COMPONENT_NAME)}>
        `
        )}
      </div>
    `;
  }

  private handleFileSelected() {
    if (!notUAN(this.fileSelect.files) || this.fileSelect.files.length <= 0) {
      return;
    }

    this.selectedFileList = Array.from(this.fileSelect.files);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [COMPONENT_NAME]: GloggViewComponent;
  }
}
