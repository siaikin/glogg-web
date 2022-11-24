import { css, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { until } from "lit/directives/until.js";
import { repeat } from "lit/directives/repeat.js";
import { customElement, property } from "lit/decorators.js";
import { globalStyles } from "../global-styles";
import { componentNameJoinPrefix } from "../config/prefix";
import {
  BlobReaderLoadState,
  LineByLineBlobReader,
} from "@glogg-web/file-operator";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import { UntilDirective } from "lit-html/directives/until";
import { DirectiveResult } from "lit-html/directive";
import { styleMap } from "lit-html/directives/style-map.js";
import { notUAN } from "@siaikin/utils";

export const VIRTUAL_SCROLL_COMPONENT_NAME =
  componentNameJoinPrefix("virtual-scroll");

@customElement(VIRTUAL_SCROLL_COMPONENT_NAME)
export class VirtualScrollComponent extends LitElement {
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
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;

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
  blobReader!: LineByLineBlobReader;

  /**
   * 缓冲区大小
   */
  @property()
  buffer: number = 1;

  /**
   * 自定义格式化内容
   * @param logContent
   */
  @property()
  format: (logContent: string) => string = (logContent) => logContent;

  private oneRowHeight: number = 0;

  private spacerHeight: number = 0;

  private viewPortRect?: DOMRect;

  private wrapperElement?: HTMLDivElement;
  private contentWrapperElement?: HTMLOListElement;
  private spacerElement?: HTMLDivElement;

  /**
   * 当前渲染第一行的下标
   * @private
   */
  private renderLineIndex = 0;

  /**
   * 当前视口所能容纳的最小行数
   * @private
   */
  private viewportRowSize = 0;

  // private resizeObserver?: ResizeObserver;

  protected override async firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);

    await this.initial();

    this.requestUpdate();
  }

  private pickUpLogBlock(): DirectiveResult<typeof UntilDirective> {
    if (
      !notUAN(this.blobReader) ||
      this.blobReader.state !== BlobReaderLoadState.LOADED
    ) {
      return [this.wrapLogContent("x")];
    }

    const startIndex = Math.max(this.renderLineIndex - this.buffer, 0);
    const endIndex = this.renderLineIndex + this.viewportRowSize + this.buffer;

    return until(
      this.blobReader
        .readLines(startIndex, endIndex - startIndex)
        .then((data) => {
          return repeat(
            data.lines,
            (LogContent) => LogContent,
            (logContent) => this.wrapLogContent(logContent)
          );
        })
    );
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

    this.viewPortRect = this.wrapperElement.getBoundingClientRect();

    /**
     * 计算当前视口可容纳的最大行数(向上取整)
     */
    this.viewportRowSize = Math.ceil(
      this.viewPortRect.height / this.oneRowHeight
    );

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

    return this.blobReader.totalLines * this.oneRowHeight;
  }

  private async handleScroll(): Promise<void> {
    await this.dynamicLoadFragment(this.wrapperElement?.scrollTop || 0);
  }

  private async dynamicLoadFragment(scrollDistance: number): Promise<void> {
    if (!this.viewPortRect) return;

    const currentLineIndex = Math.ceil(scrollDistance / this.oneRowHeight);

    if (this.renderLineIndex === currentLineIndex) return;

    this.renderLineIndex = currentLineIndex;
    await new Promise((resolve) => setTimeout(resolve));
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
    return html`<div class="wrapper" @scroll="${this.handleScroll}">
      <ol
        start="${this.renderLineIndex}"
        class="content-wrapper"
        style="transform: translateY(${this.renderLineIndex *
          this.oneRowHeight +
        "px"})"
      >
        ${this.pickUpLogBlock()}
      </ol>
      <div
        class="spacer"
        style="${styleMap({ height: `${this.spacerHeight}px` })}"
      ></div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [VIRTUAL_SCROLL_COMPONENT_NAME]: VirtualScrollComponent;
  }
}
