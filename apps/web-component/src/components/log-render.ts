import { css, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { until } from "lit/directives/until.js";
import { repeat } from "lit/directives/repeat.js";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "../global-styles";
import { componentNameJoinPrefix } from "../config/prefix";
import {
  BlobReader,
  BlobReaderFactory,
  BlobReaderFactoryOptions,
  BlobReaderLoadState,
} from "@glogg-web/file-operator";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import { UntilDirective } from "lit-html/directives/until";
import { DirectiveResult } from "lit-html/directive";
import { styleMap } from "lit-html/directives/style-map.js";
import { notUAN } from "@siaikin/utils";

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

  @property()
  buffer: number = 1;

  @property()
  format: (logContent: string) => string = (logContent) => logContent;

  @state()
  private oneRowHeight: number = 0;

  @state()
  private oneFragmentHeight: number = 0;

  @state()
  private spacerHeight: number = 0;

  @state()
  private viewPortRect?: DOMRect;

  @state()
  private currentFragmentIndex = 0;

  private wrapperElement?: HTMLDivElement;
  private contentWrapperElement?: HTMLOListElement;

  private spacerElement?: HTMLDivElement;

  private blobReader: BlobReader | undefined;
  private fragmentLineNumber = 0;

  private logBlockList: Array<DirectiveResult<typeof UntilDirective>> = [
    this.wrapLogContent("x"),
  ];

  // private resizeObserver?: ResizeObserver;

  protected override async firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);

    await this.initial();

    this.requestUpdate();
  }

  /**
   * 1. calc one row height, {@link wrapperElement} need exist.
   * 2. get wrapperElement rect
   * 3. calc number of line of fragment
   * 4. wait {@link blobReader} load complete
   * 5. calc {@link spacerElement} height
   *
   * 1. 计算单行的高度, 此时 {@link wrapperElement} 必须已存在.
   * 2. 获取到 {@link wrapperElement} 元素的 宽高信息.
   * 3. 计算单个 {@link Fragment} 占用的高度.
   * 4. 等待创建的 {@link BlobReader} 加载完成
   * 5. 计算 {@link spacerElement} 的高度
   */
  override render() {
    const startIndex =
      this.fragmentLineNumber *
      Math.max(0, this.currentFragmentIndex - this.buffer);

    return html`<div class="wrapper" @scroll="${this.handleScroll}">
      <ol
        start="${startIndex}"
        class="content-wrapper"
        style="transform: translateY(${`${
          Math.max(0, this.currentFragmentIndex - 1) * this.oneFragmentHeight
        }px`})"
      >
        ${this.pickUpLogBlock()}
      </ol>
      <div
        class="spacer"
        style="${styleMap({ height: `${this.spacerHeight}px` })}"
      ></div>
    </div>`;
  }

  private async getFragmentTextArray(
    fragmentIndex: number
  ): Promise<Array<string>> {
    return this.blobReader!.requestFragment(fragmentIndex).toTextArray();
  }

  private pickUpLogBlock(): Array<DirectiveResult<typeof UntilDirective>> {
    if (
      !notUAN(this.blobReader) ||
      this.blobReader.state !== BlobReaderLoadState.LOADED
    ) {
      return [this.logBlockList[0]];
    }
    const logBlockIndexSet: Set<number> = new Set<number>();

    for (let i = this.buffer + 1; i--; ) {
      logBlockIndexSet.add(this.currentFragmentIndex - i);
      logBlockIndexSet.add(this.currentFragmentIndex + i);
    }
    logBlockIndexSet.add(this.currentFragmentIndex);

    let result = Array.from(logBlockIndexSet).sort();

    if (result[0] < 0) {
      const delta = -result[0];

      result = result.map((logBlockIndex) => logBlockIndex + delta);
    }

    const maxSize = this.blobReader.size;
    result = result.filter((logBlockIndex) => {
      return logBlockIndex < maxSize;
    });

    return result.map((logBlockIndex) => {
      if (!this.logBlockList[logBlockIndex]) {
        this.logBlockList[logBlockIndex] = until(
          this.getFragmentTextArray(logBlockIndex).then((logList) =>
            repeat(
              logList,
              (LogContent) => LogContent,
              (logContent) => this.wrapLogContent(logContent)
            )
          )
        );
      }

      return this.logBlockList[logBlockIndex];
    });
  }

  private async initial() {
    this.wrapperElement =
      this.wrapperElement ||
      (this.shadowRoot?.querySelector(".wrapper") as HTMLDivElement);
    this.contentWrapperElement =
      this.contentWrapperElement ||
      (this.shadowRoot?.querySelector(".content-wrapper") as HTMLOListElement);
    this.spacerElement =
      this.spacerElement ||
      (this.shadowRoot?.querySelector(".spacer") as HTMLDivElement);

    this.oneRowHeight = await this.calcOneRowHeight(this.contentWrapperElement);

    this.logBlockList.pop();

    this.viewPortRect = this.wrapperElement.getBoundingClientRect();

    this.oneFragmentHeight =
      Math.ceil(this.viewPortRect.height / this.oneRowHeight) *
      this.oneRowHeight;

    /**
     * 计算当前视口可容纳的最大行数(向上取整)
     */
    this.fragmentLineNumber = Math.ceil(
      this.viewPortRect.height / this.oneRowHeight
    );
    this.blobReader = BlobReaderFactory.getInstance(
      new BlobReaderFactoryOptions({
        baseUrl:
          "../../node_modules/@glogg-web/file-operator/dist/esm/worker/bundle",
        readerFragment: {
          lines: this.fragmentLineNumber,
        },
      })
    ).getReader(this.source);

    this.blobReader.addEventListener("blob-load-progress", ({ message }) => {
      console.log((message.data.loaded / message.data.total) * 100);
    });

    await this.blobReader.loaded;

    this.spacerHeight = await this.calcSpacerHeight();
  }

  private wrapLogContent(logContent: string): TemplateResult {
    return html`<li>${unsafeHTML(this.format(logContent))}</li>`;
  }

  private async calcOneRowHeight(wrapperElement: Element): Promise<number> {
    await this.updateComplete;
    return wrapperElement.getBoundingClientRect().height;
  }

  private async calcSpacerHeight(): Promise<number> {
    if (!this.blobReader) throw new Error();

    let size = this.blobReader.size * this.fragmentLineNumber;
    // for (let i = 0; i < this.blobReader.size; i++) {
    //   size += this.blobReader.requestFragment(i).lineNumber;
    // }

    return size * this.oneRowHeight;
  }

  private async handleScroll(): Promise<void> {
    await this.dynamicLoadFragment(this.wrapperElement?.scrollTop || 0);
  }

  private async dynamicLoadFragment(scrollDistance: number): Promise<void> {
    if (!this.viewPortRect) return;

    const num = scrollDistance / this.oneFragmentHeight;
    const currentFragmentIndex =
      Math.trunc(num) + (num - Math.trunc(num) >= 0.5 ? 1 : 0);

    if (this.currentFragmentIndex === currentFragmentIndex) return;

    this.currentFragmentIndex = currentFragmentIndex;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [LOG_RENDER_COMPONENT_NAME]: LogRenderComponent;
  }
}
